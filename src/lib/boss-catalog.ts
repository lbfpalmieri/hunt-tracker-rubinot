import { supabase } from "@/integrations/supabase/client";
import type { ElementMods } from "./monster-weakness";

/**
 * Catálogo de bosses da Rotação de Bosses — dados da TibiaWiki BR (tibiawiki.com.br, mesma wiki
 * dos sprites/resistências). Os bosses do RubinOT são os mesmos do Tibia.
 *
 * POR QUE A SINCRONIZAÇÃO RODA NO NAVEGADOR: a api.php da wiki passou a devolver desafio do
 * Cloudflare ("Just a moment…", 403) pra requisição de servidor/curl, mas responde normal a
 * navegador e aceita CORS anônimo (`origin=*`). Então o admin clica "Sincronizar" na página,
 * o navegador dele baixa tudo (~45 requisições em lote de 50 títulos) e grava o resultado em
 * `boss_catalog_cache` (linha única). Todo mundo lê do banco — nenhum usuário comum bate na wiki.
 *
 * Formato salvo (compacto, ~100KB): itens deduplicados num array e o loot referencia por índice.
 */

const WIKI_API = "https://www.tibiawiki.com.br/api.php";

export type BossType = "archfoe" | "nemesis" | "bane" | "";
/** c = comum, u = incomum, s = semi-raro, r = raro, v = muito raro (campos lootX da Infobox). */
export type LootTier = "c" | "u" | "s" | "r" | "v";
export const LOOT_TIERS: LootTier[] = ["v", "r", "s", "u", "c"];

export const LOOT_TIER_LABEL: Record<LootTier, string> = {
  v: "Muito raro",
  r: "Raro",
  s: "Semi-raro",
  u: "Incomum",
  c: "Comum",
};

export const BOSS_TYPE_LABEL: Record<Exclude<BossType, "">, string> = {
  archfoe: "Archfoe",
  nemesis: "Nemesis",
  bane: "Bane",
};

export interface CatalogItem {
  name: string;
  /** Preço de venda pra NPC (TibiaWiki). 0 = não vende / sem dado. */
  npc: number;
  /** Faixa de preço de mercado no Tibia oficial (referência — o RubinOT tem economia própria). */
  marketMin: number;
  marketMax: number;
}

export interface Boss {
  name: string;
  hp: number;
  xp: number;
  type: BossType;
  /** Cooldown em segundos (0 = a wiki não informa). */
  cooldownSec: number;
  locations: string[];
  mods: ElementMods;
  loot: Record<LootTier, string[]>;
}

export interface BossCatalog {
  syncedAt: string;
  bosses: Boss[];
  items: Map<string, CatalogItem>;
}

// ---------- formato compacto salvo no banco ----------

const MOD_ORDER = ["physical", "earth", "fire", "death", "energy", "holy", "ice"] as const;
const TIER_ORDER: LootTier[] = ["c", "u", "s", "r", "v"];

/** [name, npc, marketMin, marketMax] */
type CompactItem = [string, number, number, number];
/** [name, hp, xp, type, cooldownSec, "loc1;loc2", mods(7), loot(5 arrays de índices, ordem TIER_ORDER)] */
type CompactBoss = [string, number, number, BossType, number, string, number[], number[][]];

interface CompactCatalog {
  v: 1;
  syncedAt: string;
  items: CompactItem[];
  bosses: CompactBoss[];
}

/**
 * Nome limpo do boss. A Infobox às vezes tem template no campo "name" — "Tentugly's Head" usa
 * `{{#ifeq:{{PAGENAME}}|Home|Tentugly|Tentugly's Head}}` — que aparecia cru na tela. Pro #ifeq
 * vale o ramo "senão" (a página nunca é "Home"); qualquer outro template cai pro título da página.
 */
export function cleanBossName(raw: string, title = ""): string {
  const ifeq = raw.match(/^\{\{#ifeq:[^|]*\|[^|]*\|[^|]*\|([^}]*)\}\}$/);
  if (ifeq) return ifeq[1].trim();
  if (raw.includes("{{") || raw.includes("[[") || !raw.trim())
    return title || raw.replace(/[{}[\]]/g, "").trim();
  return raw.trim();
}

function decode(c: CompactCatalog, syncedAt: string): BossCatalog {
  const items = new Map<string, CatalogItem>();
  for (const [name, npc, marketMin, marketMax] of c.items)
    items.set(name, { name, npc, marketMin, marketMax });
  const bosses = c.bosses.map(([name, hp, xp, type, cooldownSec, loc, mods, loot]): Boss => {
    const m: ElementMods = {};
    MOD_ORDER.forEach((k, i) => (m[k] = mods[i] ?? 100));
    const l = {} as Record<LootTier, string[]>;
    TIER_ORDER.forEach(
      (t, i) => (l[t] = (loot[i] ?? []).map((idx) => c.items[idx]?.[0]).filter(Boolean)),
    );
    return {
      name: cleanBossName(name),
      hp,
      xp,
      type,
      cooldownSec,
      locations: loc ? loc.split(";") : [],
      mods: m,
      loot: l,
    };
  });
  return { syncedAt, bosses, items };
}

// Tabelas novas ainda não estão nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** null = ainda não sincronizado (ou tabela não existe). */
export async function loadBossCatalog(): Promise<BossCatalog | null> {
  const { data, error } = await db
    .from("boss_catalog_cache")
    .select("data, synced_at")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data?.data) return null;
  return decode(data.data as CompactCatalog, data.synced_at);
}

// ---------- sincronização (navegador do admin) ----------

async function wiki(params: Record<string, string>) {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params });
  const res = await fetch(`${WIKI_API}?${qs}`);
  if (!res.ok) throw new Error(`TibiaWiki respondeu ${res.status}`);
  return res.json();
}

async function categoryMembers(cat: string): Promise<string[]> {
  const out: string[] = [];
  let cont: string | undefined;
  do {
    const j = await wiki({
      action: "query",
      list: "categorymembers",
      cmtitle: `Categoria:${cat}`,
      cmlimit: "500",
      cmnamespace: "0",
      ...(cont ? { cmcontinue: cont } : {}),
    });
    out.push(...j.query.categorymembers.map((m: { title: string }) => m.title));
    cont = j.continue?.cmcontinue;
  } while (cont);
  return out;
}

/** Campo "| chave = valor" da Infobox (só na mesma linha — [ \t], não \s, pra não vazar pro campo seguinte). */
function field(content: string, key: string): string {
  const m = content.match(new RegExp(`^\\|[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, "mi"));
  return m ? m[1].trim() : "";
}

/** Nomes dos [[links]] de um campo de loot ("0-100 [[Gold Coin]]s, [[Falcon Plate]]."). */
function links(s: string): string[] {
  return [...s.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)]
    .map((m) => m[1].trim())
    .filter((x) => !/^(Arquivo|File|Categoria|Imagem):/i.test(x));
}

const positive = (s: string) => {
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const allNumbers = (s: string) =>
  (s.match(/\d[\d .]*/g) ?? []).map((x) => Number(x.replace(/[ .]/g, ""))).filter((n) => n > 0);

interface RawPage {
  title: string;
  content: string;
  cats: string[];
}

async function fetchPages(
  titles: string[],
  withCategories: boolean,
  onBatch: () => void,
): Promise<RawPage[]> {
  const pages = new Map<string, RawPage>();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    let cont: Record<string, string> | null = {};
    while (cont) {
      const j = await wiki({
        action: "query",
        prop: withCategories ? "revisions|categories" : "revisions",
        rvprop: "content",
        redirects: "1",
        ...(withCategories ? { cllimit: "max" } : {}),
        titles: batch.join("|"),
        ...cont,
      });
      // Redirecionamentos/normalização: volta pro nome que a gente pediu (é o que o loot usa).
      const back: Record<string, string> = {};
      for (const x of [...(j.query.normalized ?? []), ...(j.query.redirects ?? [])])
        back[x.to] = back[x.from] ?? x.from;
      for (const p of j.query.pages) {
        const title = back[p.title] ?? p.title;
        const cur = pages.get(title) ?? { title, content: "", cats: [] };
        if (!cur.content && p.revisions?.[0]?.content) cur.content = p.revisions[0].content;
        if (p.categories) cur.cats.push(...p.categories.map((c: { title: string }) => c.title));
        pages.set(title, cur);
      }
      const next: Record<string, string> | undefined = j.continue;
      cont = next
        ? Object.fromEntries(Object.entries(next).filter(([k]) => k !== "continue"))
        : null;
      if (cont && Object.keys(cont).length === 0) cont = null;
    }
    onBatch();
  }
  return [...pages.values()];
}

/** Baixa e grava no banco (admin). `onProgress(0..1)` pra barra de progresso. */
export async function syncBossCatalog(onProgress: (p: number) => void): Promise<BossCatalog> {
  const compact = await fetchCompactFromWiki(onProgress);
  const { error } = await db
    .from("boss_catalog_cache")
    .upsert({ id: 1, data: compact, synced_at: compact.syncedAt });
  if (error) throw new Error(error.message);
  onProgress(1);
  return decode(compact, compact.syncedAt);
}

/** Só baixa (sem gravar) — usado pelo sync e útil pra testar sem banco. */
export async function fetchBossCatalogFromWiki(
  onProgress: (p: number) => void = () => {},
): Promise<BossCatalog> {
  const compact = await fetchCompactFromWiki(onProgress);
  return decode(compact, compact.syncedAt);
}

/** Baixa todos os bosses + preço dos itens do loot na TibiaWiki. */
async function fetchCompactFromWiki(onProgress: (p: number) => void): Promise<CompactCatalog> {
  onProgress(0.02);
  const titles = await categoryMembers("Bosses");
  const bossBatches = Math.ceil(titles.length / 50);
  let done = 0;
  const pages = await fetchPages(titles, true, () =>
    onProgress(0.05 + (++done / bossBatches) * 0.35),
  );

  const byName = new Map<
    string,
    { boss: Omit<Boss, "loot"> & { loot: Record<LootTier, string[]> }; size: number }
  >();
  for (const p of pages) {
    const c = p.content;
    if (!c || field(c, "removed")) continue;
    const prim = `${field(c, "primarytype")} ${field(c, "secondarytype")}`;
    const isEvent = /Evento/i.test(prim) || p.cats.some((x) => /Evento/i.test(x));
    if (isEvent) continue;

    const loot: Record<LootTier, string[]> = {
      c: links(field(c, "lootcomum")),
      u: links(field(c, "lootincomum")),
      s: links(field(c, "lootsemiraro")),
      r: links(field(c, "lootraro")),
      v: links(field(c, "lootmuitoraro")),
    };
    if (!TIER_ORDER.some((t) => loot[t].length)) {
      const old = links(field(c, "loot"));
      if (old.length) loot.c = old;
    }
    const size = TIER_ORDER.reduce((a, t) => a + loot[t].length, 0);
    if (!size) continue; // sem loot não interessa pra rotação

    const name = cleanBossName(field(c, "name"), p.title);
    const t = field(c, "bosstype").toLowerCase();
    const mods: ElementMods = {};
    for (const k of MOD_ORDER) {
      const x = field(c, `${k}DmgMod`).match(/-?\d+(\.\d+)?/);
      mods[k] = x ? Number(x[0]) : 100;
    }
    const cd = field(c, "bosscooldown");
    const boss = {
      name,
      hp: positive(field(c, "hp")),
      xp: positive(field(c, "exp")),
      type: (["archfoe", "nemesis", "bane"].includes(t) ? t : "") as BossType,
      cooldownSec: /^\d+$/.test(cd) ? Number(cd) : 0,
      locations: p.cats
        .map((x) => x.match(/^Categoria:Bosses de (.+)$/)?.[1])
        .filter((x): x is string => !!x),
      mods,
      loot,
    };
    // Variações da mesma criatura ("X (Criatura)", fases) — fica a que tem mais loot.
    const prev = byName.get(name);
    if (!prev || size > prev.size) byName.set(name, { boss, size });
  }
  const bosses = [...byName.values()]
    .map((x) => x.boss)
    .sort((a, b) => a.name.localeCompare(b.name));

  const itemNames = [...new Set(bosses.flatMap((b) => TIER_ORDER.flatMap((t) => b.loot[t])))];
  const itemBatches = Math.ceil(itemNames.length / 50);
  done = 0;
  const itemPages = await fetchPages(itemNames, false, () =>
    onProgress(0.4 + (++done / itemBatches) * 0.55),
  );
  const itemInfo = new Map(itemPages.map((p) => [p.title, p.content]));

  const items: CompactItem[] = [];
  const idx = new Map<string, number>();
  const indexOf = (n: string) => {
    let i = idx.get(n);
    if (i == null) {
      const c = itemInfo.get(n) ?? "";
      const market = allNumbers(field(c, "value"));
      i = items.length;
      items.push([
        n,
        allNumbers(field(c, "npcvalue"))[0] ?? 0,
        market.length ? Math.min(...market) : 0,
        market.length ? Math.max(...market) : 0,
      ]);
      idx.set(n, i);
    }
    return i;
  };
  const syncedAt = new Date().toISOString();
  const compact: CompactCatalog = {
    v: 1,
    syncedAt,
    items,
    bosses: bosses.map((b) => [
      b.name,
      b.hp,
      b.xp,
      b.type,
      b.cooldownSec,
      b.locations.join(";"),
      MOD_ORDER.map((k) => b.mods[k] ?? 100),
      TIER_ORDER.map((t) => b.loot[t].map(indexOf)),
    ]),
  };

  return compact;
}

// ---------- helpers de exibição ----------

/** Valor de referência de um item: meio da faixa de mercado; senão o preço de NPC. */
export function itemValue(item: CatalogItem | undefined): number {
  if (!item) return 0;
  if (item.marketMax > 0) return Math.round((item.marketMin + item.marketMax) / 2);
  return item.npc;
}

export type PartyKind = "solo" | "team";

/**
 * A wiki não diz quantos jogadores o boss pede. Estimativa pela vida: até 150k dá pra solo
 * (com o personagem certo); acima disso, time. O usuário corrige boss a boss (user_boss_prefs).
 */
export const SOLO_HP_LIMIT = 150_000;
export function estimatedParty(boss: Boss): PartyKind {
  return boss.hp > 0 && boss.hp <= SOLO_HP_LIMIT ? "solo" : "team";
}

export interface LootHighlight {
  item: string;
  tier: LootTier;
  value: number;
  npc: number;
  bosses: string[];
}

/**
 * Loot de um conjunto de bosses, agrupado por item (o mesmo item pode cair de vários bosses).
 * `rare` = raro/muito raro; `valuable` = o resto que vale pelo menos `minValue`.
 */
export function lootHighlights(bosses: Boss[], catalog: BossCatalog, minValue = 10_000) {
  const map = new Map<string, LootHighlight>();
  const rank: Record<LootTier, number> = { v: 5, r: 4, s: 3, u: 2, c: 1 };
  for (const b of bosses) {
    for (const t of LOOT_TIERS) {
      for (const name of b.loot[t]) {
        if (/^(gold|platinum|crystal) coin$/i.test(name)) continue;
        const it = catalog.items.get(name);
        const cur = map.get(name);
        if (cur) {
          if (!cur.bosses.includes(b.name)) cur.bosses.push(b.name);
          if (rank[t] > rank[cur.tier]) cur.tier = t;
        } else {
          map.set(name, {
            item: name,
            tier: t,
            value: itemValue(it),
            npc: it?.npc ?? 0,
            bosses: [b.name],
          });
        }
      }
    }
  }
  const all = [...map.values()].sort((a, b) => b.value - a.value);
  return {
    rare: all.filter((x) => x.tier === "v" || x.tier === "r"),
    valuable: all.filter((x) => x.tier !== "v" && x.tier !== "r" && x.value >= minValue),
  };
}

/** Itens de uma faixa de raridade do boss, do mais valioso pro menos. */
export function tierItems(boss: Boss, tier: LootTier, catalog: BossCatalog): LootHighlight[] {
  return boss.loot[tier]
    .map((name) => {
      const it = catalog.items.get(name);
      return { item: name, tier, value: itemValue(it), npc: it?.npc ?? 0, bosses: [boss.name] };
    })
    .sort((a, b) => b.value - a.value);
}

/** Maior valor de item raro/muito raro do boss (pra ordenar o catálogo por "melhor loot"). */
export function bestDropValue(boss: Boss, catalog: BossCatalog): number {
  let best = 0;
  for (const n of [...boss.loot.v, ...boss.loot.r])
    best = Math.max(best, itemValue(catalog.items.get(n)));
  return best;
}

/** Nome do Hunting Analyser ("grand master oberon", "a falcon plate") → chave de comparação. */
export function normName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/\s+/g, " ");
}

export function fmtCooldown(sec: number): string {
  if (!sec) return "—";
  const h = sec / 3600;
  if (h >= 48) return `${Math.round(h / 24)} dias`;
  if (h >= 1) return `${Math.round(h)}h`;
  return `${Math.round(sec / 60)}min`;
}
