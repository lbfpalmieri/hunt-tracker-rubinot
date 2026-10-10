import { describe, expect, it } from "vitest";
import { huntRawXp, parseXpAmount, type BountyInfo } from "../bounty";
import {
  aggregateByHunt,
  filterByBonusInclusion,
  fromOwnSession,
  isHuntValid,
  perHour,
  topKills,
} from "../compare";
import { detectDeathLoss, totalXpLost } from "../deaths";
import { IMB_TIER_COST, aggregateImbuements, computeImbuement } from "../imbuements";
import { currentLevel, levelGainInRange } from "../level";
import { aggregateSessions, balanceSince } from "../performance";
import { preyPctForStars, preyStarsForPct } from "../prey";
import type { Imbuement } from "../store";
import { makeSession } from "./fixtures";

const bounty = (xp: number | null): BountyInfo => ({ difficulty: "adept", tier: "normal", xp });
const HOUR = 3600;

describe("huntRawXp — Raw XP da hunt", () => {
  it("sessão normal: a Raw XP do analyser", () => {
    expect(huntRawXp(makeSession({ hunting: { rawXp: 1000, xpGain: 1500 } }))).toBe(1000);
  });

  it("sem Raw XP cai na XP com bônus", () => {
    expect(huntRawXp(makeSession({ hunting: { rawXp: 0, xpGain: 1500 } }))).toBe(1500);
  });

  it("desconta a XP da Bounty Task, sem ficar negativo", () => {
    expect(huntRawXp(makeSession({ hunting: { rawXp: 1000 }, bounty: bounty(300) }))).toBe(700);
    expect(huntRawXp(makeSession({ hunting: { rawXp: 1000 }, bounty: bounty(5000) }))).toBe(0);
  });

  it("bounty sem valor informado e grupo sem Hunting Analyser = desconhecida (null)", () => {
    expect(huntRawXp(makeSession({ bounty: bounty(null) }))).toBeNull();
    expect(
      huntRawXp(
        makeSession({
          party: { size: 2, members: null, self: null, personal: null, noHuntingAnalyser: true },
        }),
      ),
    ).toBeNull();
  });
});

describe("parseXpAmount", () => {
  it("aceita os jeitos que o jogador escreve", () => {
    expect(parseXpAmount("8000000")).toBe(8_000_000);
    expect(parseXpAmount("8kk")).toBe(8_000_000);
    expect(parseXpAmount("8m")).toBe(8_000_000);
    expect(parseXpAmount("8.5kk")).toBe(8_500_000);
    expect(parseXpAmount("8,5kk")).toBe(8_500_000);
    expect(parseXpAmount("8.000.000")).toBe(8_000_000);
    expect(parseXpAmount("500k")).toBe(500_000);
  });

  it("vazio ou inválido = null", () => {
    expect(parseXpAmount("")).toBeNull();
    expect(parseXpAmount("abc")).toBeNull();
  });
});

describe("detectDeathLoss", () => {
  it("XP negativa em qualquer um dos dois campos = morte, com a maior perda", () => {
    expect(detectDeathLoss({ rawXp: 100, xpGain: -500 })).toBe(500);
    expect(detectDeathLoss({ rawXp: -900, xpGain: -500 })).toBe(900);
  });

  it("XP positiva ou zero não é morte", () => {
    expect(detectDeathLoss({ rawXp: 100, xpGain: 200 })).toBeNull();
    expect(detectDeathLoss({ rawXp: 0, xpGain: 0 })).toBeNull();
  });

  it("totalXpLost soma só as mortes do personagem", () => {
    const death = (characterId: string, xpLost: number) =>
      ({ id: `${characterId}-${xpLost}`, characterId, xpLost }) as Parameters<typeof totalXpLost>[0][number];
    expect(totalXpLost([death("a", 100), death("a", 50), death("b", 999)], "a")).toBe(150);
  });
});

describe("aggregateSessions — números do Dashboard", () => {
  it("lista vazia zera tudo", () => {
    const agg = aggregateSessions([]);
    expect(agg).toMatchObject({ rawXph: 0, gph: 0, balance: 0, sessionCount: 0, bestHunt: null });
  });

  it("lucro/h = balance total ÷ horas totais; Raw XP/h = Raw XP ÷ horas", () => {
    const agg = aggregateSessions([
      makeSession({ hunting: { durationSec: HOUR, rawXp: 1_000_000, balance: 400_000 } }),
      makeSession({ hunting: { durationSec: 3 * HOUR, rawXp: 5_000_000, balance: 800_000 } }),
    ]);
    expect(agg.totalTime).toBe(4 * HOUR);
    expect(agg.balance).toBe(1_200_000);
    expect(agg.gph).toBe(300_000);
    expect(agg.totalRawXp).toBe(6_000_000);
    expect(agg.rawXph).toBe(1_500_000);
    expect(agg.sessionCount).toBe(2);
  });

  it("sessão sem XP conhecida fica fora do Raw XP/h (valor e tempo), mas conta no lucro", () => {
    const agg = aggregateSessions([
      makeSession({ hunting: { durationSec: HOUR, rawXp: 10_000_000, balance: 100_000 } }),
      makeSession({ hunting: { durationSec: 3 * HOUR, rawXp: 99, balance: 300_000 }, bounty: bounty(null) }),
    ]);
    expect(agg.excludedBounty).toBe(1);
    expect(agg.xpTime).toBe(HOUR);
    expect(agg.rawXph).toBe(10_000_000);
    expect(agg.gph).toBe(100_000);
  });

  it("top spot: melhor lucro/h, juntando nomes com maiúscula/espaço diferente", () => {
    const agg = aggregateSessions([
      makeSession({ huntName: "Asura", hunting: { durationSec: HOUR, balance: 100_000 } }),
      makeSession({ huntName: "asura ", hunting: { durationSec: HOUR, balance: 300_000 } }),
      makeSession({ huntName: "Roshamuul", hunting: { durationSec: HOUR, balance: 150_000 } }),
    ]);
    expect(agg.bestHunt).toEqual({ name: "Asura", gph: 200_000 });
  });

  it("top spot ignora hunt com menos de 30 min somados", () => {
    const agg = aggregateSessions([
      makeSession({ huntName: "Curta", hunting: { durationSec: 10 * 60, balance: 5_000_000 } }),
      makeSession({ huntName: "Longa", hunting: { durationSec: HOUR, balance: 100_000 } }),
    ]);
    expect(agg.bestHunt?.name).toBe("Longa");
  });

  it("balanceSince soma só o personagem e a partir da data", () => {
    const sessions = [
      makeSession({ createdAt: "2026-10-01T00:00:00Z", hunting: { balance: 100 } }),
      makeSession({ createdAt: "2026-10-05T00:00:00Z", hunting: { balance: 200 } }),
      makeSession({ createdAt: "2026-10-06T00:00:00Z", hunting: { balance: 999 }, characterId: "outro" }),
    ];
    expect(balanceSince(sessions, "char-1", "2026-10-03T00:00:00Z")).toBe(200);
  });
});

describe("aggregateByHunt — média da hunt", () => {
  const own = (over: Parameters<typeof makeSession>[0]) => fromOwnSession(makeSession(over), "Char", "Knight");

  it("perHour: total ÷ duração da própria sessão", () => {
    expect(perHour(1_000_000, 2 * HOUR)).toBe(500_000);
    expect(perHour(null, HOUR)).toBeNull();
  });

  it("fromOwnSession soma as kills e usa a Raw XP sem a bounty", () => {
    const h = own({
      hunting: { rawXp: 1000, kills: [{ name: "Rat", count: 3 }, { name: "Bug", count: 2 }] },
      bounty: bounty(400),
    });
    expect(h.killsTotal).toBe(5);
    expect(h.rawXpHunt).toBe(600);
    expect(h.rawXpTotal).toBe(1000);
  });

  it("uma sessão só: a hunt é a própria sessão", () => {
    const [h] = aggregateByHunt([own({ hunting: { durationSec: HOUR, balance: 123 } })]);
    expect(h.sessionCount).toBe(1);
    expect(h.balance).toBe(123);
    expect(h.totalDurationSec).toBe(HOUR);
  });

  it("junta por nome (sem diferenciar maiúscula) e tira a média", () => {
    const out = aggregateByHunt([
      own({ huntName: "Asura", hunting: { durationSec: HOUR, balance: 100, loot: 300, kills: [{ name: "Rat", count: 10 }] } }),
      own({ huntName: "asura", hunting: { durationSec: 3 * HOUR, balance: 300, loot: 500, kills: [{ name: "Rat", count: 30 }] } }),
      own({ huntName: "Outra", hunting: { balance: 1 } }),
    ]);
    expect(out).toHaveLength(2);
    const asura = out.find((h) => h.huntName === "Asura")!;
    expect(asura.sessionCount).toBe(2);
    expect(asura.durationSec).toBe(2 * HOUR);
    expect(asura.totalDurationSec).toBe(4 * HOUR);
    expect(asura.balance).toBe(200);
    expect(asura.loot).toBe(400);
    expect(asura.kills).toEqual([{ name: "Rat", count: 20 }]);
  });

  it("Raw XP/h da hunt usa só o tempo das sessões que têm XP", () => {
    // 1h com 10M + 3h sem XP conhecida → 10M/h (e não 5M/h diluído)
    const [h] = aggregateByHunt([
      own({ hunting: { durationSec: HOUR, rawXp: 10_000_000 } }),
      own({ hunting: { durationSec: 3 * HOUR, rawXp: 77 }, bounty: bounty(null) }),
    ]);
    expect(perHour(h.rawXpHunt, h.durationSec)).toBeCloseTo(10_000_000);
  });

  it("nenhuma sessão com XP conhecida → Raw XP da hunt desconhecida", () => {
    const [h] = aggregateByHunt([own({ bounty: bounty(null) }), own({ bounty: bounty(null) })]);
    expect(h.rawXpHunt).toBeNull();
  });

  it("isHuntValid exige 30 min somados; topKills ordena", () => {
    const [curta] = aggregateByHunt([own({ hunting: { durationSec: 10 * 60 } })]);
    const [ok] = aggregateByHunt([
      own({ hunting: { durationSec: 20 * 60, kills: [{ name: "A", count: 1 }, { name: "B", count: 9 }] } }),
      own({ hunting: { durationSec: 20 * 60 } }),
    ]);
    expect(isHuntValid(curta)).toBe(false);
    expect(isHuntValid(ok)).toBe(true);
    expect(topKills(ok, 1)).toEqual([{ name: "B", count: 4.5 }]);
  });

  it("filterByBonusInclusion tira sessões com bounty/prey quando pedido", () => {
    const list = [own({}), own({ bounty: bounty(1) }), own({ prey: [{ creature: "Rat", bonus: "xp", pct: 40 }] as never })];
    expect(filterByBonusInclusion(list, true, true)).toHaveLength(3);
    expect(filterByBonusInclusion(list, false, true)).toHaveLength(2);
    expect(filterByBonusInclusion(list, false, false)).toHaveLength(1);
  });
});

describe("imbuements — custo amortizado em 20h", () => {
  const imb = (over: Partial<Imbuement> = {}): Imbuement => ({
    id: "i1",
    characterId: "char-1",
    tier: "powerful",
    goldTokenCost: 0,
    label: "Vampirism",
    gearSlot: "armor",
    hoursRemaining: 20,
    createdAt: "2026-10-01T00:00:00Z",
    ...over,
  });
  const session = (createdAt: string, hours: number) =>
    makeSession({ createdAt, hunting: { durationSec: hours * HOUR } });

  it("consome as horas das sessões posteriores", () => {
    const r = computeImbuement(imb(), [
      session("2026-09-30T00:00:00Z", 5), // antes: não conta
      session("2026-10-02T00:00:00Z", 2),
    ]);
    expect(r.totalCost).toBe(IMB_TIER_COST.powerful);
    expect(r.costPerHour).toBe(12_500);
    expect(r.hoursConsumed).toBe(2);
    expect(r.hoursRemaining).toBe(18);
    expect(r.amountSpent).toBe(25_000);
    expect(r.active).toBe(true);
  });

  it("não passa das horas que restavam e desliga ao acabar", () => {
    const r = computeImbuement(imb({ hoursRemaining: 3 }), [session("2026-10-02T00:00:00Z", 10)]);
    expect(r.hoursConsumed).toBe(3);
    expect(r.hoursRemaining).toBe(0);
    expect(r.active).toBe(false);
  });

  it("soma o custo de gold token", () => {
    expect(computeImbuement(imb({ goldTokenCost: 50_000 }), []).totalCost).toBe(300_000);
  });

  it("mesmo tipo no mesmo item = renovação (o antigo para de contar); tipos diferentes coexistem", () => {
    const sessions = [session("2026-10-02T00:00:00Z", 2), session("2026-10-04T00:00:00Z", 4)];
    const agg = aggregateImbuements(
      [
        imb({ id: "velho" }),
        imb({ id: "novo", createdAt: "2026-10-03T00:00:00Z" }),
        imb({ id: "outro-tipo", label: "Void" }),
        imb({ id: "outro-char", characterId: "x" }),
      ],
      sessions,
      "char-1",
    );
    const row = (id: string) => agg.rows.find((r) => r.imb.id === id)!;
    expect(agg.rows).toHaveLength(3);
    expect(row("velho")).toMatchObject({ hoursConsumed: 2, active: false });
    expect(row("novo")).toMatchObject({ hoursConsumed: 4, active: true });
    expect(row("outro-tipo")).toMatchObject({ hoursConsumed: 6, active: true });
    expect(agg.activeCostPerHour).toBe(25_000);
    expect(agg.totalSpent).toBe(12_500 * 12);
  });
});

describe("level", () => {
  const snap = (level: number, createdAt: string, characterId = "char-1") => ({
    id: `${characterId}-${level}`,
    characterId,
    level,
    createdAt,
  });
  const snaps = [
    snap(300, "2026-10-01T00:00:00Z"),
    snap(310, "2026-10-05T00:00:00Z"),
    snap(305, "2026-10-03T00:00:00Z"),
    snap(900, "2026-10-09T00:00:00Z", "outro"),
  ];

  it("level atual = registro mais recente por data, do personagem", () => {
    expect(currentLevel(snaps, "char-1")).toBe(310);
    expect(currentLevel(snaps, "ninguem")).toBeNull();
  });

  it("ganho no período parte do último registro antes dele", () => {
    const gain = levelGainInRange(snaps, "char-1", {
      start: new Date("2026-10-02T00:00:00Z"),
      end: new Date("2026-10-06T00:00:00Z"),
    });
    expect(gain).toMatchObject({ from: 300, to: 310, gained: 10, fromBeforeRange: true });
  });

  it("um registro só não dá pra comparar", () => {
    expect(levelGainInRange([snap(300, "2026-10-01T00:00:00Z")], "char-1", { start: null, end: null })).toBeNull();
  });
});

describe("prey — % por estrelas", () => {
  it("faixas do jogo: Dano 7–25, Redução 12–30, XP/Loot 13–40", () => {
    expect([preyPctForStars("damage", 1), preyPctForStars("damage", 10)]).toEqual([7, 25]);
    expect([preyPctForStars("defense", 1), preyPctForStars("defense", 10)]).toEqual([12, 30]);
    expect([preyPctForStars("xp", 1), preyPctForStars("xp", 10)]).toEqual([13, 40]);
    expect([preyPctForStars("loot", 1), preyPctForStars("loot", 10)]).toEqual([13, 40]);
  });

  it("limita a 1–10 estrelas e converte % de volta em estrelas", () => {
    expect(preyPctForStars("xp", 0)).toBe(13);
    expect(preyPctForStars("xp", 99)).toBe(40);
    for (let stars = 1; stars <= 10; stars++) {
      expect(preyStarsForPct("damage", preyPctForStars("damage", stars))).toBe(stars);
    }
    expect(preyStarsForPct("xp", null)).toBe(10);
  });
});
