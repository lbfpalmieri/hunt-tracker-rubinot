/**
 * Wheel of Destiny — dados do jogo (levantados em 2026-10-07 no planejador oficial do tibia.com e
 * conferidos na TibiaWiki: "Wheel of Destiny", "/Dedication Perks", "/Conviction Perks",
 * "/Revelation Perks", "Promotion Scroll"). Só FATOS do jogo (posição dos perks, pontos, valores);
 * desenho e código são nossos. Lógica em src/lib/wheel.ts.
 *
 * Geometria: 4 domínios × 9 fatias. Ângulo em graus no sentido horário a partir das 3h (0° = direita,
 * 90° = baixo), igual ao canvas. Anel 0 = centro … anel 4 = borda. Pontos máximos por anel:
 * 50 / 75 / 100 / 150 / 200 (1000 por domínio, 4000 na roda).
 */

import type { SetupVocation } from "@/lib/session-setup";

export type WheelDomain = "TL" | "TR" | "BL" | "BR";
export const WHEEL_DOMAINS: WheelDomain[] = ["TL", "TR", "BL", "BR"];

/** Bônus de dedicação da fatia (sobe a cada ponto). */
export type DedicationKind = "hp" | "mana" | "cap" | "mit" | "hpmana";

/** Perk de convicção genérico (igual pra todas as vocações) ou "voc" = muda por vocação. */
export type SlotKind = "vessel" | "skill" | "lifeLeech" | "manaLeech" | "voc";

export interface WheelSliceDef {
  /** Índice 0–35 na ordem de WHEEL_SLICES (é a posição no array de pontos salvo). */
  i: number;
  /** "TL0" … "BR8" (mesmo nome do planejador oficial). */
  id: string;
  domain: WheelDomain;
  ring: 0 | 1 | 2 | 3 | 4;
  a0: number;
  a1: number;
  max: number;
  dedication: DedicationKind;
  kind: SlotKind;
}

const RING_MAX = [50, 75, 100, 150, 200] as const;

// [id, anel, ângulo inicial, ângulo final, dedicação, perk]
const RAW: [string, number, number, number, DedicationKind, SlotKind][] = [
  ["TL0", 0, 180, 270, "cap", "vessel"],
  ["TL1", 1, 180, 225, "mana", "skill"],
  ["TL3", 1, 225, 270, "mana", "lifeLeech"],
  ["TL2", 2, 180, 210, "hp", "voc"],
  ["TL4", 2, 210, 240, "hp", "voc"],
  ["TL6", 2, 240, 270, "hp", "vessel"],
  ["TL5", 3, 195, 225, "mit", "vessel"],
  ["TL7", 3, 225, 255, "mit", "manaLeech"],
  ["TL8", 4, 195, 255, "hpmana", "voc"],
  ["TR0", 0, 270, 360, "mit", "voc"],
  ["TR3", 1, 270, 315, "cap", "vessel"],
  ["TR1", 1, 315, 360, "cap", "lifeLeech"],
  ["TR6", 2, 270, 300, "mana", "skill"],
  ["TR4", 2, 300, 330, "mana", "voc"],
  ["TR2", 2, 330, 360, "mana", "vessel"],
  ["TR7", 3, 285, 315, "hp", "vessel"],
  ["TR5", 3, 315, 345, "hp", "manaLeech"],
  ["TR8", 4, 285, 345, "hpmana", "voc"],
  ["BL0", 0, 90, 180, "mana", "voc"],
  ["BL3", 1, 90, 135, "hp", "vessel"],
  ["BL1", 1, 135, 180, "hp", "manaLeech"],
  ["BL6", 2, 90, 120, "mit", "skill"],
  ["BL4", 2, 120, 150, "mit", "voc"],
  ["BL2", 2, 150, 180, "mit", "vessel"],
  ["BL7", 3, 105, 135, "cap", "vessel"],
  ["BL5", 3, 135, 165, "cap", "lifeLeech"],
  ["BL8", 4, 105, 165, "hpmana", "voc"],
  ["BR0", 0, 0, 90, "hp", "vessel"],
  ["BR1", 1, 0, 45, "mit", "skill"],
  ["BR3", 1, 45, 90, "mit", "manaLeech"],
  ["BR2", 2, 0, 30, "cap", "voc"],
  ["BR4", 2, 30, 60, "cap", "voc"],
  ["BR6", 2, 60, 90, "cap", "vessel"],
  ["BR5", 3, 15, 45, "mana", "vessel"],
  ["BR7", 3, 45, 75, "mana", "lifeLeech"],
  ["BR8", 4, 15, 75, "hpmana", "voc"],
];

export const WHEEL_SLICES: WheelSliceDef[] = RAW.map(([id, ring, a0, a1, dedication, kind], i) => ({
  i,
  id,
  domain: id.slice(0, 2) as WheelDomain,
  ring: ring as WheelSliceDef["ring"],
  a0,
  a1,
  max: RING_MAX[ring],
  dedication,
  kind,
}));

/** Perk de convicção das fatias "voc", por vocação. */
const VOC_SLOTS: Record<SetupVocation, Record<string, string>> = {
  knight: {
    TL2: "Augmented Intense Wound Cleansing",
    TL4: "Augmented Shield Slam",
    TL8: "Battle Instinct",
    TR0: "Augmented Fierce Berserk",
    TR4: "Augmented Groundshaker",
    TR8: "Augmented Front Sweep",
    BL0: "Augmented Front Sweep",
    BL4: "Augmented Groundshaker",
    BL8: "Augmented Fierce Berserk",
    BR2: "Augmented Shield Slam",
    BR4: "Augmented Intense Wound Cleansing",
    BR8: "Battle Healing",
  },
  druid: {
    TL2: "Augmented Terra Wave",
    TL4: "Augmented Mass Healing",
    TL8: "Healing Link",
    TR0: "Augmented Strong Ice Wave",
    TR4: "Augmented Heal Friend",
    TR8: "Augmented Forked Spells",
    BL0: "Augmented Forked Spells",
    BL4: "Augmented Heal Friend",
    BL8: "Augmented Strong Ice Wave",
    BR2: "Augmented Mass Healing",
    BR4: "Augmented Terra Wave",
    BR8: "Runic Mastery",
  },
  sorcerer: {
    TL2: "Augmented Energy Wave",
    TL4: "Augmented Special Spells",
    TL8: "Runic Mastery",
    TR0: "Augmented Great Fire Wave",
    TR4: "Augmented Death Echo",
    TR8: "Augmented Focus Spells",
    BL0: "Augmented Focus Spells",
    BL4: "Augmented Death Echo",
    BL8: "Augmented Great Fire Wave",
    BR2: "Augmented Special Spells",
    BR4: "Augmented Energy Wave",
    BR8: "Focus Mastery",
  },
  paladin: {
    TL2: "Augmented Divine Barrage",
    TL4: "Augmented Strong Ethereal Spear",
    TL8: "Positional Tactics",
    TR0: "Augmented Divine Caldera",
    TR4: "Augmented Divine Dazzle",
    TR8: "Augmented Ethereal Barrage",
    BL0: "Augmented Ethereal Barrage",
    BL4: "Augmented Divine Dazzle",
    BL8: "Augmented Divine Caldera",
    BR2: "Augmented Strong Ethereal Spear",
    BR4: "Augmented Divine Barrage",
    BR8: "Ballistic Mastery",
  },
  monk: {
    TL2: "Augmented Flurry of Blows",
    TL4: "Augmented Mass Spirit Mend",
    TL8: "Guiding Presence",
    TR0: "Augmented Thousand Fist Blows",
    TR4: "Augmented Mystic Repulse",
    TR8: "Augmented Chained Penance",
    BL0: "Augmented Chained Penance",
    BL4: "Augmented Mystic Repulse",
    BL8: "Augmented Thousand Fist Blows",
    BR2: "Augmented Mass Spirit Mend",
    BR4: "Augmented Flurry of Blows",
    BR8: "Sanctuary",
  },
};

export const SKILL_BOOST: Record<SetupVocation, { name: string; label: string }> = {
  knight: { name: "Weapon Skill Boost", label: "Skill de arma (espada/machado/clava)" },
  paladin: { name: "Distance Skill Boost", label: "Distance" },
  druid: { name: "Magic Skill Boost", label: "Magic Level" },
  sorcerer: { name: "Magic Skill Boost", label: "Magic Level" },
  monk: { name: "Fist Fighting Skill Boost", label: "Fist Fighting" },
};

/** Nome do perk de convicção de uma fatia pra vocação. */
export function slicePerk(voc: SetupVocation, s: WheelSliceDef): string {
  switch (s.kind) {
    case "vessel":
      return "Vessel Resonance";
    case "skill":
      return SKILL_BOOST[voc].name;
    case "lifeLeech":
      return "Life Leech";
    case "manaLeech":
      return "Mana Leech";
    default:
      return VOC_SLOTS[voc][s.id];
  }
}

const VESSEL_ICON: Record<WheelDomain, string> = {
  TL: "Vessel Resonance Top Left",
  TR: "Vessel Resonance Top Right",
  BL: "Vessel Resonance Bottom Left",
  BR: "Vessel Resonance Bottom Right",
};

/** Nome do arquivo do ícone na TibiaWiki BR (GameIcon resolve o caminho). */
export function slicePerkIcon(voc: SetupVocation, s: WheelSliceDef): string {
  switch (s.kind) {
    case "vessel":
      return VESSEL_ICON[s.domain];
    case "skill":
      return `${SKILL_BOOST[voc].name} (Conviction)`;
    case "lifeLeech":
      return "Life Leech (Conviction)";
    case "manaLeech":
      return "Mana Leech (Conviction)";
    default:
      return VOC_SLOTS[voc][s.id];
  }
}

/** Revelação de cada domínio (TL é sempre Gift of Life; BR é o Avatar da vocação). */
export const WHEEL_REVELATION_BY_DOMAIN: Record<SetupVocation, Record<WheelDomain, string>> = {
  knight: {
    TL: "Gift of Life",
    TR: "Executioner's Throw",
    BL: "Combat Mastery",
    BR: "Avatar of Steel",
  },
  druid: {
    TL: "Gift of Life",
    TR: "Blessing of the Grove",
    BL: "Twin Bursts",
    BR: "Avatar of Nature",
  },
  sorcerer: {
    TL: "Gift of Life",
    TR: "Beam Mastery",
    BL: "Lord of Destruction",
    BR: "Avatar of Storm",
  },
  paladin: {
    TL: "Gift of Life",
    TR: "Divine Grenade",
    BL: "Divine Empowerment",
    BR: "Avatar of Light",
  },
  monk: {
    TL: "Gift of Life",
    TR: "Spiritual Outburst",
    BL: "Ascetic",
    BR: "Avatar of Balance",
  },
};

/** Pontos de revelação: estágio I/II/III e o bônus de dano e cura de cada estágio. */
export const REVELATION_STAGE_POINTS = [250, 500, 1000] as const;
export const REVELATION_DMG_HEAL = [0, 4, 9, 20] as const;

/** Dedicação por ponto (= ganho por level da vocação ÷ 5); mitigação 0,075% por ponto. */
export const DEDICATION_RATE: Record<SetupVocation, { hp: number; mana: number; cap: number }> = {
  knight: { hp: 3, mana: 1, cap: 5 },
  paladin: { hp: 2, mana: 3, cap: 4 },
  druid: { hp: 1, mana: 6, cap: 2 },
  sorcerer: { hp: 1, mana: 6, cap: 2 },
  monk: { hp: 2, mana: 2, cap: 5 },
};
export const MITIGATION_PER_POINT = 0.075;

export const LIFE_LEECH_PER_SLICE = 0.75;
export const MANA_LEECH_PER_SLICE = 0.25;

/** Promotion Scrolls (Bakragore): cada tipo usa 1 vez por personagem. */
export const PROMOTION_SCROLLS = [
  { name: "Abridged Promotion Scroll", short: "Abridged", points: 3 },
  { name: "Basic Promotion Scroll", short: "Basic", points: 5 },
  { name: "Revised Promotion Scroll", short: "Revised", points: 9 },
  { name: "Extended Promotion Scroll", short: "Extended", points: 13 },
  { name: "Advanced Promotion Scroll", short: "Advanced", points: 20 },
] as const;

/**
 * Pontos fora level/scroll: Hunting Task Shop (até 50), The Way of the Monk Quest (10) e mods no
 * Grau IV da Fragment Workshop (até 69).
 */
export const EXTRA_POINTS_MAX = 50 + 10 + 69;

/** Descrição curta (pt-BR) dos perks de convicção — estágio I / II nos "Augmented". */
export const CONVICTION_INFO: Record<string, string | [string, string]> = {
  "Vessel Resonance":
    "Cada Vessel Resonance cheia liga um mod da gema do domínio; se o número bater com o tamanho da gema, ganha dano e cura extra.",
  "Life Leech": "+0,75% de Life Leech por fatia.",
  "Mana Leech": "+0,25% de Mana Leech por fatia.",
  "Weapon Skill Boost": "+1 de sword/axe/club fighting por fatia.",
  "Distance Skill Boost": "+1 de distance fighting por fatia.",
  "Magic Skill Boost": "+1 de magic level por fatia.",
  "Fist Fighting Skill Boost": "+1 de fist fighting por fatia.",
  // Knight
  "Augmented Intense Wound Cleansing": ["+125% de cura base", "-60s de recarga"],
  "Augmented Shield Slam": ["15% de life leech na magia", "-25% de dano do próximo ataque inimigo"],
  "Augmented Fierce Berserk": ["-30 de custo de mana", "+10% de dano base"],
  "Augmented Groundshaker": ["-2s de recarga", "+12,5% de dano base"],
  "Augmented Front Sweep": ["+40% de dano base", "Área maior"],
  "Battle Instinct":
    "Com 5+ criaturas ao redor: +6 de shielding e +1 de skill de arma por criatura (até 8).",
  "Battle Healing": "Magias de cura curam 10% a mais; dobra usando escudo.",
  // Druid
  "Augmented Terra Wave": ["+6,5% de dano base", "10% de life leech na magia"],
  "Augmented Mass Healing": ["+4% de cura base", "Área maior"],
  "Augmented Strong Ice Wave": ["+6% de dano base", "Área maior"],
  "Augmented Heal Friend": ["+4% de cura base", "+6% de cura base"],
  "Augmented Forked Spells": [
    "-2s de recarga (Forked Thorns/Glacier)",
    "+1 alvo (Forked Thorns/Glacier)",
  ],
  "Healing Link": "Curar alguém com Nature's Embrace ou Heal Friend cura você em 25% do valor.",
  "Runic Mastery":
    "Runas têm 25% de chance de usar +10% de magic level (+20% se for runa da sua vocação).",
  // Sorcerer
  "Augmented Energy Wave": ["Área maior", "+10% de dano base"],
  "Augmented Special Spells": [
    "-4s de recarga (Lightning, Strong Energy/Flame Strike)",
    "+50% de dano base nessas magias",
  ],
  "Augmented Great Fire Wave": ["+15% de dano crítico extra na magia", "+5% de dano base"],
  "Augmented Death Echo": ["-2s de recarga", "+12% de dano base"],
  "Augmented Focus Spells": [
    "+5% de dano base (Hell's Core e Rage of the Skies)",
    "-4s de recarga e do grupo Focus",
  ],
  "Focus Mastery":
    "Depois de uma magia Focus, a próxima magia de dano em 12s causa +35%. Recarga primária -2s.",
  // Paladin
  "Augmented Divine Barrage": ["+8% de dano base", "+12% de dano base"],
  "Augmented Strong Ethereal Spear": ["-2s de recarga", "+380% de dano base"],
  "Augmented Divine Caldera": ["-20 de custo de mana", "+10% de dano base"],
  "Augmented Divine Dazzle": ["+2 alvos", "Dura mais; -8s de recarga"],
  "Augmented Ethereal Barrage": ["10% de life leech na magia", "+10% de chance de crítico"],
  "Positional Tactics":
    "Sem monstro a 1 sqm: +3 de distance. Senão: +3 de magic level holy e de cura.",
  "Ballistic Mastery":
    "Crossbow: +10% de dano crítico extra. Bow: +4% de pierce físico e holy em ataques e magias.",
  // Monk
  "Augmented Flurry of Blows": ["Alcance +1", "+15% de dano base"],
  "Augmented Mass Spirit Mend": ["+8% de cura base", "-4s de recarga"],
  "Augmented Thousand Fist Blows": ["+40% de dano crítico extra na magia", "-4s de recarga"],
  "Augmented Mystic Repulse": ["-4s de recarga", "+60% de dano base"],
  "Augmented Chained Penance": ["+1 alvo", "+18% de dano base"],
  "Guiding Presence":
    "Aura que divide seu mantra com o grupo e aumenta os bônus passivos de party em 33%.",
  Sanctuary:
    "+10% de dano e cura em alvos adjacentes; consumir Harmony cria um campo de +2% por Harmony.",
};

/** Descrição curta das revelações (o que cada estágio faz). */
export const REVELATION_INFO: Record<string, string> = {
  "Gift of Life": "Em situações de dano fatal, te cura e dá uma segunda chance.",
  "Avatar of Steel": "Vira um avatar com vários bônus por um tempo (magia nova).",
  "Avatar of Nature": "Vira um avatar com vários bônus por um tempo (magia nova).",
  "Avatar of Storm": "Vira um avatar com vários bônus por um tempo (magia nova).",
  "Avatar of Light": "Vira um avatar com vários bônus por um tempo (magia nova).",
  "Avatar of Balance": "Vira um avatar com vários bônus por um tempo (magia nova).",
  "Executioner's Throw":
    "Arremessa a arma e salta em 2/3/4 alvos; +100/125/150% de dano em alvos abaixo de 30% de vida.",
  "Combat Mastery":
    "Menos dano recebido quanto menor sua vida (dobra com escudo); mais dano quanto menor a vida do alvo (dobra com arma de 2 mãos).",
  "Blessing of the Grove":
    "Curas podem dar crítico e curam mais em alvos com pouca vida (5/7,5/10%, dobra abaixo de 30%).",
  "Twin Bursts":
    "Ice/Terra Burst em anel ao seu redor; +20/40/60% de dano em alvos acima de 60% de vida.",
  "Beam Mastery":
    "Beams acertam os sqm do lado e ficam mais fortes por alvo atingido; cada alvo reduz a recarga de tudo.",
  "Lord of Destruction":
    "Melhora as posturas: Master of Flames (+poder fogo), Thunder (+crítico energia), Decay (+dano crítico morte).",
  "Divine Grenade":
    "Marca o alvo e explode em 3s com dano holy; +16% de dano por estágio. Recarga 26/20/14s.",
  "Divine Empowerment": "Campo 3x3 de 5s: dentro dele seu dano sobe 8/10/12%. Recarga 32/28/24s.",
  "Spiritual Outburst":
    "Ataque que consome Harmony e salta em 7 alvos; com Harmony cheio repete 37,5/50/62,5% do dano.",
  Ascetic: "Harmony +1/2/3% e ataques básicos causam +100/200/300% do mantra como dano.",
};

// ---------------------------------------------------------------------------------------------
// Gemas e mods (valores no Grau IV, como o planejador oficial mostra).
// ---------------------------------------------------------------------------------------------

export type ResistElement =
  "physical" | "fire" | "earth" | "ice" | "energy" | "holy" | "death" | "lifeDrain" | "manaDrain";

export interface BasicModDef {
  id: number;
  res?: Partial<Record<ResistElement, number>>;
  hp?: number;
  mana?: number;
  cap?: number;
  mit?: number;
}

const r = (res: Partial<Record<ResistElement, number>>) => res;

/** Mods básicos gerais (2º mod da gema; o 1º mod aceita só 3–6 daqui). */
export const GENERAL_BASIC_MODS: BasicModDef[] = [
  { id: 0, res: r({ physical: 1.5 }) },
  { id: 1, res: r({ holy: 1.5 }) },
  { id: 2, res: r({ death: 1.5 }) },
  { id: 3, res: r({ fire: 3 }) },
  { id: 4, res: r({ earth: 3 }) },
  { id: 5, res: r({ ice: 3 }) },
  { id: 6, res: r({ energy: 3 }) },
  { id: 7, res: r({ holy: 2.25, death: -1 }) },
  { id: 8, res: r({ death: 2.25, holy: -1 }) },
  { id: 9, res: r({ fire: 1.5, earth: 1.5 }) },
  { id: 10, res: r({ fire: 1.5, ice: 1.5 }) },
  { id: 11, res: r({ fire: 1.5, energy: 1.5 }) },
  { id: 12, res: r({ earth: 1.5, ice: 1.5 }) },
  { id: 13, res: r({ earth: 1.5, energy: 1.5 }) },
  { id: 14, res: r({ ice: 1.5, energy: 1.5 }) },
  { id: 15, res: r({ fire: 4.5, earth: -2 }) },
  { id: 16, res: r({ fire: 4.5, ice: -2 }) },
  { id: 17, res: r({ fire: 4.5, energy: -2 }) },
  { id: 18, res: r({ earth: 4.5, fire: -2 }) },
  { id: 19, res: r({ earth: 4.5, ice: -2 }) },
  { id: 20, res: r({ earth: 4.5, energy: -2 }) },
  { id: 21, res: r({ ice: 4.5, earth: -2 }) },
  { id: 22, res: r({ ice: 4.5, fire: -2 }) },
  { id: 23, res: r({ ice: 4.5, energy: -2 }) },
  { id: 24, res: r({ energy: 4.5, earth: -2 }) },
  { id: 25, res: r({ energy: 4.5, ice: -2 }) },
  { id: 26, res: r({ energy: 4.5, fire: -2 }) },
  { id: 27, res: r({ manaDrain: 4.5 }) },
  { id: 28, res: r({ lifeDrain: 4.5 }) },
  { id: 29, res: r({ manaDrain: 2.25, lifeDrain: 2.25 }) },
];

/** Mods básicos da vocação (só no 1º mod): vida/mana/capacidade cheios ou metade + 1,5% de resistência. */
const VOC_BASIC_VALUES: Record<
  SetupVocation,
  { hp: number; mana: number; cap: number; capHalf: number }
> = {
  knight: { hp: 450, mana: 150, cap: 750, capHalf: 375 },
  paladin: { hp: 300, mana: 450, cap: 600, capHalf: 300 },
  druid: { hp: 150, mana: 900, cap: 300, capHalf: 150 },
  sorcerer: { hp: 150, mana: 900, cap: 300, capHalf: 150 },
  monk: { hp: 300, mana: 300, cap: 700, capHalf: 375 },
};

export function vocationBasicMods(voc: SetupVocation): BasicModDef[] {
  const v = VOC_BASIC_VALUES[voc];
  const els: [number, ResistElement][] = [
    [0, "fire"],
    [1, "energy"],
    [2, "earth"],
    [3, "ice"],
  ];
  return [
    { id: 31, hp: v.hp },
    ...els.map(([k, el]) => ({ id: 38 + k, hp: v.hp / 2, res: { [el]: 1.5 } })),
    { id: 37, mana: v.mana },
    ...els.map(([k, el]) => ({ id: 33 + k, mana: v.mana / 2, res: { [el]: 1.5 } })),
    { id: 48, cap: v.cap },
    ...els.map(([k, el]) => ({ id: 44 + k, cap: v.capHalf, res: { [el]: 1.5 } })),
    { id: 30, mit: 30 },
  ];
}

/** Ids aceitos no 1º mod (gerais de resistência simples + os da vocação). */
export const FIRST_MOD_GENERAL_IDS = [3, 4, 5, 6];

export type SupremeEffect =
  "rev" | "crit" | "dmg" | "heal" | "cd" | "dodge" | "critAll" | "life" | "mana";

/** [id, magia/perk, efeito, valor] — "rev" = Revelation Mastery (+225 pontos na revelação). */
export type SupremeModDef = [number, string, SupremeEffect, number];

export const GENERAL_SUPREME_MODS: SupremeModDef[] = [
  [1, "", "critAll", 3],
  [0, "", "dodge", 0.42],
  [2, "", "life", 3],
  [3, "", "mana", 1.2],
];

export const REVELATION_MASTERY_POINTS = 225;

export const VOC_SUPREME_MODS: Record<SetupVocation, SupremeModDef[]> = {
  knight: [
    [5, "Gift of Life", "rev", 225],
    [22, "Executioner's Throw", "rev", 225],
    [23, "Combat Mastery", "rev", 225],
    [21, "Avatar of Steel", "rev", 225],
    [19, "Annihilation", "crit", 22.5],
    [18, "Annihilation", "dmg", 18],
    [6, "Avatar of Steel", "cd", 900],
    [13, "Berserk", "crit", 18],
    [12, "Berserk", "dmg", 7.5],
    [9, "Executioner's Throw", "crit", 18],
    [8, "Executioner's Throw", "dmg", 9],
    [7, "Executioner's Throw", "cd", 2],
    [20, "Fair Wound Cleansing", "heal", 15],
    [11, "Fierce Berserk", "crit", 12],
    [10, "Fierce Berserk", "dmg", 7.5],
    [15, "Front Sweep", "crit", 18],
    [14, "Front Sweep", "dmg", 12],
    [17, "Groundshaker", "crit", 18],
    [16, "Groundshaker", "dmg", 9.75],
  ],
  druid: [
    [5, "Gift of Life", "rev", 225],
    [74, "Blessing of the Grove", "rev", 225],
    [75, "Twin Bursts", "rev", 225],
    [73, "Avatar of Nature", "rev", 225],
    [59, "Avatar of Nature", "cd", 900],
    [66, "Eternal Winter", "crit", 18],
    [65, "Eternal Winter", "dmg", 12],
    [71, "Heal Friend", "heal", 7.5],
    [64, "Ice Burst", "crit", 18],
    [63, "Ice Burst", "dmg", 10.5],
    [72, "Mass Healing", "heal", 7.5],
    [60, "Nature's Embrace", "cd", 10],
    [70, "Strong Ice Wave", "crit", 22.5],
    [69, "Strong Ice Wave", "dmg", 12],
    [62, "Terra Burst", "crit", 18],
    [61, "Terra Burst", "dmg", 10.5],
    [68, "Terra Wave", "crit", 18],
    [67, "Terra Wave", "dmg", 7.5],
    [4, "Ultimate Healing", "heal", 7.5],
  ],
  sorcerer: [
    [5, "Gift of Life", "rev", 225],
    [57, "Beam Mastery", "rev", 225],
    [58, "Lord of Destruction", "rev", 225],
    [56, "Avatar of Storm", "rev", 225],
    [42, "Avatar of Storm", "cd", 900],
    [49, "Energy Wave", "crit", 18],
    [48, "Energy Wave", "dmg", 7.5],
    [43, "Energy Wave", "cd", 1],
    [45, "Great Death Beam", "crit", 22.5],
    [44, "Great Death Beam", "dmg", 15],
    [55, "Great Energy Beam", "crit", 22.5],
    [54, "Great Energy Beam", "dmg", 15],
    [51, "Great Fire Wave", "crit", 12],
    [50, "Great Fire Wave", "dmg", 7.5],
    [47, "Hell's Core", "crit", 18],
    [46, "Hell's Core", "dmg", 12],
    [53, "Rage of the Skies", "crit", 18],
    [52, "Rage of the Skies", "dmg", 12],
    [4, "Ultimate Healing", "heal", 7.5],
  ],
  paladin: [
    [5, "Gift of Life", "rev", 225],
    [40, "Divine Grenade", "rev", 225],
    [41, "Divine Empowerment", "rev", 225],
    [39, "Avatar of Light", "rev", 225],
    [24, "Avatar of Light", "cd", 900],
    [29, "Divine Caldera", "crit", 12],
    [28, "Divine Caldera", "dmg", 7.5],
    [25, "Divine Dazzle", "cd", 4],
    [36, "Divine Empowerment", "cd", 6],
    [37, "Divine Grenade", "cd", 2],
    [27, "Divine Grenade", "crit", 18],
    [26, "Divine Grenade", "dmg", 9],
    [31, "Divine Missile", "crit", 18],
    [30, "Divine Missile", "dmg", 12],
    [33, "Ethereal Spear", "crit", 22.5],
    [32, "Ethereal Spear", "dmg", 15],
    [38, "Salvation", "heal", 9],
    [35, "Strong Ethereal Spear", "crit", 18],
    [34, "Strong Ethereal Spear", "dmg", 12],
  ],
  monk: [
    [5, "Gift of Life", "rev", 225],
    [92, "Spiritual Outburst", "rev", 225],
    [93, "Ascetic", "rev", 225],
    [91, "Avatar of Balance", "rev", 225],
    [76, "Avatar of Balance", "cd", 900],
    [83, "Flurry of Blows", "crit", 12],
    [82, "Flurry of Blows", "dmg", 9.75],
    [89, "Focus Harmony", "cd", 30],
    [88, "Focus Serenity", "cd", 150],
    [81, "Forceful Uppercut", "crit", 12],
    [80, "Forceful Uppercut", "dmg", 15],
    [85, "Greater Flurry of Blows", "crit", 12],
    [84, "Greater Flurry of Blows", "dmg", 7.5],
    [90, "Mass Spirit Mend", "heal", 7.5],
    [77, "Spirit Mend", "heal", 9],
    [79, "Spiritual Outburst", "crit", 12],
    [78, "Spiritual Outburst", "dmg", 7.5],
    [87, "Sweeping Takedown", "crit", 12],
    [86, "Sweeping Takedown", "dmg", 7.5],
  ],
};

/** Nome da gema da vocação (Lesser = 1 mod, normal = 2, Greater = 3). */
export const GEM_BASE: Record<SetupVocation, string> = {
  knight: "Guardian Gem",
  paladin: "Marksman Gem",
  druid: "Mystic Gem",
  sorcerer: "Sage Gem",
  monk: "Spiritualist Gem",
};

/** Dano e cura extra quando as Vessel Resonances do domínio = nº de mods da gema. */
export const VESSEL_MATCH_BONUS = [0, 1, 1, 2] as const;
export const VESSEL_NAME = ["Vessel vazio", "Dormant Vessel", "Awakened Vessel", "Radiant Vessel"];
