import { ITEM_INFO_TSV } from "@/data/item-info-data";
import { findEquipment } from "@/lib/equipment";
import { findWeapon } from "@/lib/weapons";

/**
 * Dados da TibiaWiki por item de loot (ver src/data/item-info-data.ts): preço de NPC, usado como
 * preço padrão quando a pessoa não definiu o dela, e categoria, pra agrupar o loot da sessão.
 */

export type LootCategory =
  | "imbuement"
  | "task"
  | "coins"
  | "gear"
  | "creature"
  | "valuables"
  | "other";

/** Ordem fixa de desempate; "Outros" sempre por último. */
export const LOOT_CATEGORY_ORDER: LootCategory[] = [
  "imbuement",
  "task",
  "coins",
  "gear",
  "creature",
  "valuables",
  "other",
];

export const LOOT_CATEGORY_LABEL: Record<LootCategory, string> = {
  imbuement: "Itens de imbuement",
  task: "Itens de task (Weekly/Delivery)",
  coins: "Moedas e tokens",
  gear: "Equipamentos",
  creature: "Produtos de criatura",
  valuables: "Gemas e valiosos",
  other: "Outros",
};

interface ItemInfo {
  npc: number;
  flags: string;
}

const COINS_AND_TOKENS = new Set([
  "gold coin",
  "platinum coin",
  "crystal coin",
  "gold token",
  "silver token",
  "tibia coin",
  "tibia coins",
]);

let cache: Map<string, ItemInfo> | null = null;

function table(): Map<string, ItemInfo> {
  if (cache) return cache;
  cache = new Map();
  for (const line of ITEM_INFO_TSV.split(/\r?\n/)) {
    if (!line) continue;
    const [name, npc, flags] = line.split("|");
    cache.set(name.toLowerCase(), { npc: Number(npc) || 0, flags: flags ?? "" });
  }
  return cache;
}

const keyOf = (name: string) => name.trim().toLowerCase();

/** Preço que o NPC paga pelo item (TibiaWiki). null = NPC não compra ou item sem dado. */
export function npcPriceOf(name: string): number | null {
  const n = table().get(keyOf(name))?.npc ?? 0;
  return n > 0 ? n : null;
}

/** Categoria do item do loot. Sem dado conhecido = "other". */
export function lootCategoryOf(name: string): LootCategory {
  const k = keyOf(name);
  if (COINS_AND_TOKENS.has(k)) return "coins";
  const flags = table().get(k)?.flags ?? "";
  if (flags.includes("i")) return "imbuement";
  if (findEquipment(name) || findWeapon(name)) return "gear";
  if (flags.includes("t")) return "task";
  if (flags.includes("p")) return "creature";
  if (flags.includes("v")) return "valuables";
  return "other";
}
