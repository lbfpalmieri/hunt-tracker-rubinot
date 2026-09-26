import type { BossType, LootTier } from "@/lib/boss-catalog";

/** Cores do tema da Rotação de Bosses (tipo de boss e raridade de loot). */
export const BOSS_TYPE_COLOR: Record<BossType, string> = {
  archfoe: "oklch(0.64 0.22 25)",
  nemesis: "oklch(0.66 0.2 305)",
  bane: "oklch(0.74 0.13 60)",
  "": "oklch(0.6 0.03 260)",
};

export const LOOT_TIER_COLOR: Record<LootTier, string> = {
  v: "oklch(0.7 0.22 330)",
  r: "var(--rubi-gold)",
  s: "var(--rubi-blue)",
  u: "var(--rubi-success)",
  c: "oklch(0.7 0.02 260)",
};
