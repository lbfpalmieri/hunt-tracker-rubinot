/**
 * Valor do loot por item na página da sessão. Não existe fonte geral de preços: o valor vem de
 * "Meus preços" (public.user_item_prices, por servidor — o mesmo do registro de boss) e das moedas,
 * que valem sempre o mesmo. Item sem preço aparece sem valor (o jogador pode preencher na hora).
 */
export const COIN_VALUE: Record<string, number> = {
  "gold coin": 1,
  "platinum coin": 100,
  "crystal coin": 10_000,
};

export interface LootRow {
  name: string;
  count: number;
  /** Preço de 1 unidade (null = sem preço definido). */
  unit: number | null;
  /** unit × count (null = sem preço). */
  total: number | null;
  fromCoins: boolean;
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
): LootValue {
  const rows: LootRow[] = items.map((it) => {
    const coin = COIN_VALUE[it.name.trim().toLowerCase()];
    const unit = coin ?? prices.get(it.name) ?? null;
    return {
      name: it.name,
      count: it.count,
      unit,
      total: unit == null ? null : unit * it.count,
      fromCoins: coin != null,
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
