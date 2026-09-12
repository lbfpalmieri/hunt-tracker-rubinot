import type { Death } from "./store";

/**
 * Perda de XP na morte — regras oficiais do Tibia (conferidas na TibiaWiki e no
 * painel de Blessings do RubinOT, que segue o mesmo sistema atual de 7 bênçãos).
 *
 * Até o level 23: perde 10% flat de todo o XP acumulado.
 * Do level 24 em diante: perde ((x+50)/100) × 50(x²−5x+8) pontos de XP, onde x
 * é o level — de preferência fracionário (ex: 245.62) pra mais precisão.
 * Essa perda-base é reduzida por: personagem promovido (−30%) e cada bênção
 * ativa (−8%, até 7 bênçãos) — teto de −86% com promoted + 7 bênçãos, que bate
 * exatamente com o que o próprio RubinOT mostra no painel de Blessings.
 */

export const MAX_BLESSINGS = 7;
const BLESSING_REDUCTION = 0.08;
const PROMOTED_REDUCTION = 0.3;

/** XP total necessária pra alcançar um level (aceita level fracionário). Fórmula oficial do Tibia. */
export function totalXpForLevel(level: number): number {
  const L = level;
  return (50 / 3) * (L ** 3 - 6 * L ** 2 + 17 * L - 12);
}

/**
 * Deriva o level fracionário (ex: 245.62) a partir do level inteiro + quanto de
 * XP ainda falta pro próximo level — esse "faltam X XP" é o que o próprio jogo
 * mostra. Sem esse dado, cai pro level inteiro puro (perda sai um pouco menos precisa).
 */
export function fractionalLevel(level: number, xpToNext: number | null | undefined): number {
  if (xpToNext == null || xpToNext <= 0) return level;
  const L = Math.floor(level);
  const span = totalXpForLevel(L + 1) - totalXpForLevel(L);
  if (span <= 0) return level;
  const into = Math.max(0, Math.min(span, span - xpToNext));
  return L + into / span;
}

/** XP perdida na morte ANTES de promoted/bênçãos (level pode ser fracionário). */
export function baseDeathLossXp(level: number): number {
  if (level < 24) {
    // Total acumulado até esse ponto (interpolado dentro do level), 10% flat disso.
    const L = Math.floor(level);
    const frac = level - L;
    const total = totalXpForLevel(L) + frac * (totalXpForLevel(L + 1) - totalXpForLevel(L));
    return Math.max(0, total) * 0.1;
  }
  const x = level;
  return ((x + 50) / 100) * 50 * (x ** 2 - 5 * x + 8);
}

/** Fração de redução da perda de XP: promoted (−30%) + cada bênção ativa (−8%, até 7). */
export function deathReduction(blessings: number, promoted: boolean): number {
  const b = Math.max(0, Math.min(MAX_BLESSINGS, Math.round(blessings)));
  return (promoted ? PROMOTED_REDUCTION : 0) + b * BLESSING_REDUCTION;
}

/** XP final perdida numa morte, já com promoted/bênçãos descontados. */
export function computeDeathXpLoss(params: { level: number; blessings: number; promoted: boolean }): number {
  const base = baseDeathLossXp(params.level);
  const reduction = deathReduction(params.blessings, params.promoted);
  return Math.max(0, Math.round(base * (1 - reduction)));
}

/** Soma da XP perdida em todas as mortes registradas de um personagem. */
export function totalXpLost(deaths: Death[], characterId: string): number {
  return deaths.filter((d) => d.characterId === characterId).reduce((a, d) => a + d.xpLost, 0);
}
