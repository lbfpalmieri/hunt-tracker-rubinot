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
 * Mitigado com dois mecanismos: 1) cache em memória do processo (resistência
 * de monstro quase nunca muda, então guardamos por dias — um "não achei"
 * guarda por bem menos tempo, pra não travar um bloqueio temporário como se
 * fosse permanente); 2) no máximo `CONCURRENCY` requisições em paralelo por
 * chamada, em vez de disparar tudo de uma vez.
 */

const WIKI_API = "https://www.tibiawiki.com.br/api.php";
const CONCURRENCY = 3;
const FOUND_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NOT_FOUND_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, { mods: ElementMods | null; expiresAt: number }>();

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

/** Extrai os campos "xDmgMod = Y%" do wikitext da Infobox_Criatura. */
function parseResistances(wikitext: string): ElementMods | null {
  const mods: Partial<ElementMods> = {};
  const re = /\|\s*([a-zA-Z]+DmgMod)\s*=\s*(-?\d+(?:\.\d+)?)\s*%/g;
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

async function fetchFromWiki(name: string): Promise<ElementMods | null> {
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
    if (!res.ok) return null;
    const json = (await res.json()) as {
      query?: { pages?: { revisions?: { content?: string }[]; missing?: boolean }[] };
    };
    const page = json.query?.pages?.[0];
    if (!page || page.missing) return null;
    const content = page.revisions?.[0]?.content;
    return content ? parseResistances(content) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOne(name: string): Promise<ElementMods | null> {
  const cached = cache.get(name);
  if (cached && cached.expiresAt > Date.now()) return cached.mods;

  const mods = await fetchFromWiki(name);
  cache.set(name, { mods, expiresAt: Date.now() + (mods ? FOUND_TTL_MS : NOT_FOUND_TTL_MS) });
  return mods;
}

const input = z.object({
  names: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
});

/** { weaknesses: { "Dragon": {fire: 0, ice: 110, ...} | null } } — null quando o nome não bate com nada na wiki
 * (ou a TibiaWiki bloqueou a requisição por excesso de tráfego — ver nota no topo do arquivo). */
export const getMonsterWeaknesses = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => input.parse(raw))
  .handler(async ({ data }) => {
    const uniqueNames = [...new Set(data.names)];
    const mods = await mapWithConcurrency(uniqueNames, CONCURRENCY, fetchOne);
    const entries = uniqueNames.map((name, i) => [name, mods[i]] as const);
    return { weaknesses: Object.fromEntries(entries) as Record<string, ElementMods | null> };
  });
