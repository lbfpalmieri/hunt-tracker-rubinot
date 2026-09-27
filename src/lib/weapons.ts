import { WEAPONS_TSV } from "@/data/weapons-data";
import type { SetupVocation } from "./session-setup";

/**
 * Armas da TibiaWiki (ver src/data/weapons-data.ts) com filtro por vocação pro setup/sets:
 * knight vê espadas, machados e clavas; paladino, bows, crossbows e armas de arremesso (e as
 * aljavas num campo à parte); sorcerer, wands; druid, rods; monk, os "Punhos" (katar, sai, jo
 * staff, claws...). Wands marcadas pra Sorcerers e Druids aparecem pros dois.
 */

export type WeaponKind = "s" | "a" | "c" | "b" | "x" | "t" | "w" | "r" | "f" | "q";

export const WEAPON_KIND_LABEL: Record<WeaponKind, string> = {
  s: "Espada",
  a: "Machado",
  c: "Clava",
  b: "Arco",
  x: "Besta",
  t: "Arremesso",
  w: "Wand",
  r: "Rod",
  f: "Punho",
  q: "Aljava",
};

export const VOCATION_WEAPON_KINDS: Record<SetupVocation, WeaponKind[]> = {
  knight: ["s", "a", "c"],
  paladin: ["b", "x", "t"],
  sorcerer: ["w"],
  druid: ["r"],
  monk: ["f"],
};

export interface WeaponInfo {
  name: string;
  kind: WeaponKind;
  /** Vocações exigidas pela wiki (K P S D M). Vazio = qualquer vocação pode equipar. */
  vocs: string;
  level: number;
  hands: 1 | 2 | null;
  attack: string;
  element: string;
  defense: string;
  /** Dano de wand/rod, ex. "98-118 Ice". */
  damage: string;
  range: string;
  skills: string;
  imbuements: number | null;
  maxTier: number | null;
  hit: string;
  /** Nome pro sprite na wiki (título da página quando o nome se repete, ex. "Souleater (Axe)"). */
  icon: string;
}

const VOC_CODE: Record<SetupVocation, string> = {
  knight: "K",
  paladin: "P",
  sorcerer: "S",
  druid: "D",
  monk: "M",
};

let cache: WeaponInfo[] | null = null;

export function allWeapons(): WeaponInfo[] {
  if (cache) return cache;
  cache = WEAPONS_TSV.split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [
        name,
        kind,
        vocs,
        level,
        hands,
        attack,
        element,
        defense,
        damage,
        range,
        skills,
        imb,
        mt,
        hit,
        icon,
      ] = line.split("|");
      const n = (s: string | undefined) => (s && /^\d+$/.test(s) ? Number(s) : null);
      return {
        name,
        kind: kind as WeaponKind,
        vocs: vocs ?? "",
        level: n(level) ?? 0,
        hands: hands === "2" ? 2 : hands === "1" ? 1 : null,
        attack: attack ?? "",
        element: element ?? "",
        defense: defense ?? "",
        damage: damage ?? "",
        range: range ?? "",
        skills: skills ?? "",
        imbuements: n(imb),
        maxTier: n(mt),
        hit: hit ?? "",
        icon: icon || name,
      };
    });
  return cache;
}

/** Armas (sem aljavas) que a vocação usa, da maior pro menor level. Null = todas. */
export function weaponsForVocation(voc: SetupVocation | null): WeaponInfo[] {
  const list = allWeapons().filter((w) => w.kind !== "q");
  const filtered = voc
    ? list.filter(
        (w) => VOCATION_WEAPON_KINDS[voc].includes(w.kind) || w.vocs.includes(VOC_CODE[voc]),
      )
    : list;
  return [...filtered].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

export function quivers(): WeaponInfo[] {
  return allWeapons()
    .filter((w) => w.kind === "q")
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

export function findWeapon(name: string | null | undefined): WeaponInfo | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  return allWeapons().find((w) => w.name.toLowerCase() === key);
}

/** Resumo curto dos atributos base: "Atq 7 + 45 Death · Def 32 · Sword +4". */
export function weaponSummary(w: WeaponInfo): string {
  const parts: string[] = [];
  if (w.damage) parts.push(`Dano ${w.damage}`);
  else if (w.attack) parts.push(`Atq ${w.attack}${w.element ? ` + ${w.element}` : ""}`);
  if (w.hit) parts.push(`Hit ${w.hit}`);
  if (w.defense && w.defense !== "0") parts.push(`Def ${w.defense}`);
  if (w.skills) parts.push(w.skills);
  return parts.join(" · ");
}
