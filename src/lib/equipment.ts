import { EQUIPMENT_TSV } from "@/data/equipment-data";
import type { SetupVocation } from "./session-setup";

/**
 * Equipamentos da TibiaWiki (src/data/equipment-data.ts) pro "boneco" do set — o mesmo quadro de
 * slots do inventário do jogo. Cada slot só lista o que encaixa nele e o que a vocação pode usar
 * (item sem vocação na wiki aparece pra todo mundo). Arma e aljava continuam em weapons.ts /
 * setup.weapon / setup.quiver; o resto fica em setup.gear.
 */

/** Slots guardados em setup.gear (arma e aljava têm campo próprio no setup). */
export type GearSlot = "head" | "neck" | "armor" | "legs" | "feet" | "ring" | "shield" | "ammo";

export const GEAR_SLOTS: GearSlot[] = [
  "head",
  "neck",
  "armor",
  "legs",
  "feet",
  "ring",
  "shield",
  "ammo",
];

/** s=escudo/aljava k=spellbook h a l b n r m e — ver equipment-data.ts. */
type DataSlot = "h" | "a" | "l" | "b" | "s" | "k" | "n" | "r" | "m" | "e";

export interface EquipmentInfo {
  name: string;
  slot: DataSlot;
  vocs: string;
  level: number;
  armor: string;
  defense: string;
  skills: string;
  resist: string;
  imbuements: number | null;
  maxTier: number | null;
  attack: string;
  /** Nome pro sprite (título da página na wiki quando difere). */
  icon: string;
  isQuiver: boolean;
}

export const VOC_CODE: Record<SetupVocation, string> = {
  knight: "K",
  paladin: "P",
  sorcerer: "S",
  druid: "D",
  monk: "M",
};

let cache: EquipmentInfo[] | null = null;
let byName: Map<string, EquipmentInfo> | null = null;

export function allEquipment(): EquipmentInfo[] {
  if (cache) return cache;
  const n = (s: string | undefined) => (s && /^\d+$/.test(s) ? Number(s) : null);
  cache = EQUIPMENT_TSV.split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [name, slot, vocs, level, armor, defense, skills, resist, imb, mt, attack, title] =
        line.split("|");
      return {
        name,
        slot: slot as DataSlot,
        vocs: vocs ?? "",
        level: n(level) ?? 0,
        armor: armor ?? "",
        defense: defense ?? "",
        skills: skills ?? "",
        resist: resist ?? "",
        imbuements: n(imb),
        maxTier: n(mt),
        attack: attack ?? "",
        icon: title || name,
        isQuiver: slot === "s" && /quiver/i.test(name),
      };
    });
  return cache;
}

export function findEquipment(name: string | null | undefined): EquipmentInfo | undefined {
  if (!name) return undefined;
  byName ??= new Map(allEquipment().map((e) => [e.name.toLowerCase(), e]));
  return byName.get(name.trim().toLowerCase());
}

const DATA_SLOTS: Record<GearSlot, DataSlot[]> = {
  head: ["h"],
  neck: ["n"],
  armor: ["a"],
  legs: ["l"],
  feet: ["b"],
  ring: ["r"],
  shield: ["s", "k"],
  ammo: ["m", "e"],
};

export const usableBy = (item: { vocs: string }, voc: SetupVocation | null) =>
  !voc || !item.vocs || item.vocs.includes(VOC_CODE[voc]);

/**
 * O que cabe no slot pra vocação, do maior level pro menor.
 * - Mão do escudo: knight/paladino = escudos (paladino também aljavas); magos = spellbooks e
 *   escudos sem vocação. Com arma de duas mãos só sobra a aljava (paladino).
 * - Munição: paladino = flechas/virotes + itens de "Extra Slot"; os outros só os de Extra Slot.
 */
export function equipmentForSlot(
  slot: GearSlot,
  voc: SetupVocation | null,
  opts: { twoHanded?: boolean } = {},
): EquipmentInfo[] {
  const kinds = DATA_SLOTS[slot];
  const list = allEquipment().filter((e) => {
    if (!kinds.includes(e.slot) || !usableBy(e, voc)) return false;
    if (slot === "shield") {
      if (opts.twoHanded && !e.isQuiver) return false;
      if (e.isQuiver) return !voc || voc === "paladin";
    }
    if (slot === "ammo" && e.slot === "m") return !voc || voc === "paladin";
    return true;
  });
  return list.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

/** "Arm 18 · Shielding +4 · Physical +12%" */
export function equipmentSummary(e: EquipmentInfo): string {
  const parts: string[] = [];
  if (e.armor && e.armor !== "0") parts.push(`Arm ${e.armor}`);
  if (e.defense && e.defense !== "0") parts.push(`Def ${e.defense}`);
  if (e.attack) parts.push(`Atq ${e.attack}`);
  if (e.skills) parts.push(shortSkills(e.skills));
  if (e.resist) parts.push(e.resist);
  return parts.join(" · ");
}

/** "Sword Fighting +3, Club Fighting +3" → "Sword +3, Club +3" (cabe na linha). */
export const shortSkills = (s: string) => s.replace(/ Fighting/g, "").replace(/\s+,/g, ",");

export type SetupGear = Partial<Record<GearSlot, string>>;

/**
 * Soma dos bônus do set: skills (+N) e proteções (+N%) de todos os itens equipados.
 * Ex.: { skills: [["Magic Level", 12]], resist: [["Physical", 9], ["Fire", 15]] }.
 */
export function gearBonuses(names: (string | null | undefined)[]) {
  const skills = new Map<string, number>();
  const resist = new Map<string, number>();
  let armor = 0;
  for (const name of names) {
    const e = findEquipment(name);
    if (!e) continue;
    armor += Number(e.armor) || 0;
    for (const part of shortSkills(e.skills).split(",")) {
      const m = part.trim().match(/^(.+?)\s*([+-])\s*(\d+)$/);
      if (m) skills.set(m[1], (skills.get(m[1]) ?? 0) + (m[2] === "-" ? -1 : 1) * Number(m[3]));
    }
    for (const part of e.resist.split(",")) {
      const m = part.trim().match(/^(?:Protection )?([A-Za-z ]+?)\s*([+-])?\s*(\d+)%/);
      if (m) resist.set(m[1], (resist.get(m[1]) ?? 0) + (m[2] === "-" ? -1 : 1) * Number(m[3]));
    }
  }
  const sorted = (m: Map<string, number>) =>
    [...m.entries()].filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
  return { armor, skills: sorted(skills), resist: sorted(resist) };
}

/** Slots do boneco com tier (Exaltation Forge) — além da arma, que usa setup.weaponTier. */
export type TierGearSlot = "head" | "armor" | "legs" | "feet";
export const TIER_GEAR_SLOTS: TierGearSlot[] = ["head", "armor", "legs", "feet"];
export type SetupGearTier = Partial<Record<TierGearSlot, number>>;

/** Tier máximo do item (0 = não aceita tier). Só capacete/armadura/calça/bota têm tier. */
export function gearMaxTier(slot: GearSlot, name: string | null | undefined): number {
  if (!(TIER_GEAR_SLOTS as string[]).includes(slot)) return 0;
  return findEquipment(name)?.maxTier ?? 0;
}

/** Tier de cada item equipado, entre 1 e o máximo daquele item (resto some). */
export function normalizeGearTier(v: unknown, gear: SetupGear): SetupGearTier {
  const out: SetupGearTier = {};
  if (!v || typeof v !== "object") return out;
  const r = v as Record<string, unknown>;
  for (const slot of TIER_GEAR_SLOTS) {
    const t = Math.round(Number(r[slot]));
    const max = gearMaxTier(slot, gear[slot]);
    if (Number.isFinite(t) && t >= 1 && t <= max) out[slot] = t;
  }
  return out;
}

/** Só itens que existem na lista e no slot certo (é o que vai pro banco e pra Comunidade). */
export function normalizeGear(v: unknown): SetupGear {
  const out: SetupGear = {};
  if (!v || typeof v !== "object") return out;
  const r = v as Record<string, unknown>;
  for (const slot of GEAR_SLOTS) {
    const e = typeof r[slot] === "string" ? findEquipment(r[slot] as string) : undefined;
    if (e && DATA_SLOTS[slot].includes(e.slot) && !(slot === "shield" && e.isQuiver)) {
      out[slot] = e.name;
    }
  }
  return out;
}
