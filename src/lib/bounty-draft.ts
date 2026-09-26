import { parseXpAmount, type BountyDifficulty, type BountyInfo, type BountyTier } from "./bounty";

/** Rascunho do painel (o XP fica em texto pra aceitar "8kk", "8.000.000"...). */
export interface BountyDraft {
  difficulty: BountyDifficulty | "";
  tier: BountyTier | "";
  xpText: string;
  creature: string | null;
}

export const EMPTY_BOUNTY: BountyDraft = { difficulty: "", tier: "", xpText: "", creature: null };

export function bountyDraftFrom(v: BountyInfo | null): BountyDraft {
  if (!v) return { ...EMPTY_BOUNTY };
  return {
    difficulty: v.difficulty,
    tier: v.tier,
    xpText: v.xp != null ? String(v.xp) : "",
    creature: v.creature ?? null,
  };
}

/** Válido = dificuldade e tipo escolhidos e XP (se digitado) legível. Criatura é opcional. */
export function bountyDraftValid(d: BountyDraft): boolean {
  const xpInvalid = d.xpText.trim().length > 0 && parseXpAmount(d.xpText) == null;
  return Boolean(d.difficulty && d.tier && !xpInvalid);
}

export function bountyFromDraft(d: BountyDraft): BountyInfo | null {
  if (!d.difficulty || !d.tier) return null;
  return {
    difficulty: d.difficulty,
    tier: d.tier,
    xp: parseXpAmount(d.xpText),
    creature: d.creature,
  };
}
