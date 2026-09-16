import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ElementMods } from "./monster-weakness";

/**
 * Busca a resistência elemental de monstros na TibiaWiki (mesma wiki usada
 * pros sprites — ver game-icon.ts) pra alimentar a recomendação "qual
 * elemento é mais forte contra os monstros dessa hunt" no dashboard.
 *
 * Diferente da página /wiki/<nome> (que tem proteção anti-bot e não pode ser
 * lida pelo servidor — ver rubinot-tibiawiki-sprites na memória), o endpoint
 * da API do MediaWiki (api.php) NÃO tem esse bloqueio: devolve o wikitext
 * fonte da página, de onde a Infobox_Criatura tira campos limpos tipo
 * "fireDmgMod = 0%". Validado manualmente com curl antes de implementar.
 */

const WIKI_API = "https://www.tibiawiki.com.br/api.php";

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

async function fetchOne(name: string): Promise<ElementMods | null> {
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

const input = z.object({
  names: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
});

/** { weaknesses: { "Dragon": {fire: 0, ice: 110, ...} | null } } — null quando o nome não bate com nada na wiki. */
export const getMonsterWeaknesses = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => input.parse(raw))
  .handler(async ({ data }) => {
    const uniqueNames = [...new Set(data.names)];
    const entries = await Promise.all(uniqueNames.map(async (name) => [name, await fetchOne(name)] as const));
    return { weaknesses: Object.fromEntries(entries) as Record<string, ElementMods | null> };
  });
