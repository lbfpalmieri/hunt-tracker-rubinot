import { createServerFn } from "@tanstack/react-start";

/**
 * Linked Tasks do RubinOT (5 salas, ~20 tasks cada, com criaturas/recompensas),
 * espelhadas de wiki.rubinot.com/pt-BR/linked-tasks — a wiki OFICIAL do
 * servidor, não a TibiaWiki (essa é usada só depois, pra resistência elemental
 * das criaturas, via monster-weakness.functions.ts).
 *
 * Diferente da TibiaWiki, a página da wiki.rubinot.com não tem proteção
 * anti-bot (testado com fetch puro, sem navegador). Só que ela não expõe uma
 * API — os dados vêm embutidos como array JS dentro do chunk estático da
 * página (Next.js), então: 1) buscamos o HTML pra achar o nome do arquivo do
 * chunk (tem hash de build, muda a cada deploy deles); 2) buscamos esse
 * arquivo; 3) extraímos os array literals de dentro dele.
 *
 * IMPORTANTE (segurança): nunca fazemos `eval`/`new Function` nesse JS de
 * terceiro — extraímos os literais por balanceamento de chaves e convertemos
 * pra JSON válido (só citando as chaves, que vêm sem aspas) antes de
 * `JSON.parse`. Também não dependemos dos nomes de variável do bundle (são
 * letras geradas pelo minificador, arbitrárias a cada build) — identificamos
 * o array de salas e os arrays de tasks pelo FORMATO dos objetos (chaves
 * id/name/src = sala; tem quantity+creatures = task), o que é bem mais
 * resistente a mudanças de build do que confiar em nomes de variável.
 *
 * Cacheado na tabela `linked_tasks_cache` (uma linha só, id=1) por
 * LINKED_TASKS_TTL_MS — não em memória do processo, porque o app publica pra
 * Cloudflare Workers e cada request pode cair numa instância diferente,
 * então uma variável de módulo não sobrevive de forma confiável entre
 * chamadas (ver rubinot-linked-tasks-scrape na memória). Se uma atualização
 * falhar (a wiki deles mudou de estrutura, ficou fora do ar etc.), servimos
 * o último snapshot salvo, marcado como `stale`, em vez de quebrar a página
 * pro usuário.
 */

export interface LinkedTaskCreature {
  name: string;
  image: string;
}

export interface LinkedTaskEntry {
  id: number;
  name: string;
  image: string;
  quantity: number;
  creatures: LinkedTaskCreature[];
  rewards: string[];
  repeatedRewards: string[];
}

export interface LinkedTaskRoom {
  id: number;
  name: string;
  image: string;
  tasks: LinkedTaskEntry[];
}

const WIKI_ORIGIN = "https://wiki.rubinot.com";
const PAGE_URL = `${WIKI_ORIGIN}/pt-BR/linked-tasks`;
const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; RubinOTHuntTracker/1.0)" };
const LINKED_TASKS_TTL_MS = 12 * 60 * 60 * 1000;

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Extrai todo array literal declarado como `let nome=[...]` ou `,nome=[...]` (balanceando colchetes/chaves). */
function extractDeclaredArrays(src: string): { name: string; literal: string }[] {
  const results: { name: string; literal: string }[] = [];
  const declRe = /(?:^|[\s;,])(?:let\s+)?([A-Za-z_$][\w$]*)=\[/g;
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(src))) {
    const arrStart = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let j = arrStart; j < src.length; j++) {
      const c = src[j];
      if (c === "[" || c === "{") depth++;
      else if (c === "]" || c === "}") {
        depth--;
        if (depth === 0) {
          end = j + 1;
          break;
        }
      }
    }
    if (end === -1) continue;
    results.push({ name: m[1], literal: src.slice(arrStart, end) });
  }
  return results;
}

/** Object literal (chaves sem aspas) → JSON válido → parse. NUNCA eval. */
function safeParseArrayLiteral(literal: string): unknown[] {
  const jsonish = literal.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
  const parsed = JSON.parse(jsonish);
  if (!Array.isArray(parsed)) throw new Error("não é um array");
  return parsed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isRoomShape(x: any): x is { id: number; name: string; src: string } {
  return (
    x && typeof x === "object" && "id" in x && "name" in x && "src" in x && !("creatures" in x)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTaskShape(x: any): boolean {
  return x && typeof x === "object" && "creatures" in x && "quantity" in x;
}

const abs = (path: string) => (path.startsWith("http") ? path : `${WIKI_ORIGIN}${path}`);

async function fetchLinkedTasksFromWiki(): Promise<LinkedTaskRoom[]> {
  const html = await fetchText(PAGE_URL, 8000);
  const chunkMatch = html.match(/"(\/_next\/static\/chunks\/app\/[^"]*linked-tasks[^"]*\.js)"/);
  if (!chunkMatch)
    throw new Error("Não achei o chunk de dados na página da wiki (layout pode ter mudado).");
  const chunkUrl = `${WIKI_ORIGIN}${chunkMatch[1]}`;
  const js = await fetchText(chunkUrl, 8000);

  const arrays = extractDeclaredArrays(js);
  let roomsRaw: { id: number; name: string; src: string }[] | null = null;
  const taskArrays: {
    id: number;
    name: string;
    src: string;
    quantity: number;
    creatures: { name: string; image: string }[];
    rewards: string[];
    repeated_rewards: string[];
  }[][] = [];

  for (const { literal } of arrays) {
    let parsed: unknown[];
    try {
      parsed = safeParseArrayLiteral(literal);
    } catch {
      continue;
    }
    if (parsed.length === 0) continue;
    if (!roomsRaw && parsed.every(isRoomShape)) {
      roomsRaw = parsed as { id: number; name: string; src: string }[];
      continue;
    }
    if (isTaskShape(parsed[0])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      taskArrays.push(parsed as any[]);
    }
  }

  if (!roomsRaw || roomsRaw.length === 0)
    throw new Error("Não achei a lista de salas no chunk da wiki.");
  if (taskArrays.length !== roomsRaw.length) {
    throw new Error(
      `Achei ${roomsRaw.length} sala(s) mas ${taskArrays.length} lista(s) de task — formato mudou.`,
    );
  }

  return roomsRaw.map((room, i) => ({
    id: room.id,
    name: room.name,
    image: abs(room.src),
    tasks: taskArrays[i].map((t) => ({
      id: t.id,
      name: t.name,
      image: abs(t.src),
      quantity: t.quantity,
      creatures: t.creatures.map((c) => ({ name: c.name, image: abs(c.image) })),
      rewards: t.rewards ?? [],
      repeatedRewards: t.repeated_rewards ?? [],
    })),
  }));
}

/** Lê o snapshot salvo. Falha em silêncio (migration não aplicada ainda, env sem
 * service role, tabela fora do ar) — nesse caso simplesmente não há cache, e a
 * função busca direto da wiki como se o cache nunca tivesse existido. */
async function readCachedRooms(): Promise<{ rooms: LinkedTaskRoom[]; syncedAt: string } | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabaseAdmin as any)
      .from("linked_tasks_cache")
      .select("rooms, synced_at")
      .eq("id", 1)
      .maybeSingle();
    if (error || !row) return null;
    return { rooms: row.rooms as LinkedTaskRoom[], syncedAt: row.synced_at as string };
  } catch {
    return null;
  }
}

/** Salva o snapshot. Falha em silêncio pelo mesmo motivo — não persistir não deve
 * impedir a resposta de ir pro usuário. */
async function writeCachedRooms(rooms: LinkedTaskRoom[], syncedAt: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from("linked_tasks_cache")
      .upsert({ id: 1, rooms, synced_at: syncedAt });
  } catch {
    // sem persistência dessa vez — a próxima chamada busca da wiki de novo, sem drama
  }
}

export const getLinkedTasks = createServerFn({ method: "GET" }).handler(async () => {
  const cached = await readCachedRooms();
  if (cached && Date.now() - new Date(cached.syncedAt).getTime() < LINKED_TASKS_TTL_MS) {
    return { rooms: cached.rooms, syncedAt: cached.syncedAt, stale: false, error: null };
  }

  try {
    const rooms = await fetchLinkedTasksFromWiki();
    const syncedAt = new Date().toISOString();
    await writeCachedRooms(rooms, syncedAt);
    return { rooms, syncedAt, stale: false, error: null };
  } catch (e) {
    if (cached) {
      return {
        rooms: cached.rooms,
        syncedAt: cached.syncedAt,
        stale: true,
        error: (e as Error).message,
      };
    }
    return {
      rooms: [] as LinkedTaskRoom[],
      syncedAt: null as string | null,
      stale: false,
      error: (e as Error).message,
    };
  }
});
