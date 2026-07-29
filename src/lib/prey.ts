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

export const PREY_BONUSES: { value: PreyBonus; label: string; hint: string; emoji: string }[] = [
  { value: "xp", label: "XP Bonus", hint: "mais experiência", emoji: "✨" },
  { value: "loot", label: "Improved Loot", hint: "mais lucro", emoji: "💰" },
  { value: "damage", label: "Damage Boost", hint: "mais dano", emoji: "⚔️" },
  { value: "defense", label: "Damage Reduction", hint: "mais defesa", emoji: "🛡️" },
];

export function preyBonusLabel(b: string): string {
  return PREY_BONUSES.find((x) => x.value === b)?.label ?? b;
}

export function preyBonusEmoji(b: string): string {
  return PREY_BONUSES.find((x) => x.value === b)?.emoji ?? "";
}

/** Short human label, e.g. "XP Bonus 40% (Ingol)". */
export function preySlotLabel(slot: { bonus: string; pct?: number | null; creature?: string | null }): string {
  const pct = slot.pct != null ? ` ${slot.pct}%` : "";
  const creature = slot.creature ? ` (${slot.creature})` : "";
  return `${preyBonusLabel(slot.bonus)}${pct}${creature}`;
}

/** Accepts "40", "40%", "40,5". Returns null when empty/invalid. */
export function parsePct(raw: string): number | null {
  const s = raw.trim().replace("%", "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 10) / 10;
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
