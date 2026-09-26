/**
 * Bounty Task (Task Board, Update de Inverno 2025 — TibiaWiki BR "Bounty Tasks"): o jogador escolhe
 * a dificuldade, o Task Board oferece 3 criaturas, ele pega uma e ao matar a quantidade pedida
 * ganha XP + Bounty Points + 1 Reroll Token. Tasks Silver/Gold (escudo na faixa do nome) pedem mais
 * abates e dão mais recompensa. A XP da recompensa entra no Hunting Analyser — por isso ela é
 * descontada da Raw XP da sessão.
 */
export type BountyDifficulty = "beginner" | "adept" | "expert" | "master";
export type BountyTier = "normal" | "silver" | "gold";

export interface BountyInfo {
  difficulty: BountyDifficulty;
  tier: BountyTier;
  /** Raw XP granted by the bounty completion bonus. Null when unknown. */
  xp: number | null;
  /** Criatura da task (coluna bounty_creature). Ausente em sessões antigas. */
  creature?: string | null;
}

/** Bounty Points base de cada dificuldade (tasks Normal; Silver/Gold dão mais, valor não confirmado). */
export const BOUNTY_BASE_POINTS: Record<BountyDifficulty, number> = {
  beginner: 3,
  adept: 7,
  expert: 16,
  master: 27,
};

/** Criaturas que cada dificuldade oferece (classificação do Bestiário). */
export const BOUNTY_DIFFICULTY_POOL: Record<BountyDifficulty, string> = {
  beginner: "criaturas fáceis do Bestiário",
  adept: "fáceis e médias",
  expert: "médias e difíceis",
  master: "difíceis e desafiadoras",
};

export const BOUNTY_TALISMAN_IMAGE = "https://www.tibiawiki.com.br/images/d/de/Bounty_Talisman.gif";

export const BOUNTY_DIFFICULTIES: { value: BountyDifficulty; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "50–110 abates · 3 BP" },
  { value: "adept", label: "Adept", hint: "80–190 abates · 7 BP" },
  { value: "expert", label: "Expert", hint: "150–310 abates · 16 BP" },
  { value: "master", label: "Master", hint: "300–600 abates · 27 BP" },
];

export const BOUNTY_TIERS: { value: BountyTier; label: string; hint: string }[] = [
  { value: "normal", label: "Normal", hint: "sem escudo" },
  { value: "silver", label: "Silver", hint: "escudo prata · mais abates" },
  { value: "gold", label: "Gold", hint: "escudo dourado · ainda mais" },
];

export function bountyDifficultyLabel(d: string): string {
  return BOUNTY_DIFFICULTIES.find((x) => x.value === d)?.label ?? d;
}

export function bountyTierLabel(t: string): string {
  return BOUNTY_TIERS.find((x) => x.value === t)?.label ?? t;
}

export function bountyLabel(b: { difficulty: string; tier: string }): string {
  return `${bountyDifficultyLabel(b.difficulty)} · ${bountyTierLabel(b.tier)}`;
}

/** Accepts "8000000", "8kk", "8m", "8.5kk", "8.000.000". Returns null when empty/invalid. */
export function parseXpAmount(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s/g, "");
  if (!s) return null;
  const m = s.match(/^([\d.,]+)(kk|kkk|k|m|mm|b)?$/);
  if (!m) return null;
  let numPart = m[1];
  // "8.000.000" / "8,000,000" → thousand separators
  if (/^[\d]{1,3}([.,][\d]{3})+$/.test(numPart)) numPart = numPart.replace(/[.,]/g, "");
  else numPart = numPart.replace(",", ".");
  const n = Number(numPart);
  if (!Number.isFinite(n) || n < 0) return null;
  const mult =
    m[2] === "k" ? 1e3 : m[2] === "kk" || m[2] === "m" || m[2] === "mm" ? 1e6 : m[2] === "kkk" || m[2] === "b" ? 1e9 : 1;
  return Math.round(n * mult);
}

/**
 * Raw XP attributable to the hunt itself (bounty completion bonus removed).
 * When a session is flagged as bounty but the bonus amount is unknown, this
 * returns null so callers can exclude it from averages instead of skewing them.
 */
export function huntRawXp(session: {
  hunting: { rawXp: number; xpGain: number };
  bounty?: BountyInfo | null;
}): number | null {
  const raw = session.hunting.rawXp || session.hunting.xpGain;
  if (!session.bounty) return raw;
  if (session.bounty.xp == null) return null;
  return Math.max(0, raw - session.bounty.xp);
}
