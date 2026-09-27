/**
 * Setup da sessão — campos ESTRUTURADOS (nada de texto livre além do nome da arma) pra jogador
 * comparar o que usou em cada hunt: arma, skills, Wheel of Destiny, postura e Runas de Charm.
 * Veio do pedido de um jogador que escrevia isso nas observações (que são privadas); em texto
 * livre não dava pra mostrar na Comunidade sem abrir porta pra troll, então tudo aqui é escolhido
 * de listas da TibiaWiki BR (conferidas em 2026-09-26: página "Charms", categorias "Magias de
 * Stance", "Habilidades de Convicção/Revelação" da Roda do Destino). Salvo em hunt_sessions.setup
 * (jsonb). A parte "fixa" (sem charms) pode virar preset do personagem — ver setup-presets.ts.
 */

export type SetupVocation = "knight" | "paladin" | "sorcerer" | "druid" | "monk";

export interface SetupCharm {
  charm: string;
  /** 1 = Bronze (desbloqueado), 2 = Prata, 3 = Ouro. */
  level: 1 | 2 | 3;
  creature: string | null;
}

/** Perk de Convicção da Wheel: "Augmented X" tem estágio I/II; os outros só ligado (1). */
export interface SetupConviction {
  perk: string;
  level: 1 | 2;
}

/** Habilidade de Revelação da Wheel (estágios 1–3). */
export interface SetupRevelation {
  perk: string;
  stage: 1 | 2 | 3;
}

export interface SessionSetup {
  weapon: string | null;
  weaponTier: number | null;
  /** Skill principal: Distance (paladino), Melee (knight), Fist (monk). Mago não usa. */
  skill: number | null;
  magicLevel: number | null;
  /** % de dano crítico extra (ex. 14.9). */
  critDamage: number | null;
  /** Wheel of Destiny — bônus de "Dano e cura". */
  wheelDmgHeal: number | null;
  stance: string | null;
  conviction: SetupConviction[];
  revelation: SetupRevelation[];
  charms: SetupCharm[];
}

export const EMPTY_SETUP: SessionSetup = {
  weapon: null,
  weaponTier: null,
  skill: null,
  magicLevel: null,
  critDamage: null,
  wheelDmgHeal: null,
  stance: null,
  conviction: [],
  revelation: [],
  charms: [],
};

const WIKI = "https://www.tibiawiki.com.br/images";

export const WHEEL_ICON = `${WIKI}/f/fb/Wheel_of_Destiny_Icon.gif`;

/** Runas de Charm (Major: Charm Points; Minor: Charm Echoes) com os ícones da wiki. */
export const CHARMS: { name: string; kind: "major" | "minor"; icon: string }[] = [
  { name: "Carnage", kind: "major", icon: `${WIKI}/3/30/Carnage_Icon.gif` },
  { name: "Curse", kind: "major", icon: `${WIKI}/e/e3/Curse_Icon.gif` },
  { name: "Divine Wrath", kind: "major", icon: `${WIKI}/c/cc/Divine_Wrath_Icon.gif` },
  { name: "Dodge", kind: "major", icon: `${WIKI}/2/25/Dodge_Icon.gif` },
  { name: "Enflame", kind: "major", icon: `${WIKI}/7/74/Enflame_Icon.gif` },
  { name: "Freeze", kind: "major", icon: `${WIKI}/7/72/Freeze_Icon.gif` },
  { name: "Low Blow", kind: "major", icon: `${WIKI}/8/8c/Low_Blow_Icon.gif` },
  { name: "Overpower", kind: "major", icon: `${WIKI}/2/2b/Overpower_Icon.gif` },
  { name: "Overflux", kind: "major", icon: `${WIKI}/2/20/Overflux_Icon.gif` },
  { name: "Parry", kind: "major", icon: `${WIKI}/a/a8/Parry_Icon.gif` },
  { name: "Poison", kind: "major", icon: `${WIKI}/5/59/Poison_Icon.gif` },
  { name: "Savage Blow", kind: "major", icon: `${WIKI}/e/e6/Savage_Blow_Icon.gif` },
  { name: "Wound", kind: "major", icon: `${WIKI}/d/d9/Wound_Icon.gif` },
  { name: "Zap", kind: "major", icon: `${WIKI}/2/2f/Zap_Icon.gif` },
  { name: "Adrenaline Burst", kind: "minor", icon: `${WIKI}/1/1d/Adrenaline_Burst_Icon.gif` },
  { name: "Bless", kind: "minor", icon: `${WIKI}/6/6c/Bless_Icon.gif` },
  { name: "Cleanse", kind: "minor", icon: `${WIKI}/9/92/Cleanse_Icon.gif` },
  { name: "Cripple", kind: "minor", icon: `${WIKI}/9/9c/Cripple_Icon.gif` },
  { name: "Gut", kind: "minor", icon: `${WIKI}/f/f0/Gut_Icon.gif` },
  { name: "Numb", kind: "minor", icon: `${WIKI}/0/03/Numb_Icon.gif` },
  { name: "Scavenge", kind: "minor", icon: `${WIKI}/5/5f/Scavenge_Icon.gif` },
  { name: "Fatal Hold", kind: "minor", icon: `${WIKI}/b/b8/Fatal_Hold_Icon.gif` },
  { name: "Vampiric Embrace", kind: "minor", icon: `${WIKI}/4/41/Vampiric_Embrace_Icon.gif` },
  { name: "Void Inversion", kind: "minor", icon: `${WIKI}/7/79/Void_Inversion_Icon.gif` },
  { name: "Void's Call", kind: "minor", icon: `${WIKI}/c/c6/Void%27s_Call_Icon.gif` },
];

export const CHARM_LEVEL_LABEL: Record<1 | 2 | 3, string> = { 1: "Nv1", 2: "Nv2", 3: "Nv3" };

/**
 * "Postura" = magia de buff que fica ativa (só uma por vez). Na wiki: paladino/sorcerer/druid em
 * "Magias de Stance"; knight são Blood Rage (ofensiva) e Protector (defensiva), marcadas como
 * "Suporte, Focus"; monk são as Virtudes (mesmo grupo de cooldown). Ícone = "<Nome>.gif" (GameIcon).
 */
export const STANCES: Record<SetupVocation, string[]> = {
  paladin: ["Sharpshooter", "Divine Defiance"],
  sorcerer: [
    "Aura of Exposed Weakness",
    "Aura of Sapped Strength",
    "Master of Decay",
    "Master of Flames",
    "Master of Thunder",
  ],
  druid: ["Elemental Synthesis", "Shared Conservation"],
  monk: ["Virtue of Harmony", "Virtue of Justice", "Virtue of Sustain"],
  knight: ["Blood Rage", "Protector"],
};

/**
 * Wheel of Destiny — perks de Convicção por vocação ("Habilidades de Convicção" na wiki). Os
 * "Augmented X" têm 2 estágios; os outros (Battle Healing, Ballistic Mastery...) são liga/desliga.
 * Ícone de cada um = "<Nome>.gif" na wiki (GameIcon resolve).
 */
export const WHEEL_CONVICTION: Record<SetupVocation, string[]> = {
  knight: [
    "Battle Healing",
    "Battle Instinct",
    "Augmented Shield Slam",
    "Augmented Fierce Berserk",
    "Augmented Front Sweep",
    "Augmented Groundshaker",
    "Augmented Intense Wound Cleansing",
  ],
  paladin: [
    "Ballistic Mastery",
    "Positional Tactics",
    "Augmented Divine Dazzle",
    "Augmented Divine Caldera",
    "Augmented Ethereal Barrage",
    "Augmented Strong Ethereal Spear",
    "Augmented Divine Barrage",
  ],
  sorcerer: [
    "Focus Mastery",
    "Runic Mastery",
    "Augmented Focus Spells",
    "Augmented Great Fire Wave",
    "Augmented Death Echo",
    "Augmented Energy Wave",
    "Augmented Special Spells",
  ],
  druid: [
    "Healing Link",
    "Runic Mastery",
    "Augmented Heal Friend",
    "Augmented Nature's Embrace",
    "Augmented Strong Ice Wave",
    "Augmented Mass Healing",
    "Augmented Terra Wave",
    "Augmented Forked Spells",
  ],
  monk: [
    "Guiding Presence",
    "Sanctuary",
    "Augmented Flurry of Blows",
    "Augmented Mystic Repulse",
    "Augmented Thousand Fist Blows",
    "Augmented Chained Penance",
    "Augmented Mass Spirit Mend",
  ],
};

/** Revelação por vocação ("Habilidades de Revelação"); Gift of Life vale pra todas. Estágios 1–3. */
export const WHEEL_REVELATION: Record<SetupVocation, string[]> = {
  knight: ["Avatar of Steel", "Executioner's Throw", "Combat Mastery", "Gift of Life"],
  paladin: ["Avatar of Light", "Divine Grenade", "Divine Empowerment", "Gift of Life"],
  sorcerer: [
    "Avatar of Storm",
    "Beam Mastery",
    "Drain Body",
    "Lord of Destruction",
    "Gift of Life",
  ],
  druid: ["Avatar of Nature", "Blessing of the Grove", "Twin Bursts", "Gift of Life"],
  monk: ["Avatar of Balance", "Spiritual Outburst", "Ascetic", "Gift of Life"],
};

export const convictionMaxLevel = (perk: string): 1 | 2 => (perk.startsWith("Augmented ") ? 2 : 1);

export const SKILL_LABEL: Record<SetupVocation, string | null> = {
  paladin: "Distance",
  knight: "Melee",
  monk: "Fist",
  sorcerer: null,
  druid: null,
};

/** "Royal Paladin" → "paladin". Null se não reconhecer (vale a lista de todas as vocações). */
export function setupVocation(vocation: string | null | undefined): SetupVocation | null {
  const v = (vocation ?? "").toLowerCase();
  if (v.includes("paladin")) return "paladin";
  if (v.includes("knight")) return "knight";
  if (v.includes("sorcerer")) return "sorcerer";
  if (v.includes("druid")) return "druid";
  if (v.includes("monk")) return "monk";
  return null;
}

const KNOWN_CHARMS = new Set(CHARMS.map((c) => c.name));
const KNOWN_STANCES = new Set(Object.values(STANCES).flat());
const KNOWN_CONVICTION = new Set(Object.values(WHEEL_CONVICTION).flat());
const KNOWN_REVELATION = new Set(Object.values(WHEEL_REVELATION).flat());

const num = (v: unknown, min: number, max: number): number | null => {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim()
        ? Number(v.replace(",", "."))
        : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
};

/** Nome da arma: só letras, números, espaço, ' e -, até 40 caracteres (é o único texto livre). */
export function cleanWeaponName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v
    .replace(/[^\p{L}\p{N} '-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return s || null;
}

const objs = (v: unknown) =>
  (Array.isArray(v) ? v : []).filter(
    (x): x is Record<string, unknown> => !!x && typeof x === "object",
  );

/** Limpa o que veio do banco/formulário: só valores das listas conhecidas e números em faixa. */
export function normalizeSetup(value: unknown): SessionSetup | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  // Primeira versão (poucas horas no ar) guardava "spells" — viram Convicção "Augmented X".
  const legacy = objs(v.spells).map((s) => ({
    perk: `Augmented ${String(s.spell)}`,
    level: s.level,
  }));
  const setup: SessionSetup = {
    weapon: cleanWeaponName(v.weapon),
    weaponTier: num(v.weaponTier, 0, 10),
    skill: num(v.skill, 0, 400),
    magicLevel: num(v.magicLevel, 0, 200),
    critDamage: num(v.critDamage, 0, 500),
    wheelDmgHeal: num(v.wheelDmgHeal, 0, 500),
    stance: typeof v.stance === "string" && KNOWN_STANCES.has(v.stance) ? v.stance : null,
    conviction: [...objs(v.conviction), ...legacy]
      .filter((c) => typeof c.perk === "string" && KNOWN_CONVICTION.has(c.perk))
      .map((c) => ({
        perk: c.perk as string,
        level: (c.level === 2 && convictionMaxLevel(c.perk as string) === 2 ? 2 : 1) as 1 | 2,
      }))
      .filter((c, i, arr) => arr.findIndex((x) => x.perk === c.perk) === i)
      .slice(0, 12),
    revelation: objs(v.revelation)
      .filter((r) => typeof r.perk === "string" && KNOWN_REVELATION.has(r.perk))
      .map((r) => ({
        perk: r.perk as string,
        stage: (r.stage === 3 ? 3 : r.stage === 2 ? 2 : 1) as 1 | 2 | 3,
      }))
      .filter((r, i, arr) => arr.findIndex((x) => x.perk === r.perk) === i)
      .slice(0, 6),
    charms: objs(v.charms)
      .filter((c) => typeof c.charm === "string" && KNOWN_CHARMS.has(c.charm))
      .map((c) => ({
        charm: c.charm as string,
        level: (c.level === 3 ? 3 : c.level === 2 ? 2 : 1) as 1 | 2 | 3,
        creature:
          typeof c.creature === "string" && c.creature.trim()
            ? c.creature.trim().slice(0, 40)
            : null,
      }))
      .slice(0, 24),
  };
  return isEmptySetup(setup) ? null : setup;
}

export function isEmptySetup(s: SessionSetup | null | undefined): boolean {
  if (!s) return true;
  return (
    !s.weapon &&
    s.weaponTier == null &&
    s.skill == null &&
    s.magicLevel == null &&
    s.critDamage == null &&
    s.wheelDmgHeal == null &&
    !s.stance &&
    s.conviction.length === 0 &&
    s.revelation.length === 0 &&
    s.charms.length === 0
  );
}

/** Parte do setup que vira preset (tudo menos os charms, que dependem das criaturas da hunt). */
export function presetPart(s: SessionSetup): SessionSetup {
  return { ...s, charms: [] };
}

export function charmIcon(name: string): string | undefined {
  return CHARMS.find((c) => c.name === name)?.icon;
}

/** Charms que ativaram na sessão (bloco "Charm" do Miscellaneous). */
export function charmsFromMisc(
  misc: { charm?: Record<string, number> } | null | undefined,
): string[] {
  const names = Object.keys(misc?.charm ?? {}).map((n) => n.toLowerCase());
  return CHARMS.map((c) => c.name).filter((c) => names.includes(c.toLowerCase()));
}
