import { looksLikePartyText } from "./party";

/**
 * Identifica qual export do Tibia foi colado, para impedir que o usuário cole
 * o Hunt Analyser no campo do Input Analyser (ou vice-versa). "party" = Party Hunt
 * Analyser ("Copy to Clipboard") ou o resultado do LootSplitter — ver party.ts.
 */
export type BlockKind = "hunting" | "damage" | "misc" | "party" | "unknown";

export const BLOCK_LABEL: Record<Exclude<BlockKind, "unknown">, string> = {
  hunting: "Hunting Analyser",
  damage: "Input Analyser",
  misc: "Miscellaneous",
  party: "Party Hunt Analyser",
};

function score(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, re) => (re.test(text) ? acc + 1 : acc), 0);
}

export function detectBlockKind(raw: string): BlockKind {
  const text = raw.replace(/\r/g, "");
  if (!text.trim()) return "unknown";
  // Antes do Hunting: o da party também tem Session data/Supplies/Balance.
  if (looksLikePartyText(text)) return "party";

  const hunting = score(text, [
    /Session data\s*:/i,
    /Session length\s*:/i,
    /Raw XP Gain\s*:/i,
    /\bXP Gain\s*:/i,
    /Killed Monsters\s*:/i,
    /Looted Items\s*:/i,
    /\bSupplies\s*:/i,
    /\bBalance\s*:/i,
  ]);

  const damage = score(text, [
    /Max-?DPS\s*:/i,
    /Damage Types\s*:/i,
    /Damage Sources\s*:/i,
    /Received Damage/i,
    /Total\s*:/i,
  ]);

  const misc = score(text, [
    /Charm(?:\s+Data)?\s*:/i,
    /Imbuement(?:\s+Data)?\s*:/i,
    /Item Upgrade\s*:/i,
    /Killing in the name of/i,
  ]);

  // O Hunt Analyser é inconfundível: tem os campos de sessão + XP.
  if (hunting >= 3) return "hunting";
  if (misc >= 2) return "misc";
  if (damage >= 2) return "damage";
  if (hunting >= 2) return "hunting";
  if (misc >= 1) return "misc";
  if (damage >= 1 && /Max-?DPS|Damage (?:Types|Sources)/i.test(text)) return "damage";
  return "unknown";
}
