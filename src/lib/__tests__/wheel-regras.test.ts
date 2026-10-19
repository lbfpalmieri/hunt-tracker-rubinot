import { describe, expect, it } from "vitest";
import { GEM_BASE, PROMOTION_SCROLLS, REVELATION_STAGE_POINTS, VESSEL_MATCH_BONUS, WHEEL_SLICES } from "@/data/wheel-data";
import {
  WHEEL_NEIGHBORS,
  WHEEL_TOTAL_POINTS,
  availableSlices,
  basicModsFor,
  emptyWheel,
  gemName,
  gemQuality,
  isEmptyWheel,
  normalizeWheel,
  setSlicePoints,
  summarizeWheel,
  supremeModsFor,
  usedPoints,
  wheelBudget,
  type WheelBuild,
  type WheelGem,
} from "../wheel";

// Regras da Wheel of Destiny (planejador oficial do tibia.com, conferido em 2026-10-07).
const center = WHEEL_SLICES.filter((s) => s.ring === 0).map((s) => s.i);
const outside = WHEEL_SLICES.find((s) => s.ring > 0)!.i;

/** Roda com todas as fatias cheias (enchendo do centro pra fora). */
function fullWheel(): WheelBuild {
  let b = emptyWheel("knight");
  for (let pass = 0; pass < 36 && usedPoints(b) < WHEEL_SLICES.reduce((a, s) => a + s.max, 0); pass++)
    for (const i of availableSlices(b.points)) {
      const r = setSlicePoints(b, i, 9999);
      if (r.ok) b = r.build;
    }
  return b;
}

/** Gema completa (2 mods básicos diferentes + supremo) válida pro knight. */
function fullGem(): WheelGem {
  const m1 = basicModsFor("knight", 0)[0].id;
  const m2 = basicModsFor("knight", 1).find((m) => m.id !== m1)!.id;
  return [m1, m2, supremeModsFor("knight")[0][0]];
}

describe("pontos da roda", () => {
  it("pontos = level − 50 + scrolls + extra, até 4000; sem level = sem limite", () => {
    expect(wheelBudget({ level: null, scrolls: 0, extra: 0 })).toBeNull();
    expect(wheelBudget({ level: 30, scrolls: 0, extra: 0 })).toBe(0);
    expect(wheelBudget({ level: 300, scrolls: 0, extra: 0 })).toBe(250);
    expect(wheelBudget({ level: 300, scrolls: 0b11, extra: 10 })).toBe(
      250 + PROMOTION_SCROLLS[0].points + PROMOTION_SCROLLS[1].points + 10,
    );
    expect(wheelBudget({ level: 9000, scrolls: 0, extra: 0 })).toBe(WHEEL_TOTAL_POINTS);
  });

  it("começa pelas fatias do centro", () => {
    expect([...availableSlices(emptyWheel("knight").points)].sort()).toEqual([...center].sort());
  });

  it("fatia de fora só libera com uma vizinha cheia", () => {
    const r = setSlicePoints(emptyWheel("knight"), outside, 10);
    expect(r).toMatchObject({ ok: false, reason: expect.stringContaining("Encha uma fatia vizinha") });
  });

  it("corta no que sobra de pontos e recusa quando acabou", () => {
    const b = emptyWheel("knight", 60); // 10 pontos
    const r = setSlicePoints(b, center[0], 9999);
    expect(r.ok && r.build.points[center[0]]).toBe(10);
    const r2 = r.ok ? setSlicePoints(r.build, center[1], 5) : null;
    expect(r2).toMatchObject({ ok: false, reason: expect.stringContaining("Sem pontos sobrando") });
  });

  it("não deixa esvaziar uma fatia da qual outras dependem", () => {
    let b = emptyWheel("knight");
    const c = center[0];
    b = (setSlicePoints(b, c, 9999) as { build: WheelBuild }).build;
    const n = WHEEL_NEIGHBORS[c].find((i) => !center.includes(i))!;
    b = (setSlicePoints(b, n, 1) as { build: WheelBuild }).build;
    const r = setSlicePoints(b, c, 0);
    expect(r).toMatchObject({ ok: false, reason: expect.stringContaining("dependem desta") });
  });
});

describe("resumo da roda", () => {
  it("roda vazia: sem revelação nem mods", () => {
    const b = { ...emptyWheel("knight"), gems: { TL: fullGem() } };
    const s = summarizeWheel(b);
    expect(s.domains.every((d) => d.stage === 0)).toBe(true);
    expect(s.domains.find((d) => d.domain === "TL")).toMatchObject({ gemQuality: 3, activeMods: 0, vesselBonus: 0 });
  });

  it("roda cheia: revelação III em todos os domínios e gema com os 3 mods ligados", () => {
    const b = { ...fullWheel(), gems: { TL: fullGem() } };
    const s = summarizeWheel(b);
    for (const d of s.domains) {
      expect(d.points).toBeGreaterThanOrEqual(REVELATION_STAGE_POINTS[2]);
      expect(d.stage).toBe(3);
    }
    const tl = s.domains.find((d) => d.domain === "TL")!;
    expect(tl.activeMods).toBe(Math.min(3, tl.vessels));
    if (tl.vessels === 3) expect(tl.vesselBonus).toBe(VESSEL_MATCH_BONUS[3]);
    expect(s.conviction.length).toBeGreaterThan(0);
  });
});

describe("gemas", () => {
  it("qualidade e nome pela quantidade de mods", () => {
    expect(gemQuality(null)).toBe(0);
    expect(gemQuality([1, null, null])).toBe(1);
    expect(gemQuality([1, 2, null])).toBe(2);
    expect(gemQuality([1, 2, 3])).toBe(3);
    expect(gemName("knight", null)).toBeNull();
    expect(gemName("knight", [1, null, null])).toBe(`Lesser ${GEM_BASE.knight}`);
    expect(gemName("knight", [1, 2, null])).toBe(GEM_BASE.knight);
    expect(gemName("knight", [1, 2, 3])).toBe(`Greater ${GEM_BASE.knight}`);
  });
});

describe("normalizeWheel (o que vem do banco)", () => {
  it("vocação desconhecida ou sem pontos = sem roda", () => {
    expect(normalizeWheel(null)).toBeNull();
    expect(normalizeWheel({ voc: "mago", points: [] })).toBeNull();
    expect(normalizeWheel({ voc: "knight", points: Array(36).fill(0) })).toBeNull();
  });

  it("fatia sem caminho até o centro perde os pontos", () => {
    const points = Array(36).fill(0);
    points[outside] = 5;
    points[center[0]] = 1;
    const w = normalizeWheel({ voc: "knight", points });
    expect(w?.points[outside]).toBe(0);
    expect(w?.points[center[0]]).toBe(1);
  });

  it("limita level, scrolls e pontos por fatia", () => {
    const points = Array(36).fill(0);
    points[center[0]] = 99_999;
    const w = normalizeWheel({ voc: "knight", points, level: 99_999, scrolls: 999, extra: -5 })!;
    expect(w.points[center[0]]).toBe(WHEEL_SLICES[center[0]].max);
    expect(w.level).toBe(5000);
    expect(w.scrolls).toBe(31);
    expect(w.extra).toBe(0);
  });

  it("gema: 2º mod igual ao 1º cai, e sem 2º mod não há supremo", () => {
    const [m1, , sup] = fullGem();
    const w = normalizeWheel({ voc: "knight", points: Array(36).fill(0), gems: { TL: [m1, m1, sup] } })!;
    expect(w.gems.TL).toEqual([m1, null, null]);
    expect(isEmptyWheel(w)).toBe(false);
  });
});
