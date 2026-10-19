import { describe, expect, it } from "vitest";
import {
  bestDropValue,
  bossLinkedLoot,
  cleanBossName,
  estimatedParty,
  fmtCooldown,
  itemValue,
  lootHighlights,
  normName,
  tierItems,
  type Boss,
  type BossCatalog,
  type CatalogItem,
} from "../boss-catalog";
import {
  fmtWait,
  lastKills,
  lastPrices,
  msUntilAvailable,
  rotationWait,
  runStats,
  type BossRotationRun,
} from "../boss-rotations";

// Rotação de Bosses: lucro só com itens que caem APENAS de boss, sem lucro/h (boss tem cooldown).
const H = 3_600_000;

function run(p: Partial<BossRotationRun>): BossRotationRun {
  return {
    id: "r",
    rotationId: "rot",
    characterId: "c1",
    ranAt: "2026-10-10T12:00:00Z",
    durationSec: 600,
    loot: 0,
    supplies: 0,
    balance: 0,
    xp: 0,
    partySize: 1,
    bossesKilled: [],
    drops: [],
    notes: null,
    setup: null,
    ...p,
  };
}

function boss(p: Partial<Boss>): Boss {
  return {
    name: "Boss",
    hp: 100_000,
    xp: 0,
    type: "",
    cooldownSec: 72_000,
    locations: [],
    mods: {},
    loot: { c: [], u: [], s: [], r: [], v: [] },
    ...p,
  };
}

const item = (name: string, p: Partial<CatalogItem> = {}): CatalogItem => ({
  name,
  npc: 0,
  marketMin: 0,
  marketMax: 0,
  bossOnly: true,
  ...p,
});

function catalog(items: CatalogItem[], bosses: Boss[] = []): BossCatalog {
  return { syncedAt: "", bosses, items: new Map(items.map((i) => [i.name, i])) };
}

describe("execuções da rotação", () => {
  it("runStats sem execuções", () => {
    expect(runStats([])).toEqual({
      runs: 0,
      totalBalance: 0,
      avgBalance: 0,
      perBoss: 0,
      avgDurationSec: 0,
      best: null,
    });
  });

  it("runStats: média, lucro por boss morto e melhor execução", () => {
    const a = run({ id: "a", balance: 100_000, durationSec: 600, bossesKilled: ["X", "Y"] });
    const b = run({ id: "b", balance: 300_000, durationSec: 1200, bossesKilled: ["X"] });
    const s = runStats([a, b]);
    expect(s.totalBalance).toBe(400_000);
    expect(s.avgBalance).toBe(200_000);
    expect(s.perBoss).toBeCloseTo(400_000 / 3);
    expect(s.avgDurationSec).toBe(900);
    expect(s.best?.id).toBe("b");
  });

  it("lastKills: última morte de cada boss, só do personagem pedido", () => {
    const runs = [
      run({ ranAt: "2026-10-01T10:00:00Z", bossesKilled: ["X", "Y"] }),
      run({ ranAt: "2026-10-05T10:00:00Z", bossesKilled: ["X"] }),
      run({ ranAt: "2026-10-09T10:00:00Z", bossesKilled: ["Y"], characterId: "outro" }),
    ];
    const mine = lastKills(runs, "c1");
    expect(mine.get("X")).toBe("2026-10-05T10:00:00Z");
    expect(mine.get("Y")).toBe("2026-10-01T10:00:00Z");
    expect(lastKills(runs, null).get("Y")).toBe("2026-10-09T10:00:00Z");
  });

  it("msUntilAvailable: nunca morto = disponível; cooldown desconhecido = null", () => {
    const now = Date.parse("2026-10-10T12:00:00Z");
    expect(msUntilAvailable(undefined, 72_000, now)).toBe(0);
    expect(msUntilAvailable("2026-10-10T10:00:00Z", 0, now)).toBeNull();
    expect(msUntilAvailable("2026-10-10T10:00:00Z", 20 * 3600, now)).toBe(18 * H);
    expect(msUntilAvailable("2026-10-01T10:00:00Z", 20 * 3600, now)).toBe(0);
  });

  it("rotationWait = o boss que mais demora; ignora cooldown desconhecido", () => {
    const now = Date.parse("2026-10-10T12:00:00Z");
    const kills = new Map([
      ["X", "2026-10-10T10:00:00Z"],
      ["Y", "2026-10-10T11:00:00Z"],
    ]);
    const bosses = [
      { name: "X", cooldownSec: 4 * 3600 },
      { name: "Y", cooldownSec: 2 * 3600 },
      { name: "Z", cooldownSec: 0 },
    ];
    expect(rotationWait(bosses, kills, now)).toBe(2 * H);
    expect(rotationWait([], kills, now)).toBeNull();
  });

  it("fmtWait", () => {
    expect(fmtWait(30 * 60_000)).toBe("30min");
    expect(fmtWait(90 * 60_000)).toBe("1h30");
    expect(fmtWait(60_001)).toBe("2min");
    expect(fmtWait(49 * H)).toBe("2 dias");
  });

  it("lastPrices: o preço da execução mais recente vale", () => {
    const runs = [
      run({ ranAt: "2026-10-05T00:00:00Z", drops: [{ name: "Gold Token", count: 1, unitValue: 90_000 }] }),
      run({ ranAt: "2026-10-01T00:00:00Z", drops: [{ name: "Gold Token", count: 1, unitValue: 50_000 }] }),
      run({ ranAt: "2026-10-09T00:00:00Z", drops: [{ name: "Gold Token", count: 1 }] }),
    ];
    expect(lastPrices(runs).get("Gold Token")).toBe(90_000);
  });
});

describe("catálogo de bosses", () => {
  it("cleanBossName limpa template da wiki", () => {
    expect(cleanBossName("{{#ifeq:{{PAGENAME}}|Home|Tentugly|Tentugly's Head}}")).toBe("Tentugly's Head");
    expect(cleanBossName("{{Algo}}", "Título")).toBe("Título");
    expect(cleanBossName("  Ferumbras ")).toBe("Ferumbras");
    expect(cleanBossName("", "Página")).toBe("Página");
  });

  it("itemValue: meio do mercado, senão NPC", () => {
    expect(itemValue(undefined)).toBe(0);
    expect(itemValue(item("a", { marketMin: 100, marketMax: 201, npc: 5 }))).toBe(151);
    expect(itemValue(item("a", { npc: 500 }))).toBe(500);
  });

  it("estimatedParty: até 150k de vida = solo", () => {
    expect(estimatedParty(boss({ hp: 150_000 }))).toBe("solo");
    expect(estimatedParty(boss({ hp: 150_001 }))).toBe("team");
    expect(estimatedParty(boss({ hp: 0 }))).toBe("team");
  });

  it("normName e fmtCooldown", () => {
    expect(normName(" A Falcon  Plate ")).toBe("falcon plate");
    expect(normName("the Gold Token")).toBe("gold token");
    expect(fmtCooldown(0)).toBe("—");
    expect(fmtCooldown(1800)).toBe("30min");
    expect(fmtCooldown(72_000)).toBe("20h");
    expect(fmtCooldown(172_800)).toBe("2 dias");
  });

  it("lootHighlights junta o item de vários bosses, fica com a raridade maior e ignora moedas", () => {
    const a = boss({ name: "A", loot: { c: ["gold coin", "Gem"], u: [], s: [], r: ["Crown"], v: [] } });
    const b = boss({ name: "B", loot: { c: [], u: [], s: [], r: [], v: ["Gem"] } });
    const cat = catalog([
      item("Gem", { npc: 50_000 }),
      item("Crown", { npc: 5_000 }),
    ]);
    const h = lootHighlights([a, b], cat);
    expect(h.rare.map((x) => [x.item, x.tier, x.bosses])).toEqual([
      ["Gem", "v", ["A", "B"]],
      ["Crown", "r", ["A"]],
    ]);
    expect(h.valuable).toEqual([]);
  });

  it("tierItems e bestDropValue ordenam por valor", () => {
    const b = boss({ loot: { c: ["Barato", "Caro"], u: [], s: [], r: ["Raro"], v: [] } });
    const cat = catalog([item("Barato", { npc: 10 }), item("Caro", { npc: 900 }), item("Raro", { npc: 700 })]);
    expect(tierItems(b, "c", cat).map((x) => x.item)).toEqual(["Caro", "Barato"]);
    expect(bestDropValue(b, cat)).toBe(700);
  });

  it("bossLinkedLoot: só itens que caem apenas de boss contam no lucro da rotação", () => {
    const b = boss({ loot: { c: ["Demon Horn", "Gold Token", "Old Item"], u: [], s: [], r: [], v: [] } });
    const cat = catalog([
      item("Gold Token"),
      item("Demon Horn", { bossOnly: false }),
      item("Old Item", { bossOnly: null }),
      item("Other Item", { bossOnly: null }),
    ]);
    const lines = bossLinkedLoot(
      [
        { name: "gold tokens", count: 3 },
        { name: "a gold token", count: 1 },
        { name: "demon horn", count: 2 },
        { name: "platinum coins", count: 100 },
        { name: "old item", count: 1 },
        { name: "other item", count: 1 },
        { name: "unknown thing", count: 1 },
      ],
      [b],
      cat,
    );
    expect(lines.map((l) => [l.name, l.count])).toEqual([
      ["Gold Token", 4],
      ["Old Item", 1],
    ]);
  });
});
