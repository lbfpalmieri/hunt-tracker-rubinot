import type { Death } from "./store";
import type { HuntingData } from "./parser";

/**
 * Perda de XP na morte — o próprio Tibia já calcula esse valor (considerando
 * level, bênçãos e promotion) na hora de fechar o Hunting Analyser da sessão,
 * então não precisamos reimplementar a fórmula oficial nem perguntar sobre
 * bênçãos/promoted: se a sessão fechar negativa, esse número já É a perda
 * líquida. O import e a aba Mortes detectam a morte lendo esse valor direto
 * do texto colado, via `detectDeathLoss` abaixo.
 */

/**
 * Detecta se um bloco de Hunting Analyser já parseado teve uma morte, olhando
 * tanto a Raw XP Gain quanto a XP Gain (com bônus). Qual das duas fecha
 * negativa depende dos bônus ativos no momento — a perda de morte não é
 * multiplicada pelo bônus da sessão, então ela "estraga" o campo que tinha
 * menos ganho de caça pra compensar (às vezes é a Raw, às vezes é a com
 * bônus; já vimos sessão real com Raw XP positiva e XP Gain bem negativa).
 * Retorna a XP perdida (positiva) quando detecta uma morte, null quando não.
 */
export function detectDeathLoss(hunting: Pick<HuntingData, "rawXp" | "xpGain">): number | null {
  const worst = Math.min(hunting.rawXp, hunting.xpGain);
  return worst < 0 ? Math.abs(worst) : null;
}

/** Soma da XP perdida em todas as mortes registradas de um personagem. */
export function totalXpLost(deaths: Death[], characterId: string): number {
  return deaths.filter((d) => d.characterId === characterId).reduce((a, d) => a + d.xpLost, 0);
}
