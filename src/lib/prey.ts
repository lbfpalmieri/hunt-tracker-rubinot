/** Prey Creature bonuses active during a hunt session. */
export type PreyBonus = "xp" | "loot" | "damage" | "defense";

export interface PreySlot {
  /** Which prey bonus was active in this slot. */
  bonus: PreyBonus;
  /** Bonus percentage (0-100). Null when the player didn't inform it. */
  pct: number | null;
  /** Prey creature name. Empty/null when unknown. */
  creature: string | null;
}

/**
 * Regras do Prey System (TibiaWiki BR "Prey System" + TibiaWiki EN, conferido em 2026-09-26):
 * - até 3 slots: Premium tem 2 liberados; o 3º é o "Permanent Prey Slot" comprado na Store;
 * - 1 criatura por slot, 1 bônus por criatura, e a mesma criatura nunca aparece em 2 slots;
 * - cada bônus tem 10 estrelas (steps): Dano 7–25% (de 2 em 2), Redução 12–30% (de 2 em 2),
 *   XP e Loot 13–40% (de 3 em 3).
 * Sessões salvas antes dessas regras podem ter a mesma criatura com 2 bônus — ficam como estão.
 */
export const PREY_MAX_SLOTS = 3;
export const PREY_UNLOCKED_SLOTS = 2;
export const PREY_MAX_STARS = 10;

const PREY_STEP: Record<PreyBonus, { min: number; step: number }> = {
  xp: { min: 13, step: 3 },
  loot: { min: 13, step: 3 },
  damage: { min: 7, step: 2 },
  defense: { min: 12, step: 2 },
};

/** Percentual do bônus com N estrelas (1–10). */
export function preyPctForStars(bonus: PreyBonus, stars: number): number {
  const { min, step } = PREY_STEP[bonus];
  const n = Math.max(1, Math.min(PREY_MAX_STARS, Math.round(stars)));
  return min + (n - 1) * step;
}

/** Estrelas mais próximas de um percentual salvo (sessões antigas guardavam só o %). */
export function preyStarsForPct(bonus: PreyBonus, pct: number | null | undefined): number {
  if (pct == null) return PREY_MAX_STARS;
  const { min, step } = PREY_STEP[bonus];
  return Math.max(1, Math.min(PREY_MAX_STARS, Math.round((pct - min) / step) + 1));
}

/** Bandeiras dos bônus, as mesmas do jogo (arquivos da TibiaWiki BR, 44x92). */
export const PREY_BONUS_IMAGE: Record<PreyBonus, string> = {
  damage: "https://www.tibiawiki.com.br/images/3/3b/Prey_damage.png",
  defense: "https://www.tibiawiki.com.br/images/b/be/Prey_reduction.png",
  xp: "https://www.tibiawiki.com.br/images/7/7e/Prey_xp.png",
  loot: "https://www.tibiawiki.com.br/images/b/bb/Improved_loot.png",
};

/** Percentual padrão (10 estrelas) de cada bônus. */
export const DEFAULT_PREY_PCT: Record<PreyBonus, number> = {
  xp: 40,
  loot: 40,
  damage: 25,
  defense: 30,
};

export const PREY_BONUSES: { value: PreyBonus; label: string; hint: string; emoji: string }[] = [
  { value: "xp", label: "Bonus XP", hint: "XP extra (13–40%)", emoji: "✨" },
  { value: "loot", label: "Improved Loot", hint: "chance de loot dobrado (13–40%)", emoji: "💰" },
  { value: "damage", label: "Damage Boost", hint: "dano extra (7–25%)", emoji: "⚔️" },
  {
    value: "defense",
    label: "Damage Reduction",
    hint: "menos dano recebido (12–30%)",
    emoji: "🛡️",
  },
];

export function preyBonusLabel(b: string): string {
  return PREY_BONUSES.find((x) => x.value === b)?.label ?? b;
}

/** Short human label, e.g. "XP Bonus 40% (Ingol)". */
export function preySlotLabel(slot: {
  bonus: string;
  pct?: number | null;
  creature?: string | null;
}): string {
  const pct = slot.pct != null ? ` ${slot.pct}%` : "";
  const creature = slot.creature ? ` (${slot.creature})` : "";
  return `${preyBonusLabel(slot.bonus)}${pct}${creature}`;
}

/** Normalizes whatever came from the database into a clean slot list. */
export function normalizePrey(value: unknown): PreySlot[] | null {
  if (!Array.isArray(value)) return null;
  const valid = new Set<string>(PREY_BONUSES.map((b) => b.value));
  const slots = value
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .filter((v) => typeof v.bonus === "string" && valid.has(v.bonus))
    .slice(0, 3)
    .map((v) => ({
      bonus: v.bonus as PreyBonus,
      pct: typeof v.pct === "number" && Number.isFinite(v.pct) ? v.pct : null,
      creature: typeof v.creature === "string" && v.creature.trim() ? v.creature.trim() : null,
    }));
  return slots.length ? slots : null;
}

/** Slots ativos de um determinado bônus. */
export function preySlotsOf(prey: PreySlot[] | null | undefined, bonus: PreyBonus): PreySlot[] {
  return (prey ?? []).filter((s) => s.bonus === bonus);
}

/** Rótulo curto para marcar cards afetados por prey, ex. "Loot com Prey +40%". */
export function preyMarkLabel(
  prey: PreySlot[] | null | undefined,
  bonus: PreyBonus,
): string | null {
  const slots = preySlotsOf(prey, bonus);
  if (!slots.length) return null;
  const names: Record<PreyBonus, string> = {
    xp: "XP com Prey",
    loot: "Loot com Prey",
    damage: "Dano com Prey",
    defense: "Defesa com Prey",
  };
  const pcts = slots.map((s) => s.pct ?? DEFAULT_PREY_PCT[bonus]);
  const sign = bonus === "defense" ? "-" : "+";
  return `${names[bonus]} ${sign}${pcts.join("/")}%`;
}

/** Tooltip detalhado: criaturas com prey daquele bônus. */
export function preyMarkTitle(
  prey: PreySlot[] | null | undefined,
  bonus: PreyBonus,
): string | undefined {
  const slots = preySlotsOf(prey, bonus);
  if (!slots.length) return undefined;
  const list = slots
    .map((s) => `${s.creature ?? "criatura"} (${s.pct ?? DEFAULT_PREY_PCT[bonus]}%)`)
    .join(", ");
  return `Valor influenciado por Prey: ${list}. Sem a prey, o resultado seria menor.`;
}
