/**
 * Wheel of Destiny — build da roda (pontos por fatia + gemas) salva em setup.wheel, e as contas:
 * pontos disponíveis, quais fatias liberam, convicção/revelação ativas, Vessels e mods das gemas.
 * Regras conferidas no planejador oficial (2026-10-07): começa pelas 4 fatias do centro; uma fatia
 * libera quando uma vizinha (que encosta numa borda) está CHEIA; convicção só com a fatia cheia;
 * revelação I/II/III com 250/500/1000 pontos no domínio (+225 por "Revelation Mastery" ativo, até
 * 1000); mod N da gema só liga com N Vessel Resonances cheias no domínio.
 */

import {
  DEDICATION_RATE,
  FIRST_MOD_GENERAL_IDS,
  GEM_BASE,
  GENERAL_BASIC_MODS,
  GENERAL_SUPREME_MODS,
  LIFE_LEECH_PER_SLICE,
  MANA_LEECH_PER_SLICE,
  MITIGATION_PER_POINT,
  PROMOTION_SCROLLS,
  EXTRA_POINTS_MAX,
  REVELATION_DMG_HEAL,
  REVELATION_MASTERY_POINTS,
  REVELATION_STAGE_POINTS,
  VESSEL_MATCH_BONUS,
  VOC_SUPREME_MODS,
  WHEEL_DOMAINS,
  WHEEL_REVELATION_BY_DOMAIN,
  WHEEL_SLICES,
  slicePerk,
  vocationBasicMods,
  type BasicModDef,
  type ResistElement,
  type SupremeModDef,
  type WheelDomain,
  type WheelSliceDef,
} from "@/data/wheel-data";
import type { SetupVocation } from "@/lib/session-setup";

export type WheelGem = [number | null, number | null, number | null];

export interface WheelBuild {
  voc: SetupVocation;
  /** Pontos em cada fatia, na ordem de WHEEL_SLICES (36). */
  points: number[];
  /** Gema encaixada em cada domínio: [mod básico 1, mod básico 2, mod supremo]. */
  gems: Partial<Record<WheelDomain, WheelGem>>;
  /** Level usado pra calcular os pontos (null = sem limite). */
  level: number | null;
  /** Promotion Scrolls usados (bit i = PROMOTION_SCROLLS[i]). */
  scrolls: number;
  /** Outros pontos (Hunting Task Shop, quest do Monk, mods no Grau IV). */
  extra: number;
}

export const WHEEL_TOTAL_POINTS = 4000;

export function emptyWheel(voc: SetupVocation, level: number | null = null): WheelBuild {
  return { voc, points: Array(36).fill(0), gems: {}, level, scrolls: 0, extra: 0 };
}

// ---------------------------------------------------------------------------------------------
// Vizinhança e regras de pontos
// ---------------------------------------------------------------------------------------------

const touches = (a: WheelSliceDef, b: WheelSliceDef) => {
  const eq = (x: number, y: number) => (((x - y) % 360) + 360) % 360 === 0;
  return eq(a.a1, b.a0) || eq(a.a0, b.a1);
};
const overlaps = (a: WheelSliceDef, b: WheelSliceDef) =>
  Math.min(a.a1, b.a1) - Math.max(a.a0, b.a0) > 0;

/** Fatias que dividem uma borda (mesmo anel encostando, ou anel vizinho por cima/baixo). */
export const WHEEL_NEIGHBORS: number[][] = WHEEL_SLICES.map((a) =>
  WHEEL_SLICES.filter(
    (b) =>
      b.i !== a.i &&
      ((b.ring === a.ring && touches(a, b)) || (Math.abs(b.ring - a.ring) === 1 && overlaps(a, b))),
  ).map((b) => b.i),
);

/** Fatias onde dá pra pôr ponto agora (centro, ou vizinha de uma fatia cheia já liberada). */
export function availableSlices(points: number[]): Set<number> {
  const avail = new Set(WHEEL_SLICES.filter((s) => s.ring === 0).map((s) => s.i));
  const queue = [...avail];
  while (queue.length) {
    const i = queue.shift()!;
    if (points[i] < WHEEL_SLICES[i].max) continue;
    for (const n of WHEEL_NEIGHBORS[i]) {
      if (!avail.has(n)) {
        avail.add(n);
        queue.push(n);
      }
    }
  }
  return avail;
}

/** Toda fatia com ponto precisa estar liberada. */
export function isValidPoints(points: number[]): boolean {
  const avail = availableSlices(points);
  return points.every((p, i) => p === 0 || avail.has(i));
}

export const usedPoints = (b: Pick<WheelBuild, "points">) => b.points.reduce((a, p) => a + p, 0);

export const scrollPoints = (mask: number) =>
  PROMOTION_SCROLLS.reduce((a, s, i) => a + (mask & (1 << i) ? s.points : 0), 0);

/** Pontos que o personagem tem (null = sem level informado → sem limite). */
export function wheelBudget(b: Pick<WheelBuild, "level" | "scrolls" | "extra">): number | null {
  if (b.level == null) return null;
  return Math.min(
    WHEEL_TOTAL_POINTS,
    Math.max(0, b.level - 50) + scrollPoints(b.scrolls) + b.extra,
  );
}

export type SetPointsResult = { ok: true; build: WheelBuild } | { ok: false; reason: string };

/**
 * Coloca `value` pontos na fatia (corta no máximo da fatia e no que sobra do orçamento). Recusa se a
 * fatia ainda não liberou ou se tirar pontos deixaria outras fatias sem caminho até o centro.
 */
export function setSlicePoints(b: WheelBuild, index: number, value: number): SetPointsResult {
  const s = WHEEL_SLICES[index];
  const cur = b.points[index];
  let v = Math.max(0, Math.min(s.max, Math.round(value)));
  if (v > cur) {
    if (!availableSlices(b.points).has(index))
      return {
        ok: false,
        reason: "Encha uma fatia vizinha primeiro (a roda abre do centro pra fora).",
      };
    const budget = wheelBudget(b);
    if (budget != null) {
      const free = budget - usedPoints(b);
      if (free <= 0)
        return { ok: false, reason: "Sem pontos sobrando — suba o level ou tire de outra fatia." };
      v = Math.min(v, cur + free);
    }
  }
  if (v === cur) return { ok: true, build: b };
  const points = b.points.slice();
  points[index] = v;
  if (v < cur && !isValidPoints(points))
    return {
      ok: false,
      reason: "Outras fatias dependem desta cheia — tire os pontos delas primeiro.",
    };
  return { ok: true, build: { ...b, points } };
}

// ---------------------------------------------------------------------------------------------
// Gemas e mods
// ---------------------------------------------------------------------------------------------

export function basicModsFor(voc: SetupVocation, slot: 0 | 1): BasicModDef[] {
  if (slot === 1) return GENERAL_BASIC_MODS;
  return [
    ...GENERAL_BASIC_MODS.filter((m) => FIRST_MOD_GENERAL_IDS.includes(m.id)),
    ...vocationBasicMods(voc),
  ];
}

export const supremeModsFor = (voc: SetupVocation): SupremeModDef[] => [
  ...VOC_SUPREME_MODS[voc],
  ...GENERAL_SUPREME_MODS,
];

export const findBasic = (voc: SetupVocation, slot: 0 | 1, id: number | null) =>
  id == null ? null : (basicModsFor(voc, slot).find((m) => m.id === id) ?? null);
export const findSupreme = (voc: SetupVocation, id: number | null) =>
  id == null ? null : (supremeModsFor(voc).find((m) => m[0] === id) ?? null);

const ELEMENT_PT: Record<ResistElement, string> = {
  physical: "Físico",
  fire: "Fogo",
  earth: "Terra",
  ice: "Gelo",
  energy: "Energia",
  holy: "Sagrado",
  death: "Morte",
  lifeDrain: "Life Drain",
  manaDrain: "Mana Drain",
};
export const resistLabel = (el: ResistElement) => ELEMENT_PT[el];

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

export function basicModLabel(m: BasicModDef): string {
  const parts: string[] = [];
  if (m.hp) parts.push(`+${fmt(m.hp)} de vida`);
  if (m.mana) parts.push(`+${fmt(m.mana)} de mana`);
  if (m.cap) parts.push(`+${fmt(m.cap)} de capacidade`);
  if (m.mit) parts.push(`+${fmt(m.mit)}% no multiplicador de mitigação`);
  for (const [el, v] of Object.entries(m.res ?? {}))
    parts.push(`${signed(v!)}% ${ELEMENT_PT[el as ResistElement]}`);
  return parts.join(" / ");
}

export function supremeModLabel(m: SupremeModDef): string {
  const [, name, eff, v] = m;
  switch (eff) {
    case "rev":
      return `Revelation Mastery: +${v} em ${name}`;
    case "crit":
      return `${name}: +${fmt(v)}% de dano crítico extra`;
    case "dmg":
      return `${name}: +${fmt(v)}% de dano base`;
    case "heal":
      return `${name}: +${fmt(v)}% de cura base`;
    case "cd":
      return `${name}: -${v >= 120 ? `${v / 60} min` : `${v}s`} de recarga e +1% de Momentum`;
    case "critAll":
      return `+${fmt(v)}% de dano crítico extra`;
    case "dodge":
      return `+${fmt(v)}% de esquiva (Dodge)`;
    case "life":
      return `+${fmt(v)}% de Life Leech`;
    case "mana":
      return `+${fmt(v)}% de Mana Leech`;
  }
}

/** Quantos mods a gema tem (mods precisam ser preenchidos em ordem). */
export const gemQuality = (g: WheelGem | undefined | null): 0 | 1 | 2 | 3 =>
  !g || g[0] == null ? 0 : g[1] == null ? 1 : g[2] == null ? 2 : 3;

export function gemName(voc: SetupVocation, g: WheelGem | undefined | null): string | null {
  const q = gemQuality(g);
  if (!q) return null;
  const base = GEM_BASE[voc];
  return q === 1 ? `Lesser ${base}` : q === 3 ? `Greater ${base}` : base;
}

/** Mods de uma gema em texto (pra cards de leitura). */
export function gemModsText(voc: SetupVocation, gem: WheelGem): string[] {
  return [findBasic(voc, 0, gem[0]), findBasic(voc, 1, gem[1])]
    .filter(Boolean)
    .map((m) => basicModLabel(m!))
    .concat(
      gem[2] != null && findSupreme(voc, gem[2])
        ? [supremeModLabel(findSupreme(voc, gem[2])!)]
        : [],
    );
}

// ---------------------------------------------------------------------------------------------
// Resumo
// ---------------------------------------------------------------------------------------------

export interface WheelConviction {
  perk: string;
  /** Fatias cheias com esse perk. */
  count: number;
}

export interface WheelDomainSummary {
  domain: WheelDomain;
  points: number;
  /** Pontos de revelação (domínio + Revelation Mastery, até 1000). */
  revelationPoints: number;
  revelation: string;
  stage: 0 | 1 | 2 | 3;
  /** Vessel Resonances cheias no domínio (0–3). */
  vessels: number;
  gem: WheelGem | null;
  gemQuality: 0 | 1 | 2 | 3;
  /** Mods da gema ligados (min de vessels e qualidade). */
  activeMods: number;
  vesselBonus: number;
}

export interface WheelSummary {
  used: number;
  budget: number | null;
  hp: number;
  mana: number;
  cap: number;
  mitigation: number;
  conviction: WheelConviction[];
  skillBoost: number;
  lifeLeech: number;
  manaLeech: number;
  domains: WheelDomainSummary[];
  dmgHeal: number;
  /** Somatório dos mods ativos. */
  resist: Partial<Record<ResistElement, number>>;
  critExtra: number;
  dodge: number;
  /** Mods supremos de magia ativos (texto). */
  augments: string[];
}

export function summarizeWheel(b: WheelBuild): WheelSummary {
  const rate = DEDICATION_RATE[b.voc];
  let hp = 0,
    mana = 0,
    cap = 0,
    mitPoints = 0;
  const counts = new Map<string, number>();
  const vessels: Record<WheelDomain, number> = { TL: 0, TR: 0, BL: 0, BR: 0 };
  const domainPts: Record<WheelDomain, number> = { TL: 0, TR: 0, BL: 0, BR: 0 };
  for (const s of WHEEL_SLICES) {
    const p = b.points[s.i] ?? 0;
    domainPts[s.domain] += p;
    if (s.dedication === "hp" || s.dedication === "hpmana") hp += p * rate.hp;
    if (s.dedication === "mana" || s.dedication === "hpmana") mana += p * rate.mana;
    if (s.dedication === "cap") cap += p * rate.cap;
    if (s.dedication === "mit") mitPoints += p;
    if (p === s.max) {
      if (s.kind === "vessel") vessels[s.domain]++;
      else {
        const perk = slicePerk(b.voc, s);
        counts.set(perk, (counts.get(perk) ?? 0) + 1);
      }
    }
  }
  let mitigation = mitPoints * MITIGATION_PER_POINT;

  // Mods ativos das gemas.
  const resist: Partial<Record<ResistElement, number>> = {};
  let critExtra = 0,
    dodge = 0,
    lifeGem = 0,
    manaGem = 0;
  const augments: string[] = [];
  const mastery: Record<string, number> = {};
  const addRes = (res: BasicModDef["res"]) => {
    for (const [el, v] of Object.entries(res ?? {}))
      resist[el as ResistElement] = (resist[el as ResistElement] ?? 0) + v!;
  };
  const gemInfo = WHEEL_DOMAINS.map((d) => {
    const gem = b.gems[d] ?? null;
    const q = gemQuality(gem);
    const active = Math.min(q, vessels[d]);
    if (gem) {
      for (const slot of [0, 1] as const) {
        if (active <= slot) continue;
        const m = findBasic(b.voc, slot, gem[slot]);
        if (!m) continue;
        hp += m.hp ?? 0;
        mana += m.mana ?? 0;
        cap += m.cap ?? 0;
        mitigation += m.mit ?? 0;
        addRes(m.res);
      }
      const sup = active >= 3 ? findSupreme(b.voc, gem[2]) : null;
      if (sup) {
        const [, name, eff, v] = sup;
        if (eff === "rev") mastery[name] = (mastery[name] ?? 0) + v;
        else if (eff === "critAll") critExtra += v;
        else if (eff === "dodge") dodge += v;
        else if (eff === "life") lifeGem += v;
        else if (eff === "mana") manaGem += v;
        else augments.push(supremeModLabel(sup));
      }
    }
    const vesselBonus = q > 0 && vessels[d] === q ? VESSEL_MATCH_BONUS[q] : 0;
    return { d, gem, q, active, vesselBonus };
  });

  let dmgHeal = 0;
  const domains: WheelDomainSummary[] = WHEEL_DOMAINS.map((d, k) => {
    const revelation = WHEEL_REVELATION_BY_DOMAIN[b.voc][d];
    const revelationPoints = Math.min(1000, domainPts[d] + (mastery[revelation] ?? 0));
    const stage = REVELATION_STAGE_POINTS.filter((t) => revelationPoints >= t).length as
      0 | 1 | 2 | 3;
    const g = gemInfo[k];
    dmgHeal += REVELATION_DMG_HEAL[stage] + g.vesselBonus;
    return {
      domain: d,
      points: domainPts[d],
      revelationPoints,
      revelation,
      stage,
      vessels: vessels[d],
      gem: g.gem,
      gemQuality: g.q,
      activeMods: g.active,
      vesselBonus: g.vesselBonus,
    };
  });

  const order = (perk: string) =>
    perk.startsWith("Augmented ") ? 1 : /Skill Boost|Leech/.test(perk) ? 2 : 0;
  const conviction = [...counts.entries()]
    .map(([perk, count]) => ({ perk, count }))
    .sort((a, b) => order(a.perk) - order(b.perk) || a.perk.localeCompare(b.perk));
  const take = (match: (p: string) => boolean) =>
    conviction.filter((c) => match(c.perk)).reduce((a, c) => a + c.count, 0);

  return {
    used: usedPoints(b),
    budget: wheelBudget(b),
    hp,
    mana,
    cap,
    mitigation,
    conviction,
    skillBoost: take((p) => p.endsWith("Skill Boost")),
    lifeLeech: take((p) => p === "Life Leech") * LIFE_LEECH_PER_SLICE + lifeGem,
    manaLeech: take((p) => p === "Mana Leech") * MANA_LEECH_PER_SLICE + manaGem,
    domains,
    dmgHeal,
    resist,
    critExtra,
    dodge,
    augments,
  };
}

/** Campos antigos do setup (lista de convicção/revelação e "dano e cura") tirados da roda. */
export function wheelSetupFields(b: WheelBuild) {
  const sum = summarizeWheel(b);
  return {
    conviction: sum.conviction
      .filter((c) => !/^(Life Leech|Mana Leech)$|Skill Boost$/.test(c.perk))
      .map((c) => ({ perk: c.perk, level: (c.count >= 2 ? 2 : 1) as 1 | 2 })),
    revelation: sum.domains
      .filter((d) => d.stage > 0)
      .map((d) => ({ perk: d.revelation, stage: d.stage as 1 | 2 | 3 })),
    wheelDmgHeal: sum.dmgHeal || null,
  };
}

// ---------------------------------------------------------------------------------------------
// Validação do que vem do banco
// ---------------------------------------------------------------------------------------------

const VOCS: SetupVocation[] = ["knight", "paladin", "sorcerer", "druid", "monk"];

const int = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : null;

export function normalizeWheel(value: unknown): WheelBuild | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const voc = VOCS.find((x) => x === v.voc);
  if (!voc || !Array.isArray(v.points)) return null;
  const points = WHEEL_SLICES.map((s) => int((v.points as unknown[])[s.i], 0, s.max) ?? 0);
  // Fatia sem caminho até o centro (dado mexido) perde os pontos.
  const avail = availableSlices(points);
  points.forEach((p, i) => {
    if (p && !avail.has(i)) points[i] = 0;
  });
  const gems: WheelBuild["gems"] = {};
  const rawGems = (v.gems ?? {}) as Record<string, unknown>;
  for (const d of WHEEL_DOMAINS) {
    const g = rawGems[d];
    if (!Array.isArray(g)) continue;
    const m1 = findBasic(voc, 0, int(g[0], 0, 999))?.id ?? null;
    if (m1 == null) continue;
    // O 2º mod não repete o 1º (os dois dividem os ids 3–6).
    const m2raw = findBasic(voc, 1, int(g[1], 0, 999))?.id ?? null;
    const m2 = m2raw === m1 ? null : m2raw;
    const m3 = m2 == null ? null : (findSupreme(voc, int(g[2], 0, 999))?.[0] ?? null);
    gems[d] = [m1, m2, m3];
  }
  const build: WheelBuild = {
    voc,
    points,
    gems,
    level: int(v.level, 1, 5000),
    scrolls: int(v.scrolls, 0, 31) ?? 0,
    extra: int(v.extra, 0, EXTRA_POINTS_MAX) ?? 0,
  };
  return usedPoints(build) > 0 || Object.keys(gems).length ? build : null;
}

export function isEmptyWheel(b: WheelBuild | null | undefined): boolean {
  return !b || (usedPoints(b) === 0 && !Object.keys(b.gems).length);
}
