import { fmtNum } from "./format";
import { ELEMENT_PT } from "./hunt-advisor";
import { listHunts, type HuntSpeedSession } from "./hunt-speed";
import { findMonster, type AttackElement, type Element, type MonsterInfo } from "./monsters";
import type { SetupVocation } from "./session-setup";

/**
 * OTIMIZADOR DE CHARMS (sugestão do jogador Yin Sylvan, 20/10/2026): com os charms que o
 * personagem tem (ficha do personagem, character-sheet.ts), diz quais rendem mais contra uma
 * criatura ou contra as criaturas de uma hunt, cada um com o porquê em uma linha.
 *
 * Regras e números: TibiaWiki BR, página "Charms" (versão aprovada em 23/01/2026, conferida em
 * 2026-11-25) — https://www.tibiawiki.com.br/wiki/Charms. O tipo do dano do Overpower, Overflux,
 * Carnage e Parry (físico) e o "só no alvo principal" vêm da TibiaWiki em inglês
 * (https://tibia.fandom.com/wiki/Cyclopedia#Charms), porque a BR não diz. Vida e mana por level:
 * TibiaWiki (Hit Point / Mana Point): no level 8 todo mundo tem 185 de vida e 90 de mana; por level,
 * Knight +15/+5, Paladin +10/+15, Monk +10/+10, Sorcerer e Druid +5/+30.
 *
 * Como compara (heurística simples de propósito, cada número explicado ao jogador):
 *  - charms de DANO (elementais, Overpower, Overflux) → dano extra médio por ataque, em pontos de
 *    vida da criatura = chance do nível × dano de uma ativação. Dá pra comparar entre si direto.
 *  - Low Blow, Savage Blow e Carnage dependem do set (crítico) ou de quantas criaturas você junta,
 *    então aparecem à parte, sem número inventado.
 *  - DEFESA (Dodge, Parry) e MINOR: regra por dado da criatura (dano máximo, drena mana...).
 */

export type CharmLevel = 1 | 2 | 3;
export type CharmKind = "major" | "minor";

type CharmEffect =
  | { type: "elemental"; element: Element }
  | { type: "overpower" }
  | { type: "overflux" }
  | { type: "carnage" }
  | { type: "low-blow" }
  | { type: "savage-blow" }
  | { type: "dodge" }
  | { type: "parry" }
  | { type: "minor" };

export interface CharmRule {
  name: string;
  kind: CharmKind;
  /** Valor de cada nível (Bronze, Prata, Ouro): chance ou bônus em %, como na wiki. */
  values: readonly [number, number, number];
  /** Custo de CADA nível (desbloquear, Nv2, Nv3): Charm Points (major) ou Minor Charm Echoes (minor). */
  cost: readonly [number, number, number];
  effect: CharmEffect;
}

const STD: readonly [number, number, number] = [5, 10, 11];
const MINOR_STD: readonly [number, number, number] = [6, 9, 12];
const MINOR_COST: readonly [number, number, number] = [100, 150, 225];

const elemental = (
  name: string,
  element: Element,
  cost: readonly [number, number, number],
): CharmRule => ({
  name,
  kind: "major",
  values: STD,
  cost,
  effect: { type: "elemental", element },
});

const minor = (name: string, values: readonly [number, number, number] = MINOR_STD): CharmRule => ({
  name,
  kind: "minor",
  values,
  cost: MINOR_COST,
  effect: { type: "minor" },
});

/** Os 25 charms da página "Charms" da TibiaWiki BR (14 Major + 11 Minor). */
export const CHARM_RULES: readonly CharmRule[] = [
  elemental("Wound", "physical", [240, 360, 1200]),
  elemental("Poison", "earth", [240, 360, 1200]),
  elemental("Enflame", "fire", [400, 600, 2000]),
  elemental("Curse", "death", [360, 540, 1800]),
  elemental("Zap", "energy", [320, 480, 1600]),
  elemental("Divine Wrath", "holy", [600, 900, 3000]),
  elemental("Freeze", "ice", [320, 480, 1600]),
  {
    name: "Overpower",
    kind: "major",
    values: STD,
    cost: [600, 900, 3000],
    effect: { type: "overpower" },
  },
  {
    name: "Overflux",
    kind: "major",
    values: STD,
    cost: [600, 900, 3000],
    effect: { type: "overflux" },
  },
  {
    name: "Carnage",
    kind: "major",
    values: [10, 20, 22],
    cost: [600, 900, 3000],
    effect: { type: "carnage" },
  },
  {
    name: "Low Blow",
    kind: "major",
    values: [4, 8, 9],
    cost: [800, 1200, 4000],
    effect: { type: "low-blow" },
  },
  {
    name: "Savage Blow",
    kind: "major",
    values: [20, 40, 44],
    cost: [800, 1200, 4000],
    effect: { type: "savage-blow" },
  },
  { name: "Dodge", kind: "major", values: STD, cost: [240, 360, 1200], effect: { type: "dodge" } },
  { name: "Parry", kind: "major", values: STD, cost: [400, 600, 2000], effect: { type: "parry" } },
  minor("Adrenaline Burst"),
  minor("Bless"),
  minor("Cleanse"),
  minor("Cripple"),
  minor("Gut"),
  minor("Numb"),
  minor("Scavenge", [60, 90, 120]),
  minor("Fatal Hold", [30, 45, 60]),
  minor("Vampiric Embrace", [1.6, 2.4, 3.2]),
  minor("Void Inversion", [20, 30, 40]),
  minor("Void's Call", [0.8, 1.2, 1.6]),
];

export function charmRule(name: string): CharmRule | undefined {
  return CHARM_RULES.find((r) => r.name === name);
}

/** Quanto custa sair do zero até o nível (os custos da wiki são por nível, somam). */
export function charmCostToLevel(rule: CharmRule, level: CharmLevel): number {
  return rule.cost.slice(0, level).reduce((a, b) => a + b, 0);
}

export const charmCurrency = (kind: CharmKind) =>
  kind === "major" ? "Charm Points" : "Minor Charm Echoes";

// ------------------------------------------------------------------ personagem

const HP_PER_LEVEL: Record<SetupVocation, number> = {
  knight: 15,
  paladin: 10,
  monk: 10,
  sorcerer: 5,
  druid: 5,
};
const MANA_PER_LEVEL: Record<SetupVocation, number> = {
  knight: 5,
  paladin: 15,
  monk: 10,
  sorcerer: 30,
  druid: 30,
};

/** Vida máxima base no level (sem bônus de equipamento nem Wheel). Null sem vocação ou level. */
export function characterHp(voc: SetupVocation | null, level: number | null): number | null {
  if (!voc || !level || level < 1) return null;
  return 185 + HP_PER_LEVEL[voc] * (Math.max(level, 8) - 8);
}

/** Mana máxima base no level (sem bônus de equipamento nem Wheel). */
export function characterMana(voc: SetupVocation | null, level: number | null): number | null {
  if (!voc || !level || level < 1) return null;
  return 90 + MANA_PER_LEVEL[voc] * (Math.max(level, 8) - 8);
}

// ------------------------------------------------------------------ uma criatura

export interface CharmContext {
  vocation: SetupVocation | null;
  level: number | null;
  /** Charms que o personagem tem, com o nível. Vazio = a pessoa ainda não marcou (mostra todos no Nv1). */
  owned: Partial<Record<string, CharmLevel>>;
  /** Nível do loot do Bounty Talisman (pra avisar que não soma com o Gut). */
  talismanLoot?: number;
}

export type CharmGroup = "damage" | "defense" | "build" | "minor";

export interface CharmOption {
  charm: string;
  kind: CharmKind;
  group: CharmGroup;
  /** Nível que o personagem tem (null = não tem). */
  owned: CharmLevel | null;
  /** Nível usado na conta. */
  level: CharmLevel;
  /** Dano extra médio por ataque, em pontos de vida da criatura (só nos de dano; null = falta dado). */
  avgDamage: number | null;
  /** Pra ordenar dentro do grupo (maior = melhor). */
  score: number;
  /** O porquê, em uma linha. */
  why: string;
}

export interface CreatureCharmAdvice {
  monster: MonsterInfo;
  /** A pessoa marcou algum charm na ficha? Sem isso, as listas mostram todos no Nv1. */
  knowsOwned: boolean;
  dangerous: boolean;
  /** Maior dano de um ataque dela (null = a wiki não diz). */
  maxHit: number | null;
  damage: CharmOption[];
  defense: CharmOption[];
  build: CharmOption[];
  minor: CharmOption[];
  /** Charms que o personagem NÃO tem e renderiam mais que o melhor que ele tem ("vale desbloquear"). */
  unlock: CharmOption[];
  bestMajor: CharmOption | null;
  bestMinor: CharmOption | null;
}

const pct = (v: number) => `${String(Math.round(v * 10) / 10).replace(".", ",")}%`;

/** Dano que a criatura toma do elemento (100 = normal). A wiki não informa = 100. */
const modOf = (m: MonsterInfo, el: Element) => m.mods[el] ?? 100;

function resistLabel(m: MonsterInfo, el: Element): string {
  const name = ELEMENT_PT[el];
  const mod = m.mods[el];
  if (mod == null) return `A wiki não diz a resistência a ${name} (conta 100%)`;
  if (mod < 0) return `Ela se cura com ${name}`;
  if (mod === 0) return `Imune a ${name}`;
  if (mod > 100) return `Fraca a ${name} (${mod}%)`;
  if (mod < 100) return `Resiste a ${name} (${mod}%)`;
  return `Dano normal de ${name} (100%)`;
}

/** Maior dano de um ataque da criatura (os -1 da wiki = "tem, mas não diz quanto" ficam de fora). */
export function monsterMaxHit(m: MonsterInfo): number | null {
  const hits = (Object.values(m.attacks) as number[]).filter((v) => v > 0);
  return hits.length ? Math.max(...hits) : null;
}

/** Bate forte: um ataque tira 20% ou mais da sua vida; sem level, criatura Difícil/Desafiadora no Bestiário. */
function isDangerous(maxHit: number | null, hp: number | null, m: MonsterInfo): boolean {
  if (maxHit != null && hp) return maxHit / hp >= 0.2;
  return (m.charmPoints ?? 0) >= 50;
}

function hitLabel(maxHit: number | null, hp: number | null): string {
  if (maxHit == null) return "a wiki não diz quanto ela bate";
  return hp
    ? `ela bate até ${fmtNum(maxHit)} (${Math.round((maxHit / hp) * 100)}% da sua vida)`
    : `ela bate até ${fmtNum(maxHit)}`;
}

/** Condições que os ataques de cada elemento costumam deixar (Cleanse tira uma). */
const CONDITION: Partial<Record<AttackElement, string>> = {
  earth: "veneno",
  fire: "queimadura",
  energy: "eletrificado",
  death: "maldição",
};

function damageOption(
  rule: CharmRule,
  level: CharmLevel,
  m: MonsterInfo,
  ctx: CharmContext,
): { avg: number | null; why: string } {
  const chance = rule.values[level - 1] / 100;
  const e = rule.effect;
  if (e.type === "elemental") {
    const mod = Math.max(0, modOf(m, e.element));
    const perHit = m.hp * 0.05 * (mod / 100);
    const label = resistLabel(m, e.element);
    if (perHit <= 0) return { avg: 0, why: `${label}: não causa dano nela` };
    return {
      avg: chance * perHit,
      why: `${label}: 5% da vida dela vira ~${fmtNum(perHit)} de dano por ativação`,
    };
  }
  // Overpower/Overflux: dano físico tirado da SUA vida/mana, limitado a 8% da vida da criatura.
  const isPower = e.type === "overpower";
  const pool = isPower
    ? characterHp(ctx.vocation, ctx.level)
    : characterMana(ctx.vocation, ctx.level);
  const what = isPower ? "vida" : "mana";
  if (pool == null)
    return { avg: null, why: `Informe o level e a vocação: o dano sai da sua ${what} máxima` };
  const raw = pool * (isPower ? 0.05 : 0.025);
  const cap = m.hp * 0.08;
  const phys = Math.max(0, modOf(m, "physical"));
  const perHit = Math.min(raw, cap) * (phys / 100);
  const physNote = phys !== 100 ? ` · ela toma ${phys}% de físico` : "";
  const why =
    raw >= cap
      ? `Bate no limite de 8% da vida dela: ~${fmtNum(perHit)} por ativação${physNote}`
      : `${isPower ? "5" : "2,5"}% da sua ${what} estimada (~${fmtNum(raw)}) por ativação, abaixo do limite de 8% da vida dela${physNote}`;
  return { avg: chance * perHit, why };
}

function buildWhy(rule: CharmRule, level: CharmLevel, m: MonsterInfo): string {
  const v = rule.values[level - 1];
  if (rule.effect.type === "low-blow")
    return `+${pct(v)} de chance de crítico em ataques que podem dar crítico; não depende da criatura`;
  if (rule.effect.type === "savage-blow")
    return `+${pct(v)} de dano crítico; só rende se você já tem chance de crítico (Strike ou Low Blow)`;
  const phys = Math.max(0, modOf(m, "physical"));
  return `Ao matar, ${pct(v)} de chance de causar ~${fmtNum(m.hp * 0.15 * (phys / 100))} (15% da vida dela) em volta: bom em hunt de box`;
}

function minorOption(
  rule: CharmRule,
  level: CharmLevel,
  m: MonsterInfo,
  ctx: CharmContext,
  dangerous: boolean,
  hits: string,
): { score: number; why: string } {
  const v = pct(rule.values[level - 1]);
  const voc = ctx.vocation;
  const mage = voc === "sorcerer" || voc === "druid";
  switch (rule.name) {
    case "Void Inversion":
      return m.attacks.manadrain
        ? { score: 3, why: `Ela drena mana: ${v} de chance de ganhar a mana em vez de perder` }
        : { score: 0, why: "Ela não drena mana" };
    case "Void's Call":
      return {
        score: mage ? 2 : voc === "knight" ? 0.5 : 1,
        why: `+${v} de Mana Leech (só com equipamento que tem Mana Leech)`,
      };
    case "Vampiric Embrace":
      return {
        score: mage ? 1 : 2,
        why: `+${v} de Life Leech (só com equipamento que tem Life Leech)`,
      };
    case "Gut":
      return {
        score: 1.5,
        why:
          `+${v} de produtos de criatura no loot` +
          ((ctx.talismanLoot ?? 0) > 0
            ? "; não soma com o loot do seu Bounty Talisman (vale o maior)"
            : ""),
      };
    case "Bless":
      return dangerous
        ? { score: 2, why: `Perde ${v} menos XP e skill se morrer pra ela: ${hits}` }
        : { score: 0.5, why: "Só vale se você morrer pra ela" };
    case "Adrenaline Burst":
      return {
        score: dangerous ? 1.5 : 0.5,
        why: `Depois de apanhar, ${v} de chance de correr 150% mais rápido por 10 s: ajuda a fugir`,
      };
    case "Numb":
    case "Cripple":
      return {
        score: dangerous ? 1.5 : 0.75,
        why: `${v} de chance de paralisar a criatura por 10 s${dangerous ? `: ${hits}` : ""}`,
      };
    case "Cleanse": {
      const conds = (Object.keys(CONDITION) as AttackElement[]).filter((el) => m.attacks[el]);
      return conds.length
        ? {
            score: 1.25,
            why: `Ela ataca com ${conds.map((el) => ELEMENT_PT[el as Element]).join(" e ")} (${conds
              .map((el) => CONDITION[el])
              .join(", ")}): ${v} de chance de tirar a condição`,
          }
        : { score: 0.25, why: "Ela não usa ataque que deixa condição" };
    }
    case "Scavenge":
      return { score: 0.5, why: `Só vale em criatura de Skinning/Dusting (+${v} de chance)` };
    case "Fatal Hold":
      return {
        score: 0.5,
        why: `Só vale em criatura que foge com pouca vida (${v} de chance de segurar)`,
      };
    default:
      return { score: 0, why: "" };
  }
}

const byScore = (a: CharmOption, b: CharmOption) =>
  b.score - a.score || a.charm.localeCompare(b.charm);

/** Uma opção de charm pra criatura, no nível que a pessoa tem (ou `level`, se não tem). */
function optionFor(
  rule: CharmRule,
  m: MonsterInfo,
  ctx: CharmContext,
  dangerous: boolean,
  maxHit: number | null,
  levelIfMissing: CharmLevel,
): CharmOption {
  const owned = ctx.owned[rule.name] ?? null;
  const level = owned ?? levelIfMissing;
  const hp = characterHp(ctx.vocation, ctx.level);
  const hits = hitLabel(maxHit, hp);
  const base = { charm: rule.name, kind: rule.kind, owned, level, avgDamage: null };
  const t = rule.effect.type;
  if (t === "elemental" || t === "overpower" || t === "overflux") {
    const d = damageOption(rule, level, m, ctx);
    return { ...base, group: "damage", avgDamage: d.avg, score: d.avg ?? -1, why: d.why };
  }
  if (t === "dodge" || t === "parry") {
    const v = pct(rule.values[level - 1]);
    const what =
      t === "dodge"
        ? `esquiva de ${v} dos ataques`
        : `devolve ${v} do dano que você toma como dano físico (só a armadura dela reduz)`;
    return {
      ...base,
      group: "defense",
      score: (dangerous ? 2 : 0.5) * rule.values[level - 1],
      why: dangerous
        ? `${hits.charAt(0).toUpperCase()}${hits.slice(1)}: ${what}`
        : `Ela bate pouco (${hits}): um charm de dano rende mais`,
    };
  }
  if (t === "low-blow" || t === "savage-blow" || t === "carnage") {
    // Sem número comparável entre eles (depende do set e do box): o de nível maior vem primeiro.
    return { ...base, group: "build", score: level, why: buildWhy(rule, level, m) };
  }
  const mo = minorOption(rule, level, m, ctx, dangerous, hits);
  // Todo minor sobe 1× → 1,5× → 2× do Nv1 ao Nv3: a nota da regra vezes esse fator.
  const levelFactor = rule.values[level - 1] / rule.values[0];
  return { ...base, group: "minor", score: mo.score * levelFactor, why: mo.why };
}

/**
 * Melhores charms contra UMA criatura. Com charms marcados na ficha, as listas trazem só os que o
 * personagem tem; os que ele não tem e renderiam mais que o melhor dele vão pra `unlock`.
 */
export function adviseCreature(monster: MonsterInfo, ctx: CharmContext): CreatureCharmAdvice {
  const knowsOwned = Object.values(ctx.owned).some(Boolean);
  const maxHit = monsterMaxHit(monster);
  const dangerous = isDangerous(maxHit, characterHp(ctx.vocation, ctx.level), monster);
  const all = CHARM_RULES.map((r) => optionFor(r, monster, ctx, dangerous, maxHit, 1));
  const mine = knowsOwned ? all.filter((o) => o.owned) : all;
  const group = (g: CharmGroup) => mine.filter((o) => o.group === g).sort(byScore);
  const damage = group("damage");
  const minorList = group("minor");
  const bestMajor = damage.find((o) => (o.avgDamage ?? 0) > 0) ?? null;
  const bestMinor = minorList.find((o) => o.score > 0) ?? null;

  const unlock: CharmOption[] = [];
  if (knowsOwned) {
    // Compara no MESMO nível do melhor que a pessoa tem: "se esse estivesse no Nv3 como o seu Wound".
    const lvl: CharmLevel = bestMajor?.level ?? 1;
    const target = bestMajor?.avgDamage ?? 0;
    const majors = CHARM_RULES.filter((r) => r.kind === "major" && !ctx.owned[r.name])
      .map((r) => optionFor(r, monster, ctx, dangerous, maxHit, lvl))
      .filter((o) => o.group === "damage" && (o.avgDamage ?? 0) > target)
      .sort(byScore)
      .slice(0, 3);
    const bestMinorScore = bestMinor?.score ?? 0;
    const minors = CHARM_RULES.filter((r) => r.kind === "minor" && !ctx.owned[r.name])
      .map((r) => optionFor(r, monster, ctx, dangerous, maxHit, 1))
      // Minor só entra se for uma escolha forte pra essa criatura (ex.: Void Inversion em quem drena mana).
      .filter((o) => o.score >= 2 && o.score > bestMinorScore)
      .sort(byScore)
      .slice(0, 1);
    unlock.push(...majors, ...minors);
  }

  return {
    monster,
    knowsOwned,
    dangerous,
    maxHit,
    damage,
    defense: group("defense"),
    build: group("build"),
    minor: minorList,
    unlock,
    bestMajor,
    bestMinor,
  };
}

// ------------------------------------------------------------------ hunt inteira

export interface HuntCharmRow {
  monster: MonsterInfo;
  /** % das kills da hunt. */
  share: number;
  major: CharmOption | null;
  minor: CharmOption | null;
}

export interface HuntCharmPlan {
  rows: HuntCharmRow[];
  /** Criaturas fora do plano: boss, sem Bestiário ou sem dados na wiki. */
  skipped: string[];
}

/** Criaturas com menos que isso das kills da hunt não ganham charm no plano (não compensa). */
export const MIN_SHARE = 3;

/**
 * Charms pra uma hunt inteira. No jogo cada charm vai em UMA criatura (1 Major + 1 Minor por
 * criatura), então o plano distribui: o par criatura × charm que mais rende vem primeiro (dano
 * médio por ataque ÷ vida da criatura × fatia das kills) e cada charm é usado uma vez só.
 */
export function planHuntCharms(
  kills: { name: string; count: number }[],
  ctx: CharmContext,
): HuntCharmPlan {
  const total = kills.reduce((a, k) => a + k.count, 0) || 1;
  const skipped: string[] = [];
  const advices: { advice: CreatureCharmAdvice; share: number }[] = [];
  for (const k of [...kills].sort((a, b) => b.count - a.count)) {
    const share = (k.count / total) * 100;
    const m = findMonster(k.name);
    // Boss e criatura sem Bestiário (sem charm points na wiki) não aceitam charm.
    if (!m || m.boss || m.charmPoints == null || m.hp <= 0) {
      skipped.push(k.name);
      continue;
    }
    if (share < MIN_SHARE) continue;
    advices.push({ advice: adviseCreature(m, ctx), share });
  }

  const rows: HuntCharmRow[] = advices.map(({ advice, share }) => ({
    monster: advice.monster,
    share,
    major: null,
    minor: null,
  }));

  const assign = (
    pick: (a: CreatureCharmAdvice) => CharmOption[],
    value: (o: CharmOption, a: CreatureCharmAdvice, share: number) => number,
    slot: "major" | "minor",
  ) => {
    const pairs = advices.flatMap(({ advice, share }, i) =>
      pick(advice).map((o) => ({ i, o, v: value(o, advice, share) })),
    );
    pairs.sort((a, b) => b.v - a.v || a.o.charm.localeCompare(b.o.charm));
    const used = new Set<string>();
    for (const p of pairs) {
      if (p.v <= 0 || rows[p.i][slot] || used.has(p.o.charm)) continue;
      rows[p.i][slot] = p.o;
      used.add(p.o.charm);
    }
  };

  assign(
    (a) => a.damage,
    (o, a, share) => ((o.avgDamage ?? 0) / a.monster.hp) * share,
    "major",
  );
  assign(
    (a) => a.minor,
    (o, _a, share) => o.score * share,
    "minor",
  );

  return { rows, skipped };
}

/** Criaturas de uma hunt do histórico (todas as sessões com esse nome). */
export function huntKills(
  sessions: HuntSpeedSession[],
  huntName: string,
): { name: string; count: number }[] {
  const key = huntName.trim().toLowerCase();
  return listHunts(sessions).find((h) => h.huntName.trim().toLowerCase() === key)?.monsters ?? [];
}
