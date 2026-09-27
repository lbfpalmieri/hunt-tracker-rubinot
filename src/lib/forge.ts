/**
 * Tier de equipamento (Exaltation Forge) — tirado da TibiaWiki BR, página "Exaltation Forge"
 * (conferida em 2026-09-27):
 * - Só 5 tipos de item têm tier: armas, armaduras, capacetes, calças e botas. Cada tipo ganha uma
 *   habilidade própria; o efeito é o mesmo em todo tier — o que sobe é a chance de ativar.
 * - O tier máximo vem da Classificação do item (categorias "Forja Classe N"): classe 1 → T1,
 *   2 → T2, 3 → T3, 4 → T10. Nos dados (weapons-data/equipment-data) isso já está no campo
 *   "tier máx" de cada item (conferido item a item contra as categorias; 4 erros da wiki corrigidos
 *   pela classe: Composite Hornbow T2, Yalahari Footwraps T2, Ethereal Coned Hat T10, Green Demon
 *   Armor T10).
 * - Amplification (botas) aumenta a chance de ativação das OUTRAS habilidades de tier.
 */

export type ForgeSlot = "weapon" | "armor" | "head" | "legs" | "feet";

export interface ForgeSkill {
  name: string;
  /** Tipo de item em português. */
  item: string;
  effect: string;
  /** Ícone da wiki (Amplification não tem). */
  icon: string | null;
  /** % de ativação por tier (índice 0 = tier 1). */
  pct: number[];
}

const WIKI = "https://www.tibiawiki.com.br/images";

export const FORGE_SKILLS: Record<ForgeSlot, ForgeSkill> = {
  weapon: {
    name: "Onslaught",
    item: "Arma",
    effect: "Chance de causar 60% de dano extra no ataque (soma com o crítico).",
    icon: `${WIKI}/4/4a/Onslaught.gif`,
    pct: [0.5, 1.05, 1.7, 2.45, 3.3, 4.25, 5.3, 6.45, 7.7, 9.05],
  },
  armor: {
    name: "Ruse",
    item: "Armadura",
    effect: "Chance de esquivar do ataque (dodge), de qualquer criatura ou jogador.",
    icon: `${WIKI}/5/59/Ruse.gif`,
    pct: [0.5, 1.03, 1.62, 2.28, 3.0, 3.78, 4.62, 5.52, 6.48, 7.51],
  },
  head: {
    name: "Momentum",
    item: "Capacete",
    effect:
      "Com logout block ativo, chance de reduzir em 2s o cooldown das magias do grupo secundário.",
    icon: `${WIKI}/2/28/Momentum.gif`,
    pct: [2.0, 4.05, 6.2, 8.45, 10.8, 13.25, 15.8, 18.45, 21.2, 24.05],
  },
  legs: {
    name: "Transcendence",
    item: "Calça",
    effect: "Chance de ativar o avatar da vocação (nível 3) por um período curto.",
    icon: `${WIKI}/a/a1/Transcendence.gif`,
    pct: [0.13, 0.27, 0.44, 0.64, 0.86, 1.11, 1.38, 1.68, 2.0, 2.35],
  },
  feet: {
    name: "Amplification",
    item: "Bota",
    effect: "Aumenta a chance de ativação das outras habilidades de tier que você está usando.",
    icon: null,
    pct: [2.5, 5.4, 9.1, 13.6, 18.9, 25.0, 31.9, 39.6, 48.1, 57.4],
  },
};

export const FORGE_ORDER: ForgeSlot[] = ["weapon", "head", "armor", "legs", "feet"];

export const tierPct = (slot: ForgeSlot, tier: number): number =>
  tier >= 1 ? (FORGE_SKILLS[slot].pct[Math.min(10, tier) - 1] ?? 0) : 0;

/** Tier máximo pela classificação (tabela da wiki). */
export const maxTierForClass = (cls: number) => (cls >= 4 ? 10 : Math.max(0, cls));

export interface ForgeLine {
  slot: ForgeSlot;
  skill: ForgeSkill;
  tier: number;
  /** % de ativação do tier. */
  base: number;
  /** Com a Amplification da bota (null = sem bota com tier, ou é a própria bota). */
  amplified: number | null;
}

/** Habilidades de tier ativas no set, com a chance já amplificada pela bota. */
export function forgeLines(tiers: Partial<Record<ForgeSlot, number>>): ForgeLine[] {
  const amp = tierPct("feet", tiers.feet ?? 0);
  return FORGE_ORDER.filter((s) => (tiers[s] ?? 0) > 0).map((slot) => {
    const tier = tiers[slot]!;
    const base = tierPct(slot, tier);
    return {
      slot,
      skill: FORGE_SKILLS[slot],
      tier,
      base,
      amplified: slot !== "feet" && amp > 0 ? Math.round(base * (1 + amp / 100) * 100) / 100 : null,
    };
  });
}

export const fmtPct = (n: number) => `${n.toFixed(2).replace(".", ",")}%`;
