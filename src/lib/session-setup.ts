/**
 * Setup da sessão — campos ESTRUTURADOS (nada de texto livre além do nome da arma) pra jogador
 * comparar o que usou em cada hunt: arma, skills, Wheel, stance, magias aumentadas e Runas de
 * Charm. Veio do pedido de um jogador que escrevia isso nas observações (que são privadas); em
 * texto livre não dava pra mostrar na Comunidade sem abrir porta pra troll, então tudo aqui é
 * escolhido de listas da TibiaWiki BR (conferidas em 2026-09-26: páginas "Charms", categorias
 * "Magias de <Vocação>" e "Magias de Stance"). Salvo em hunt_sessions.setup (jsonb).
 */

export type SetupVocation = "knight" | "paladin" | "sorcerer" | "druid" | "monk";

export interface SetupCharm {
  charm: string;
  /** 1 = Bronze (desbloqueado), 2 = Prata, 3 = Ouro. */
  level: 1 | 2 | 3;
  creature: string | null;
}

export interface SetupSpell {
  spell: string;
  /** Nível do aumento pela Wheel of Destiny (Augmented 1/2). */
  level: 1 | 2;
}

export interface SessionSetup {
  weapon: string | null;
  weaponTier: number | null;
  /** Skill principal: Distance (paladino), Melee (knight), Fist (monk). Mago não usa. */
  skill: number | null;
  magicLevel: number | null;
  /** % de dano crítico extra (ex. 14.9). */
  critDamage: number | null;
  /** Wheel of Destiny — pontos em "Dano e cura". */
  wheelDmgHeal: number | null;
  stance: string | null;
  spells: SetupSpell[];
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
  spells: [],
  charms: [],
};

const WIKI = "https://www.tibiawiki.com.br/images";

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
 * "Suporte, Focus"; monk são as Virtudes (mesmo grupo de cooldown).
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
 * Magias de combate de cada vocação (as que a Wheel aumenta / que mudam o resultado da hunt).
 * Utilitárias (luz, corda, conjurar munição, curas de condição, invocar familiar...) ficam de fora.
 */
export const COMBAT_SPELLS: Record<SetupVocation, string[]> = {
  paladin: [
    "Avatar of Light",
    "Divine Barrage",
    "Divine Caldera",
    "Divine Dazzle",
    "Divine Empowerment",
    "Divine Grenade",
    "Divine Healing",
    "Divine Missile",
    "Ethereal Barrage",
    "Ethereal Spear",
    "Holy Flash",
    "Intense Recovery",
    "Salvation",
    "Strong Ethereal Spear",
  ],
  knight: [
    "Annihilation",
    "Avatar of Steel",
    "Berserk",
    "Brutal Strike",
    "Chivalrous Challenge",
    "Combat Mastery",
    "Executioner's Throw",
    "Fair Wound Cleansing",
    "Fierce Berserk",
    "Front Sweep",
    "Groundshaker",
    "Intense Recovery",
    "Intense Wound Cleansing",
    "Inflict Wound",
    "Whirlwind Throw",
  ],
  sorcerer: [
    "Avatar of Storm",
    "Beam Mastery",
    "Death Strike",
    "Energy Beam",
    "Energy Wave",
    "Expose Weakness",
    "Fire Wave",
    "Great Death Beam",
    "Great Energy Beam",
    "Great Fire Wave",
    "Hell's Core",
    "Rage of the Skies",
    "Sap Strength",
    "Strong Energy Strike",
    "Strong Flame Strike",
    "Ultimate Energy Strike",
    "Ultimate Flame Strike",
  ],
  druid: [
    "Avatar of Nature",
    "Blessing of the Grove",
    "Eternal Winter",
    "Forked Glacier",
    "Forked Thorns",
    "Heal Friend",
    "Ice Burst",
    "Mass Healing",
    "Nature's Embrace",
    "Strong Ice Strike",
    "Strong Ice Wave",
    "Strong Terra Strike",
    "Terra Burst",
    "Terra Wave",
    "Twin Bursts",
    "Ultimate Ice Strike",
    "Ultimate Terra Strike",
    "Wrath of Nature",
  ],
  monk: [
    "Avatar of Balance",
    "Balanced Brawl",
    "Chained Penance",
    "Devastating Knockout",
    "Double Jab",
    "Flurry of Blows",
    "Focus Harmony",
    "Focus Serenity",
    "Forceful Uppercut",
    "Greater Flurry of Blows",
    "Greater Tiger Clash",
    "Mass Spirit Mend",
    "Mystic Repulse",
    "Spirit Mend",
    "Spiritual Outburst",
    "Sweeping Takedown",
    "Tiger Clash",
  ],
};

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
const KNOWN_SPELLS = new Set(Object.values(COMBAT_SPELLS).flat());
const KNOWN_STANCES = new Set(Object.values(STANCES).flat());

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

/** Limpa o que veio do banco/formulário: só valores das listas conhecidas e números em faixa. */
export function normalizeSetup(value: unknown): SessionSetup | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const setup: SessionSetup = {
    weapon: cleanWeaponName(v.weapon),
    weaponTier: num(v.weaponTier, 0, 10),
    skill: num(v.skill, 0, 400),
    magicLevel: num(v.magicLevel, 0, 200),
    critDamage: num(v.critDamage, 0, 500),
    wheelDmgHeal: num(v.wheelDmgHeal, 0, 500),
    stance: typeof v.stance === "string" && KNOWN_STANCES.has(v.stance) ? v.stance : null,
    spells: (Array.isArray(v.spells) ? v.spells : [])
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .filter((s) => typeof s.spell === "string" && KNOWN_SPELLS.has(s.spell))
      .map((s) => ({ spell: s.spell as string, level: (s.level === 2 ? 2 : 1) as 1 | 2 }))
      .slice(0, 12),
    charms: (Array.isArray(v.charms) ? v.charms : [])
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .filter((c) => typeof c.charm === "string" && KNOWN_CHARMS.has(c.charm))
      .map((c) => ({
        charm: c.charm as string,
        level: (c.level === 3 ? 3 : c.level === 2 ? 2 : 1) as 1 | 2 | 3,
        creature:
          typeof c.creature === "string" && c.creature.trim()
            ? c.creature.trim().slice(0, 40)
            : null,
      }))
      .slice(0, 12),
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
    s.spells.length === 0 &&
    s.charms.length === 0
  );
}

export function charmIcon(name: string): string | undefined {
  return CHARMS.find((c) => c.name === name)?.icon;
}

/** Charms que dispararam na sessão (bloco "Charm" do Miscellaneous), pra sugerir. */
export function charmsFromMisc(
  misc: { charm?: Record<string, number> } | null | undefined,
): string[] {
  const names = Object.keys(misc?.charm ?? {});
  return CHARMS.map((c) => c.name).filter((c) =>
    names.some((n) => n.toLowerCase() === c.toLowerCase()),
  );
}
