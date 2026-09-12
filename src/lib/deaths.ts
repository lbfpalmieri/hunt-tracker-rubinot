import type { Death } from "./store";

/**
 * Perda de XP na morte — o próprio Tibia já calcula esse valor (considerando
 * level, bênçãos e promotion) na hora de fechar o Hunting Analyser da sessão,
 * então não precisamos reimplementar a fórmula oficial nem perguntar sobre
 * bênçãos/promoted: se a Raw XP Gain colada vier negativa, esse número já É a
 * perda líquida. Ver `parseHunting` (lib/parser.ts) — o import e a aba Mortes
 * detectam a morte lendo esse valor direto do texto colado.
 */

/** Soma da XP perdida em todas as mortes registradas de um personagem. */
export function totalXpLost(deaths: Death[], characterId: string): number {
  return deaths.filter((d) => d.characterId === characterId).reduce((a, d) => a + d.xpLost, 0);
}
