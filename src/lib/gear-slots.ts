import helmet from "@/assets/gear/slot-helmet.png";
import armor from "@/assets/gear/slot-armor.png";
import weapon from "@/assets/gear/slot-weapon.png";
import boots from "@/assets/gear/slot-boots.png";
import backpack from "@/assets/gear/slot-backpack.png";

export type GearSlotId = "helmet" | "armor" | "weapon" | "boots" | "backpack";

export interface GearSlot {
  id: GearSlotId;
  name: string;
  hint: string;
  icon: string;
  maxImbuements: number;
}

export const GEAR_SLOTS: GearSlot[] = [
  { id: "weapon", name: "Arma", hint: "Dano elemental, life/mana leech, crítico", icon: weapon, maxImbuements: 3 },
  { id: "helmet", name: "Capacete", hint: "Skill, mana leech, proteção", icon: helmet, maxImbuements: 3 },
  { id: "armor", name: "Armadura", hint: "Proteções elementais", icon: armor, maxImbuements: 3 },
  { id: "boots", name: "Bota", hint: "Swiftness, vibrancy, proteção", icon: boots, maxImbuements: 3 },
  { id: "backpack", name: "Mochila", hint: "Featherweight e afins", icon: backpack, maxImbuements: 3 },
];

export const MAX_IMBUEMENTS_PER_ITEM = 3;

export function getGearSlot(id: string | null | undefined): GearSlot | null {
  if (!id) return null;
  return GEAR_SLOTS.find((s) => s.id === id) ?? null;
}
