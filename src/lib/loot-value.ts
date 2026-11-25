import { LOOT_CATEGORY_ORDER, lootCategoryOf, npcPriceOf, type LootCategory } from "@/lib/item-info";

/**
 * Valor do loot por item na página da sessão. O valor vem de "Meus preços" (public.user_item_prices,
 * por servidor — o mesmo do registro de boss); sem preço do jogador, usa o preço de NPC da TibiaWiki
 * como padrão (marcado como "npc"); as moedas valem sempre o mesmo. Item sem nenhum dos dois aparece
 * sem valor (o jogador pode preencher na hora).
 */
export const COIN_VALUE: Record<string, number> = {
  "gold coin": 1,
  "platinum coin": 100,
  "crystal coin": 10_000,
};

/** De onde veio o preço: do jogador, do NPC da TibiaWiki, das moedas, ou ainda não tem. */
export type PriceSource = "mine" | "npc" | "coin" | null;

export interface LootRow {
  name: string;
  count: number;
  /** Preço de 1 unidade (null = sem preço definido). */
  unit: number | null;
  /** unit × count (null = sem preço). */
  total: number | null;
  fromCoins: boolean;
  source: PriceSource;
  /** Preço de NPC da TibiaWiki (referência), se existir. */
  npc: number | null;
}

export interface LootValue {
  rows: LootRow[];
  /** Soma dos itens que têm preço. */
  pricedTotal: number;
  /** Quantos tipos de item ainda estão sem preço. */
  unpriced: number;
}

export function valueLoot(
  items: { name: string; count: number }[],
  prices: Map<string, number>,
  npcOf: (name: string) => number | null = npcPriceOf,
): LootValue {
  const rows: LootRow[] = items.map((it) => {
    const coin = COIN_VALUE[it.name.trim().toLowerCase()];
    const mine = prices.get(it.name);
    const npc = coin != null ? null : npcOf(it.name);
    const unit = coin ?? mine ?? npc ?? null;
    const source: PriceSource = coin != null ? "coin" : mine != null ? "mine" : npc != null ? "npc" : null;
    return {
      name: it.name,
      count: it.count,
      unit,
      total: unit == null ? null : unit * it.count,
      fromCoins: coin != null,
      source,
      npc,
    };
  });
  return {
    rows,
    pricedTotal: rows.reduce((a, r) => a + (r.total ?? 0), 0),
    unpriced: rows.filter((r) => r.total == null).length,
  };
}

export type LootSort = "value" | "count";

/** Mais valioso primeiro; sem preço vai pro fim (por quantidade). */
export function sortLoot(rows: LootRow[], by: LootSort): LootRow[] {
  const list = rows.slice();
  if (by === "count") return list.sort((a, b) => b.count - a.count);
  return list.sort((a, b) => {
    if (a.total == null && b.total == null) return b.count - a.count;
    if (a.total == null) return 1;
    if (b.total == null) return -1;
    return b.total - a.total;
  });
}

export interface LootGroup {
  category: LootCategory;
  rows: LootRow[];
  /** Soma dos itens do grupo que têm preço. */
  total: number;
}

/**
 * Agrupa o loot por categoria (imbuement, task, moedas, equipamento...), com o subtotal de cada
 * grupo. Dentro do grupo vale a ordenação escolhida; os grupos vão do que mais pagou pro que menos
 * (empate pela ordem fixa), e "Outros" fica sempre por último. Grupo vazio não aparece.
 */
export function groupLoot(
  rows: LootRow[],
  by: LootSort,
  categoryOf: (name: string) => LootCategory = lootCategoryOf,
): LootGroup[] {
  const buckets = new Map<LootCategory, LootRow[]>();
  for (const r of rows) {
    const c = categoryOf(r.name);
    const list = buckets.get(c);
    if (list) list.push(r);
    else buckets.set(c, [r]);
  }
  const groups: LootGroup[] = [...buckets].map(([category, list]) => ({
    category,
    rows: sortLoot(list, by),
    total: list.reduce((a, r) => a + (r.total ?? 0), 0),
  }));
  const order = (c: LootCategory) => LOOT_CATEGORY_ORDER.indexOf(c);
  return groups.sort((a, b) => {
    if (a.category === "other") return 1;
    if (b.category === "other") return -1;
    return b.total - a.total || order(a.category) - order(b.category);
  });
}
