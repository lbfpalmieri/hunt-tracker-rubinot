import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ElementMods } from "./monster-weakness";

/**
 * Busca a resistência elemental de monstros na TibiaWiki (mesma wiki usada
 * pros sprites — ver game-icon.ts) pra alimentar a recomendação "qual
 * elemento é mais forte contra os monstros dessa hunt" no dashboard e na
 * Linked Tasks.
 *
 * Diferente da página /wiki/<nome> (que tem proteção anti-bot e não pode ser
 * lida pelo servidor — ver rubinot-tibiawiki-sprites na memória), o endpoint
 * da API do MediaWiki (api.php) NÃO tem bloqueio fixo — só que sob rajada de
 * requisições (vários monstros de uma vez, de vários usuários) o Cloudflare
 * deles começa a devolver 403 pra parte dos nomes, mesmo alternando qual.
 * Mitigado com dois mecanismos: 1) cache na tabela `monster_weakness_cache`
 * (resistência de monstro quase nunca muda, então guardamos por dias — um
 * "não achei" guarda por bem menos tempo, pra não travar um bloqueio
 * temporário como se fosse permanente); 2) no máximo `CONCURRENCY`
 * requisições em paralelo por chamada, em vez de disparar tudo de uma vez.
 * O cache é em tabela (não em memória do processo) porque o app publica pra
 * Cloudflare Workers — memória de módulo não sobrevive de forma confiável
 * entre requests lá, cada um pode cair numa instância diferente.
 *
 * ARMADILHA JÁ CAÍDA: nem toda página da Infobox_Criatura escreve os campos
 * "xDmgMod" com "%" no final — "Rootthing Bug Tracker", por exemplo, tem
 * "physicalDmgMod = 85" sem o sinal. O regex de parseResistances exigia "%"
 * obrigatório e ignorava esses casos silenciosamente (a criatura parecia
 * "sem dado" quando na verdade tinha, só formatado diferente). O "%" agora é
 * opcional. Isso é bem mais comum que criatura genuinamente ausente da wiki
 * (o cache de "permanent" abaixo existe pros casos raros que são mesmo
 * exclusivos do RubinOT).
 */

const WIKI_API = "https://www.tibiawiki.com.br/api.php";
const CONCURRENCY = 3;
const FOUND_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NOT_FOUND_TTL_MS = 15 * 60 * 1000;

/** Roda `fn` pra cada item com no máximo `limit` promessas em voo ao mesmo tempo. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Nome do campo na Infobox_Criatura → chave do nosso ElementMods. */
const DMG_MOD_FIELDS: Record<string, keyof ElementMods> = {
  physicaldmgmod: "physical",
  earthdmgmod: "earth",
  firedmgmod: "fire",
  deathdmgmod: "death",
  energydmgmod: "energy",
  holydmgmod: "holy",
  icedmgmod: "ice",
  drowndmgmod: "drown",
  drowningdmgmod: "drown",
  lifedraindmgmod: "lifedrain",
  manadraindmgmod: "manadrain",
};

/** Extrai os campos "xDmgMod = Y%" do wikitext da Infobox_Criatura. O "%" é opcional —
 * algumas páginas escrevem "= 85" sem o sinal, não só "= 85%" (confirmado em "Rootthing
 * Bug Tracker": o campo existe mas SEM "%", e o regex antigo (que exigia "%") simplesmente
 * não casava nada, fazendo a criatura parecer "sem dado" quando na verdade tinha). */
function parseResistances(wikitext: string): ElementMods | null {
  const mods: Partial<ElementMods> = {};
  const re = /\|\s*([a-zA-Z]+DmgMod)\s*=\s*(-?\d+(?:\.\d+)?)\s*%?\s*$/gm;
  let m: RegExpExecArray | null;
  let found = false;
  while ((m = re.exec(wikitext))) {
    const key = DMG_MOD_FIELDS[m[1].toLowerCase()];
    if (key) {
      mods[key] = Number(m[2]);
      found = true;
    }
  }
  return found ? (mods as ElementMods) : null;
}

interface FetchResult {
  mods: ElementMods | null;
  /** true = confirmado que a TibiaWiki não tem esse nome (ou a página existe mas não
   * lista resistência) — não adianta reconsultar, provavelmente é criatura exclusiva do
   * RubinOT. false = não deu pra checar agora (rede, timeout, bloqueio de tráfego) —
   * vale tentar de novo em breve. */
  permanent: boolean;
}

async function fetchFromWiki(name: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = new URL(WIKI_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", name);
    url.searchParams.set("prop", "revisions");
    url.searchParams.set("rvprop", "content");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatversion", "2");
    url.searchParams.set("redirects", "1");

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RubinOTHuntTracker/1.0)" },
    });
    if (!res.ok) return { mods: null, permanent: false };
    const json = (await res.json()) as {
      query?: { pages?: { revisions?: { content?: string }[]; missing?: boolean }[] };
    };
    const page = json.query?.pages?.[0];
    if (!page || page.missing) return { mods: null, permanent: true };
    const content = page.revisions?.[0]?.content;
    const mods = content ? parseResistances(content) : null;
    return { mods, permanent: mods === null };
  } catch {
    return { mods: null, permanent: false };
  } finally {
    clearTimeout(timeout);
  }
}

const input = z.object({
  names: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
});

/** Lê o que já está em cache pros nomes pedidos. Falha em silêncio (migration não
 * aplicada, env sem service role etc.) — nesse caso ninguém tem cache, e todo
 * mundo cai no caminho de buscar da wiki, igual antes desse cache existir. */
async function readCachedWeaknesses(
  names: string[],
): Promise<Map<string, { mods: ElementMods | null; permanent: boolean; updated_at: string }>> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("monster_weakness_cache")
      .select("name, mods, permanent, updated_at")
      .in("name", names);
    if (error || !rows) return new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Map(rows.map((r: any) => [r.name as string, r]));
  } catch {
    return new Map();
  }
}

async function writeCachedWeaknesses(
  rows: { name: string; mods: ElementMods | null; permanent: boolean }[],
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updated_at = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from("monster_weakness_cache")
      .upsert(rows.map((r) => ({ ...r, updated_at })));
  } catch {
    // sem persistência dessa vez — a próxima chamada busca da wiki de novo, sem drama
  }
}

/** { weaknesses: { "Dragon": {...}|null }, permanent: { "Roothing X": true } }
 * `weaknesses[nome] == null` quando não achou resistência. Nesse caso, `permanent[nome]`
 * diz se é definitivo (a TibiaWiki não tem essa criatura ou a página não lista
 * resistência — comum em conteúdo exclusivo do RubinOT) ou só não deu pra checar agora
 * (bloqueio de tráfego, timeout — vale a pena tentar de novo em alguns minutos). */
export const getMonsterWeaknesses = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => input.parse(raw))
  .handler(async ({ data }) => {
    const uniqueNames = [...new Set(data.names)];
    const byName = await readCachedWeaknesses(uniqueNames);

    const now = Date.now();
    const weaknesses: Record<string, ElementMods | null> = {};
    const permanent: Record<string, boolean> = {};
    const stale: string[] = [];
    for (const name of uniqueNames) {
      const row = byName.get(name);
      const ttl = row?.mods || row?.permanent ? FOUND_TTL_MS : NOT_FOUND_TTL_MS;
      if (row && now - new Date(row.updated_at).getTime() < ttl) {
        weaknesses[name] = row.mods;
        permanent[name] = row.permanent;
      } else {
        stale.push(name);
      }
    }

    if (stale.length > 0) {
      const fetched = await mapWithConcurrency(stale, CONCURRENCY, fetchFromWiki);
      await writeCachedWeaknesses(stale.map((name, i) => ({ name, ...fetched[i] })));
      stale.forEach((name, i) => {
        weaknesses[name] = fetched[i].mods;
        permanent[name] = fetched[i].permanent;
      });
    }

    return { weaknesses, permanent };
  });
