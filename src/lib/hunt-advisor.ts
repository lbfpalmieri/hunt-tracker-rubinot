import {
  equipmentForSlot,
  findEquipment,
  GEAR_SLOTS,
  type EquipmentInfo,
  type GearSlot,
} from "./equipment";
import { findWeapon, weaponsForVocation, type WeaponInfo, type WeaponKind } from "./weapons";
import {
  ATTACK_ELEMENTS,
  ELEMENTS,
  findMonster,
  type AttackElement,
  type Element,
  type MonsterInfo,
} from "./monsters";
import type { SessionSetup, SetupVocation } from "./session-setup";
import { EMPTY_SETUP } from "./session-setup";

/**
 * HUNT ADVISOR — recomendação de set/imbuements/charms pra uma hunt, a partir de:
 *  - criaturas da hunt (kills da Comunidade ou montada à mão) + dados da wiki (monsters.ts);
 *  - dano recebido REAL (Input Analyser das sessões públicas) quando existe; senão estimado pelos
 *    ataques das criaturas na wiki;
 *  - equipamentos/armas da wiki (equipment.ts / weapons.ts), filtrados por vocação e level.
 *
 * Pontuação (heurística, deixada simples de propósito — ver comentários de cada peso):
 *  - defesa  = Σ resistência% × fatia do dano daquele elemento + armor/defesa × fatia física;
 *  - ataque  = skills da vocação (skill da arma, ML, ML do elemento forte contra a hunt);
 *  - modo    = Defensivo / Equilibrado / Ofensivo muda o peso de cada um.
 * Resistências de itens diferentes são SOMADAS no total (como o jogo mostra no Cyclopedia).
 */

export type AdvisorMode = "defensive" | "balanced" | "offensive";

export const MODE_LABEL: Record<AdvisorMode, string> = {
  defensive: "Defensivo",
  balanced: "Equilibrado",
  offensive: "Ofensivo",
};

const MODE_WEIGHT: Record<AdvisorMode, { def: number; off: number }> = {
  defensive: { def: 1, off: 0.2 },
  balanced: { def: 0.6, off: 0.6 },
  offensive: { def: 0.2, off: 1 },
};

export interface HuntMonster {
  name: string;
  count: number;
}

export interface MixEntry {
  element: AttackElement;
  /** 0–100 */
  pct: number;
}

export type Mix = Partial<Record<AttackElement, number>>;

const KNOWN_ATTACK = new Set<string>(ATTACK_ELEMENTS);

/** "life drain" / "Lifedrain" / "drowning" → chave de AttackElement (null = ignora, ex. agony). */
export function attackKey(raw: string): AttackElement | null {
  const k = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (k === "drowning") return "drown";
  return KNOWN_ATTACK.has(k) ? (k as AttackElement) : null;
}

const toEntries = (mix: Mix): MixEntry[] =>
  (Object.entries(mix) as [AttackElement, number][])
    .filter(([, v]) => v > 0)
    .map(([element, pct]) => ({ element, pct }))
    .sort((a, b) => b.pct - a.pct);

function normalize(mix: Mix): Mix {
  const total = Object.values(mix).reduce((a, b) => a + (b ?? 0), 0);
  if (total <= 0) return {};
  const out: Mix = {};
  for (const [k, v] of Object.entries(mix) as [AttackElement, number][]) out[k] = (v / total) * 100;
  return out;
}

/**
 * Dano que a hunt causa, estimado pela wiki: maior dano de cada ataque × quantas vezes a criatura
 * aparece. Ataque sem valor na wiki (-1) conta como 60% do maior ataque conhecido dela.
 */
export function estimateIncoming(monsters: HuntMonster[]): MixEntry[] {
  const mix: Mix = {};
  for (const hm of monsters) {
    const m = findMonster(hm.name);
    if (!m || hm.count <= 0) continue;
    const vals = Object.values(m.attacks).filter((v): v is number => (v ?? 0) > 0);
    const fallback = vals.length ? Math.max(...vals) * 0.6 : 200;
    for (const [el, v] of Object.entries(m.attacks) as [AttackElement, number][]) {
      const dmg = v > 0 ? v : fallback;
      mix[el] = (mix[el] ?? 0) + dmg * hm.count;
    }
  }
  return toEntries(normalize(mix));
}

export interface WeaknessEntry {
  element: Element;
  /** % de dano que a hunt toma desse elemento (100 = normal), média ponderada. */
  mod: number;
}

/**
 * Fraqueza média da hunt por elemento. Peso = kills × HP: o dano que você precisa causar numa
 * criatura é a vida dela, então um bicho de 18k de HP pesa mais que um de 2k com as mesmas kills.
 */
export function huntWeakness(monsters: HuntMonster[]): WeaknessEntry[] {
  const sums = new Map<Element, { w: number; v: number }>();
  for (const hm of monsters) {
    const m = findMonster(hm.name);
    if (!m || hm.count <= 0) continue;
    const weight = hm.count * Math.max(m.hp, 1);
    for (const el of ELEMENTS) {
      const v = m.mods[el] ?? 100;
      const cur = sums.get(el) ?? { w: 0, v: 0 };
      cur.w += weight;
      cur.v += v * weight;
      sums.set(el, cur);
    }
  }
  return [...sums]
    .map(([element, s]) => ({ element, mod: s.w ? s.v / s.w : 100 }))
    .sort((a, b) => b.mod - a.mod);
}

// ---------------------------------------------------------------- parse de itens

const RESIST_NAME: Record<string, AttackElement> = {
  physical: "physical",
  "protection physical": "physical",
  fire: "fire",
  ice: "ice",
  earth: "earth",
  energy: "energy",
  death: "death",
  holy: "holy",
  "life drain": "lifedrain",
  "mana drain": "manadrain",
  drowning: "drown",
};

/** "Physical +5%, Fire +8%" → { physical: 5, fire: 8 } */
export function parseResist(s: string): Mix {
  const out: Mix = {};
  for (const part of s.split(",")) {
    const m = /^\s*([A-Za-z ]+?)\s*([+-]\d+(?:\.\d+)?)\s*%/.exec(part);
    if (!m) continue;
    const key = RESIST_NAME[m[1].toLowerCase()];
    if (key) out[key] = (out[key] ?? 0) + Number(m[2]);
  }
  return out;
}

const SKILL_ALIAS: Record<string, string> = {
  ml: "magic level",
  axe: "axe fighting",
  sword: "sword fighting",
  club: "club fighting",
  distance: "distance fighting",
  fist: "fist fighting",
};

/** "Magic Level +2, Fire ML +3, Axe +3, Speed +10" → { "magic level": 2, "fire magic level": 3, ... } */
export function parseSkills(s: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of s.split(",")) {
    const m = /^\s*([A-Za-z' ]+?)\s*([+-]\d+(?:\.\d+)?)/.exec(part);
    if (!m) continue;
    let key = m[1].trim().toLowerCase();
    key = SKILL_ALIAS[key] ?? key.replace(/\bml\b/, "magic level");
    out[key] = (out[key] ?? 0) + Number(m[2]);
  }
  return out;
}

const num = (s: string | undefined) => {
  const m = /-?\d+(?:\.\d+)?/.exec(s ?? "");
  return m ? Number(m[0]) : 0;
};

// ---------------------------------------------------------------- contexto

export interface AdvisorInput {
  vocation: SetupVocation;
  level: number | null;
  mode: AdvisorMode;
  monsters: HuntMonster[];
  /** Dano recebido (0–100 por elemento). */
  incoming: MixEntry[];
  /** Knight: espada/machado/clava; paladino: arco/besta/arremesso. Outras vocações ignoram. */
  weaponKind?: WeaponKind | null;
  /** Knight: 1 ou 2 mãos (null = tanto faz). */
  hands?: 1 | 2 | null;
}

interface Ctx extends AdvisorInput {
  inc: Mix;
  weak: Record<Element, number>;
  /** Elemento mais forte contra a hunt (ataque). */
  best: Element;
  skill: string;
}

const VOC_SKILL: Record<SetupVocation, string> = {
  knight: "sword fighting",
  paladin: "distance fighting",
  sorcerer: "magic level",
  druid: "magic level",
  monk: "fist fighting",
};

const KIND_SKILL: Partial<Record<WeaponKind, string>> = {
  s: "sword fighting",
  a: "axe fighting",
  c: "club fighting",
  b: "distance fighting",
  x: "distance fighting",
  t: "distance fighting",
  f: "fist fighting",
};

function makeCtx(input: AdvisorInput): Ctx {
  const inc: Mix = {};
  for (const e of input.incoming) inc[e.element] = e.pct / 100;
  if (!input.incoming.length) inc.physical = 1;
  const weakList = huntWeakness(input.monsters);
  const weak = Object.fromEntries(ELEMENTS.map((e) => [e, 100])) as Record<Element, number>;
  for (const w of weakList) weak[w.element] = w.mod;
  // O elemento forte que a VOCAÇÃO consegue usar (knight não bate holy, druid não bate fogo).
  const best = (VOC_ELEMENTS[input.vocation].slice().sort((a, b) => weak[b] - weak[a])[0] ??
    "physical") as Element;
  const skill = (input.weaponKind && KIND_SKILL[input.weaponKind]) || VOC_SKILL[input.vocation];
  return { ...input, inc, weak, best, skill };
}

const levelOk = (ctx: Ctx, lvl: number) => ctx.level == null || lvl <= ctx.level;

/**
 * Itens de carga/tempo (gastam e acabam) ou de uso específico — não entram no set fixo. Os de
 * proteção alta viram sugestão de "emergência" (emergencyItems).
 */
const CHARGED = new Set([
  "Stone Skin Amulet",
  "Might Ring",
  "Bonfire Amulet",
  "Leviathan's Amulet",
  "Sacred Tree Amulet",
  "Shockwave Amulet",
  "Prismatic Necklace",
  "Prismatic Ring",
  "Gill Necklace",
  "Elven Amulet",
  "Glooth Amulet",
  "Protection Amulet",
  "Dragon Necklace",
  "Garlic Necklace",
  "Greater Garlic Necklace",
  "Necklace of the Deep",
  "Silver Amulet",
  "Bronze Amulet",
  "Strange Talisman",
  "Terra Amulet",
  "Magma Amulet",
  "Glacier Amulet",
  "Lightning Pendant",
  "Koshei's Ancient Amulet",
  "Death Ring",
  "Ring of Temptation",
  "Enchanted Blister Ring",
  "Onyx Pendant",
  "Butterfly Ring",
  "Depth Galea",
  "Helmet of the Deep",
]);
const TIMED_RING =
  /^(Axe|Club|Sword|Power|Life|Time|Energy|Stealth|Dwarven|Crystal|Gold|Wedding|Star) Ring$|^Ring of (Healing|the Sky)$/;
const isCharged = (e: EquipmentInfo) =>
  CHARGED.has(e.name) || (e.slot === "r" && TIMED_RING.test(e.name));

/** Elementos com que a vocação causa dano (o "melhor elemento" de ataque sai daqui). */
const VOC_ELEMENTS: Record<SetupVocation, Element[]> = {
  knight: ["physical"],
  paladin: ["physical", "holy"],
  sorcerer: ["fire", "energy", "death"],
  druid: ["ice", "earth"],
  monk: ["physical"],
};

/** Pontos de defesa: % de resistência × fatia do dano + armor/defesa contra o físico. */
function defenseScore(ctx: Ctx, e: EquipmentInfo): number {
  const res = parseResist(e.resist);
  let s = 0;
  for (const [el, v] of Object.entries(res) as [AttackElement, number][])
    s += v * (ctx.inc[el] ?? 0);
  // Armor reduz um valor fixo do golpe físico: ~0,25% de proteção por ponto num hit de level alto.
  s += num(e.armor) * 0.25 * (ctx.inc.physical ?? 0);
  // Defesa de escudo bloqueia golpe físico corpo a corpo (só pra quem bloqueia de verdade).
  if (e.slot === "s" && (ctx.vocation === "knight" || ctx.vocation === "paladin"))
    s += num(e.defense) * 0.08 * (ctx.inc.physical ?? 0);
  return s;
}

/** Pontos de ataque: skills que importam pra vocação (cada ponto ~1,5% de dano). */
function offenseScore(ctx: Ctx, skills: Record<string, number>): number {
  let s = 0;
  for (const [k, v] of Object.entries(skills)) {
    if (k === ctx.skill) s += v * 1.5;
    else if (k === "magic level")
      s += v * (ctx.vocation === "sorcerer" || ctx.vocation === "druid" ? 2 : 0.4);
    else if (k === `${ctx.best} magic level`) s += v * 1.4;
    else if (/ magic level$/.test(k) && (ctx.vocation === "sorcerer" || ctx.vocation === "druid"))
      s += v * (k === "healing magic level" ? 0.5 : 0.35);
    else if (k === "shielding" && ctx.vocation === "knight") s += v * 0.4;
    else if (k === "speed") s += v * 0.02;
  }
  return s;
}

function itemScore(ctx: Ctx, e: EquipmentInfo): { score: number; def: number; off: number } {
  const w = MODE_WEIGHT[ctx.mode];
  const def = defenseScore(ctx, e);
  const off = offenseScore(ctx, parseSkills(e.skills));
  // Desempate: item de level maior costuma ser melhor; slot de imbuement ajuda um pouco.
  const tie = e.level * 0.002 + (e.imbuements ?? 0) * 0.25;
  return { score: def * w.def + off * w.off + tie, def, off };
}

// ---------------------------------------------------------------- armas

const ELEMENT_NAME: Record<string, Element> = {
  physical: "physical",
  fire: "fire",
  ice: "ice",
  earth: "earth",
  energy: "energy",
  death: "death",
  holy: "holy",
};

/** "46 Ice" → { value: 46, element: "ice" } */
function parseElemental(s: string): { value: number; element: Element } | null {
  const m = /(\d+)(?:\s*-\s*(\d+))?\s+([A-Za-z]+)/.exec(s);
  if (!m) return null;
  const element = ELEMENT_NAME[m[3].toLowerCase()];
  if (!element) return null;
  const value = m[2] ? (Number(m[1]) + Number(m[2])) / 2 : Number(m[1]);
  return { value, element };
}

export function weaponScore(ctx: Ctx, w: WeaponInfo): number {
  const skills = parseSkills(w.skills);
  const off = offenseScore(ctx, skills);
  const mod = (el: Element) => (ctx.weak[el] ?? 100) / 100;
  let dmg = 0;
  if (w.kind === "w" || w.kind === "r") {
    const d = parseElemental(w.damage);
    dmg = d ? d.value * mod(d.element) * 0.6 : 0;
    return dmg + off * 4;
  }
  if (w.kind === "b" || w.kind === "x") {
    // Arco/besta: ataque = munição + bônus da arma (a melhor flecha/virote do level), mais o hit%.
    const ammo = num(pickAmmo(ctx, w)[0]?.attack);
    return (ammo + num(w.attack)) * mod("physical") + num(w.hit) * 0.3 + off * 2;
  }
  const phys = num(w.attack);
  const el = parseElemental(w.element);
  dmg = phys * mod("physical") + (el ? el.value * mod(el.element) : 0);
  return dmg + off * 2 + num(w.defense) * (ctx.mode === "defensive" ? 0.15 : 0.03);
}

/** Armas de quest/evento que a wiki lista com números fora da curva (não servem pra hunt). */
const WEAPON_BLOCK = new Set(["Throwing Star of Sula"]);

function pickWeapons(ctx: Ctx): WeaponInfo[] {
  return weaponsForVocation(ctx.vocation)
    .filter((w) => levelOk(ctx, w.level) && !WEAPON_BLOCK.has(w.name))
    .filter((w) => !ctx.weaponKind || w.kind === ctx.weaponKind)
    .filter((w) => !ctx.hands || w.hands === ctx.hands || w.hands == null)
    .map((w) => ({ w, s: weaponScore(ctx, w) }))
    .sort((a, b) => b.s - a.s || b.w.level - a.w.level)
    .map((x) => x.w);
}

/** Munição do paladino: flechas pra arco, virotes pra besta; ordena pelo ataque. */
function pickAmmo(ctx: Ctx, weapon: WeaponInfo | undefined): EquipmentInfo[] {
  if (ctx.vocation !== "paladin" || !weapon || (weapon.kind !== "b" && weapon.kind !== "x"))
    return [];
  const want = weapon.kind === "b" ? /arrow/i : /bolt/i;
  return equipmentForSlot("ammo", ctx.vocation)
    .filter((e) => e.slot === "m" && want.test(e.name) && levelOk(ctx, e.level))
    .sort((a, b) => num(b.attack) - num(a.attack) || b.level - a.level);
}

// ---------------------------------------------------------------- resultado

export interface SlotPick {
  slot: GearSlot | "weapon";
  best: string | null;
  /** Até 4 alternativas (inclui a melhor na primeira posição). */
  options: { name: string; score: number; summary: string }[];
}

export interface AdvisorResult {
  setup: SessionSetup;
  picks: SlotPick[];
  /** Elemento mais forte contra a hunt. */
  bestElement: Element;
  weakness: WeaknessEntry[];
}

/** Monta o set recomendado. `overrides` = escolhas do usuário por slot (ex.: trocou a bota). */
export function recommendSet(
  input: AdvisorInput,
  overrides: Partial<Record<GearSlot | "weapon", string>> = {},
): AdvisorResult {
  const ctx = makeCtx(input);
  const picks: SlotPick[] = [];

  const weapons = pickWeapons(ctx);
  const weaponName = overrides.weapon ?? weapons[0]?.name ?? null;
  const weapon = findWeapon(weaponName);
  picks.push({
    slot: "weapon",
    best: weaponName,
    options: weapons.slice(0, 4).map((w) => ({
      name: w.name,
      score: weaponScore(ctx, w),
      summary: [
        w.attack && `Atq ${w.attack}`,
        w.element,
        w.damage,
        w.skills,
        w.hands ? `${w.hands} mão${w.hands === 2 ? "s" : ""}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  });

  const twoHanded = weapon?.hands === 2;
  const gear: SessionSetup["gear"] = {};
  let quiver: string | null = null;

  for (const slot of GEAR_SLOTS) {
    let list: EquipmentInfo[];
    if (slot === "ammo") {
      const ammo = pickAmmo(ctx, weapon);
      list = ammo.length
        ? ammo
        : equipmentForSlot("ammo", ctx.vocation).filter(
            (e) => e.slot === "e" && levelOk(ctx, e.level),
          );
      if (!ammo.length) list = rank(ctx, list);
    } else {
      list = equipmentForSlot(slot, ctx.vocation, { twoHanded }).filter(
        (e) => levelOk(ctx, e.level) && !isCharged(e),
      );
      if (slot === "shield" && ctx.vocation === "paladin") {
        // Paladino com arco/besta usa aljava; com arma de arremesso, escudo.
        const ranged = weapon && (weapon.kind === "b" || weapon.kind === "x");
        list = list.filter((e) => (ranged ? e.isQuiver : !e.isQuiver));
      }
      list = rank(ctx, list);
    }
    const chosen =
      overrides[slot] && findEquipment(overrides[slot]) ? overrides[slot]! : list[0]?.name;
    if (chosen) {
      if (slot === "shield" && findEquipment(chosen)?.isQuiver) quiver = chosen;
      else gear[slot] = chosen;
    }
    picks.push({
      slot,
      best: chosen ?? null,
      options: list.slice(0, 4).map((e) => ({
        name: e.name,
        score: itemScore(ctx, e).score,
        summary: [
          e.armor && e.armor !== "0" ? `Arm ${e.armor}` : "",
          e.defense ? `Def ${e.defense}` : "",
          e.attack ? `Atq ${e.attack}` : "",
          e.skills,
          e.resist,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  }

  return {
    setup: { ...EMPTY_SETUP, weapon: weaponName, quiver, gear },
    picks,
    bestElement: ctx.best,
    weakness: huntWeakness(input.monsters),
  };
}

function rank(ctx: Ctx, list: EquipmentInfo[]): EquipmentInfo[] {
  return list
    .map((e) => ({ e, s: itemScore(ctx, e).score }))
    .sort((a, b) => b.s - a.s || b.e.level - a.e.level)
    .map((x) => x.e);
}

/** Proteção somada do set por elemento (o que o jogo mostra no Cyclopedia → Resistências). */
export function setProtection(setup: SessionSetup): Mix {
  const out: Mix = {};
  const names = [...Object.values(setup.gear ?? {}), setup.quiver].filter(Boolean) as string[];
  for (const n of names) {
    const e = findEquipment(n);
    if (!e) continue;
    for (const [el, v] of Object.entries(parseResist(e.resist)) as [AttackElement, number][])
      out[el] = (out[el] ?? 0) + v;
  }
  return out;
}

/**
 * Quanto do dano recebido o set corta, ponderado pelo mix da hunt (ex.: 40% físico com 10% de
 * proteção física + 60% fogo com 20% = 16%). Só resistência de item — sem imbuement/charm.
 */
export function weightedProtection(setup: SessionSetup, incoming: MixEntry[]): number {
  const prot = setProtection(setup);
  return incoming.reduce((a, e) => a + ((prot[e.element] ?? 0) * e.pct) / 100, 0);
}

// ---------------------------------------------------------------- imbuements

const PROTECTION_IMBUE: Partial<Record<AttackElement, string>> = {
  fire: "dragon_hide",
  death: "lich_shroud",
  earth: "snake_skin",
  ice: "quara_scale",
  energy: "cloud_fabric",
  holy: "demon_presence",
};

const DAMAGE_IMBUE: Partial<Record<Element, string>> = {
  fire: "scorch",
  earth: "venom",
  ice: "frost",
  energy: "electrify",
  death: "reap",
};

const SKILL_IMBUE: Record<string, string> = {
  "sword fighting": "slash",
  "axe fighting": "chop",
  "club fighting": "bash",
  "distance fighting": "precision",
  "fist fighting": "punch",
  "magic level": "epiphany",
};

export interface ImbueSuggestion {
  slot: "weapon" | "head" | "armor" | "shield" | "feet";
  ids: string[];
  why: string;
}

/**
 * Imbuements sugeridos por slot (só onde o item escolhido aceita imbuement). Regras simples e
 * conhecidas: arma = dano (elemento forte ou Strike) + roubo de vida/mana; armadura = proteção do
 * elemento que mais bate (fora o físico, que não tem imbuement); escudo/spellbook = 2ª proteção ou
 * skill; capacete = mana + skill; bota = velocidade.
 */
export function suggestImbuements(input: AdvisorInput, setup: SessionSetup): ImbueSuggestion[] {
  const ctx = makeCtx(input);
  const mage = ctx.vocation === "sorcerer" || ctx.vocation === "druid";
  const elemental = input.incoming.filter((e) => PROTECTION_IMBUE[e.element]);
  const out: ImbueSuggestion[] = [];
  const slots = (n: number | null | undefined) => Math.max(0, n ?? 0);

  const weapon = findWeapon(setup.weapon);
  const ws = slots(weapon?.imbuements);
  if (ws) {
    // Imbuement de dano converte parte do golpe físico no elemento: vale quando a hunt é bem mais
    // fraca a ele do que ao físico. Só existem imbuements de fogo, terra, gelo, energia e morte.
    const imbEl = (Object.keys(DAMAGE_IMBUE) as Element[]).sort(
      (a, b) => (ctx.weak[b] ?? 100) - (ctx.weak[a] ?? 100),
    )[0];
    const elemGain = (ctx.weak[imbEl] ?? 100) - (ctx.weak.physical ?? 100);
    const dmg = !mage && elemGain >= 10 ? DAMAGE_IMBUE[imbEl]! : "strike";
    const ids = mage ? ["strike", "void", "vampirism"] : [dmg, "vampirism", "void"];
    out.push({
      slot: "weapon",
      ids: ids.slice(0, ws),
      why:
        dmg !== "strike"
          ? `${ELEMENT_PT[imbEl]} bate ${Math.round(elemGain)}% mais que o físico nessa hunt`
          : "Crítico + roubo de vida e mana",
    });
  }

  const add = (
    slot: ImbueSuggestion["slot"],
    name: string | undefined,
    ids: string[],
    why: string,
  ) => {
    const e = findEquipment(name);
    const n = slots(e?.imbuements);
    if (n) out.push({ slot, ids: ids.filter(Boolean).slice(0, n), why });
  };

  const prot1 = elemental[0] ? PROTECTION_IMBUE[elemental[0].element]! : null;
  // Escudo: a 2ª proteção mais útil — ou a 1ª, se só um elemento (fora o físico) bate.
  const shieldEl = elemental[1] ?? elemental[0];
  const prot2 = shieldEl ? PROTECTION_IMBUE[shieldEl.element]! : null;
  const skillImb = SKILL_IMBUE[ctx.skill] ?? "epiphany";
  const elName = (e: MixEntry) => ELEMENT_PT[e.element as Element] ?? e.element;

  add("head", setup.gear?.head, ["void", skillImb], "Mana + skill principal");
  add(
    "armor",
    setup.gear?.armor,
    [prot1 ?? "", mage ? "" : "vampirism"],
    elemental[0]
      ? `${elName(elemental[0])} é ${Math.round(elemental[0].pct)}% do dano que você toma`
      : "Proteção + roubo de vida",
  );
  add(
    "shield",
    setup.gear?.shield,
    [prot2 ?? "", ctx.vocation === "knight" ? "blockade" : "epiphany"],
    shieldEl
      ? `Proteção de ${elName(shieldEl).toLowerCase()} (${Math.round(shieldEl.pct)}% do dano) + skill`
      : "Skill",
  );
  add("feet", setup.gear?.feet, ["swiftness"], "Velocidade pra puxar e fugir");
  return out.filter((s) => s.ids.length > 0);
}

// ---------------------------------------------------------------- emergência

export interface EmergencyItem {
  name: string;
  why: string;
}

/**
 * Itens de carga pra levar na BP e colocar no aperto (não ficam no set fixo): Stone Skin quando
 * físico + morte pesam, Might Ring sempre, e o amuleto de 60% do elemento que mais bate.
 */
export function emergencyItems(incoming: MixEntry[]): EmergencyItem[] {
  const pct = (el: AttackElement) => incoming.find((e) => e.element === el)?.pct ?? 0;
  const out: EmergencyItem[] = [];
  const physDeath = pct("physical") + pct("death");
  if (physDeath >= 40)
    out.push({
      name: "Stone Skin Amulet",
      why: `Físico + morte = ${Math.round(physDeath)}% do dano (80% de proteção, com cargas)`,
    });
  const ELEMENTAL_60: [AttackElement, string][] = [
    ["fire", "Bonfire Amulet"],
    ["ice", "Leviathan's Amulet"],
    ["earth", "Sacred Tree Amulet"],
    ["energy", "Shockwave Amulet"],
  ];
  const top = ELEMENTAL_60.map(([el, name]) => ({ el, name, p: pct(el) })).sort(
    (a, b) => b.p - a.p,
  )[0];
  if (top && top.p >= 15)
    out.push({
      name: top.name,
      why: `${ELEMENT_PT[top.el as Element]} = ${Math.round(top.p)}% do dano (60% físico + 40% ${ELEMENT_PT[top.el as Element].toLowerCase()})`,
    });
  out.push({ name: "Might Ring", why: "+20% em tudo por pouco tempo — pra respawn apertado" });
  if (pct("lifedrain") >= 10)
    out.push({
      name: "Garlic Necklace",
      why: `Life drain = ${Math.round(pct("lifedrain"))}% do dano`,
    });
  return out;
}

// ---------------------------------------------------------------- charms

export const ELEMENT_PT: Record<Element, string> = {
  physical: "Físico",
  earth: "Terra",
  fire: "Fogo",
  death: "Morte",
  energy: "Energia",
  holy: "Sagrado",
  ice: "Gelo",
};

const CHARM_BY_ELEMENT: Record<Element, string> = {
  physical: "Wound",
  earth: "Poison",
  fire: "Enflame",
  death: "Curse",
  energy: "Zap",
  holy: "Divine Wrath",
  ice: "Freeze",
};

export interface CharmPick {
  monster: string;
  share: number;
  hp: number;
  charm: string;
  element: Element;
  mod: number;
  /** Dano estimado por ativação (5% do HP × fraqueza). */
  damage: number;
}

/**
 * Charm de dano elemental pra cada criatura relevante (≥ 3% das kills): o elemento em que ela é
 * mais fraca. Dano ≈ 5% da vida da criatura × o modificador do elemento (estimativa).
 */
export function charmPicks(monsters: HuntMonster[]): CharmPick[] {
  const total = monsters.reduce((a, m) => a + m.count, 0) || 1;
  const out: CharmPick[] = [];
  for (const hm of monsters) {
    const m: MonsterInfo | undefined = findMonster(hm.name);
    const share = (hm.count / total) * 100;
    if (!m || share < 3 || m.hp <= 0) continue;
    let best: Element = "physical";
    for (const el of ELEMENTS) if ((m.mods[el] ?? 100) > (m.mods[best] ?? 100)) best = el;
    const mod = m.mods[best] ?? 100;
    out.push({
      monster: hm.name,
      share,
      hp: m.hp,
      charm: CHARM_BY_ELEMENT[best],
      element: best,
      mod,
      damage: Math.round(m.hp * 0.05 * (mod / 100)),
    });
  }
  return out.sort((a, b) => b.share - a.share);
}
