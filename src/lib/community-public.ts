import { isSplit, normalizeParty } from "./party";

/**
 * O que a Comunidade (páginas públicas, sem login) pode expor de uma sessão. Fica fora de
 * community.functions.ts pra ser testado (__tests__/comunidade-privacidade.test.ts).
 */

/**
 * Party exposta na Comunidade: só o tamanho e se o lucro é a parte dividida. Os NOMES dos
 * membros (outros jogadores) nunca saem daqui.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function publicParty(raw: any): { size: number; split: boolean; noXp: boolean } | null {
  const p = normalizeParty(raw);
  return p ? { size: p.size, split: isSplit(p), noXp: !!p.noHuntingAnalyser } : null;
}

/** Columns that are safe to expose publicly. Never include user_id/character_id. */
export const LIST_COLUMNS =
  "id, created_at, hunt_name, char_name, char_vocation, char_level, hunting, damage, bounty_difficulty, bounty_tier, bounty_xp, prey";
export const DETAIL_COLUMNS =
  "id, created_at, hunt_name, char_name, char_vocation, char_level, gear_url, hunting, damage, misc, bounty_difficulty, bounty_tier, bounty_xp, prey";
