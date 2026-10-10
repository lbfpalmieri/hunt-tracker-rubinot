import { describe, expect, it } from "vitest";
import { exportHuntAverageAnalyser, exportSessionAnalyser } from "../analyser-export";
import { detectBlockKind } from "../block-detect";
import { fmtDuration, fmtGold, fmtHoursMin, fmtNum } from "../format";
import {
  groupMonstersByHunt,
  looksGenericHuntName,
  matchHuntsByMonsters,
  normalizeHuntKey,
} from "../hunt-suggest";
import { parseHunting } from "../parser";
import { fmtIsoDate, parseGoldInput, rcNeeded } from "../rc-calc";
import { HUNT_TEXT, makeSession } from "./fixtures";

describe("Exportar Analyser", () => {
  const original = parseHunting(HUNT_TEXT);
  const session = makeSession({ hunting: original });

  it("o texto exportado é reconhecido e relido como Hunting Analyser com os mesmos totais", () => {
    const text = exportSessionAnalyser(session);
    expect(detectBlockKind(text)).toBe("hunting");
    const back = parseHunting(text);
    expect(back.startedAt).toBe(original.startedAt);
    expect(back.endedAt).toBe(original.endedAt);
    expect(back.durationSec).toBe(original.durationSec);
    expect(back.rawXp).toBe(original.rawXp);
    expect(back.xpGain).toBe(original.xpGain);
    expect(back.loot).toBe(original.loot);
    expect(back.supplies).toBe(original.supplies);
    expect(back.balance).toBe(original.balance);
    expect(back.kills).toEqual(original.kills);
    expect(back.lootedItems).toEqual(original.lootedItems);
  });

  it("o /h exportado é total ÷ duração da sessão (não o /h colado do jogo)", () => {
    const back = parseHunting(exportSessionAnalyser(session));
    const hours = original.durationSec / 3600;
    expect(back.rawXpPerHour).toBe(Math.round(original.rawXp / hours));
    expect(back.xpPerHour).toBe(Math.round(original.xpGain / hours));
  });

  it("média da hunt vira 1 hora no ritmo médio", () => {
    const text = exportHuntAverageAnalyser([
      makeSession({
        hunting: { durationSec: 3600, rawXp: 1_000_000, xpGain: 2_000_000, loot: 100, supplies: 20, balance: 80, kills: [{ name: "Rat", count: 100 }] },
      }),
      makeSession({
        hunting: { durationSec: 3 * 3600, rawXp: 5_000_000, xpGain: 6_000_000, loot: 700, supplies: 20, balance: 680, kills: [{ name: "Rat", count: 500 }] },
      }),
    ]);
    const back = parseHunting(text);
    expect(back.durationSec).toBe(3600);
    expect(back.rawXp).toBe(1_500_000);
    expect(back.xpGain).toBe(2_000_000);
    expect(back.loot).toBe(200);
    expect(back.balance).toBe(190);
    expect(back.kills).toEqual([{ name: "Rat", count: 150 }]);
  });

  it("média: sessão de grupo sem XP nem criaturas não dilui XP/h e kills/h", () => {
    const text = exportHuntAverageAnalyser([
      makeSession({ hunting: { durationSec: 3600, rawXp: 1_000_000, xpGain: 1_000_000, kills: [{ name: "Rat", count: 100 }] } }),
      makeSession({ hunting: { durationSec: 3600, rawXp: 0, xpGain: 0, kills: [] } }),
    ]);
    const back = parseHunting(text);
    expect(back.rawXp).toBe(1_000_000);
    expect(back.kills).toEqual([{ name: "Rat", count: 100 }]);
  });
});

describe("sugestão de hunt pelos monstros", () => {
  const groups = groupMonstersByHunt([
    { huntName: "Asura Palace", kills: [{ name: "Dawnfire Asura" }, { name: "Midnight Asura" }] },
    { huntName: "Asura Palace", kills: [{ name: "Dawnfire Asura" }, { name: "Midnight Asura" }] },
    { huntName: "Roshamuul", kills: [{ name: "Guzzlemaw" }, { name: "Frazzlemaw" }] },
  ]);

  it("agrupa as sessões por hunt", () => {
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.huntName === "Asura Palace")?.sessionCount).toBe(2);
  });

  it("a hunt que tem os mesmos monstros vem primeiro (sem diferenciar maiúscula)", () => {
    const matches = matchHuntsByMonsters(["dawnfire asura", "MIDNIGHT ASURA"], groups);
    expect(matches[0].huntName).toBe("Asura Palace");
    expect(matches.some((m) => m.huntName === "Roshamuul")).toBe(false);
  });

  it("sem monstros não sugere nada", () => {
    expect(matchHuntsByMonsters([], groups)).toEqual([]);
  });

  it("nomes genéricos são sinalizados", () => {
    expect(looksGenericHuntName("teste1")).toBe(true);
    expect(looksGenericHuntName("123")).toBe(true);
    expect(looksGenericHuntName("ab")).toBe(true);
    expect(looksGenericHuntName("Darashia - DT Seal -1")).toBe(false);
  });

  it("normalizeHuntKey ignora acento, caixa e espaços extras", () => {
    expect(normalizeHuntKey("Plague  Seal -1")).toBe(normalizeHuntKey("plague seal - 1"));
    expect(normalizeHuntKey("Coração")).toBe(normalizeHuntKey("coracao"));
  });
});

describe("gold e Rubini Coins", () => {
  it("parseGoldInput entende k, kk e separadores de milhar", () => {
    expect(parseGoldInput("100000000")).toBe(100_000_000);
    expect(parseGoldInput("100.000.000")).toBe(100_000_000);
    expect(parseGoldInput("100kk")).toBe(100_000_000);
    expect(parseGoldInput("1,5kk")).toBe(1_500_000);
    expect(parseGoldInput("38k")).toBe(38_000);
    expect(parseGoldInput(" 38 K ")).toBe(38_000);
  });

  it("vazio, zero ou texto = null", () => {
    expect(parseGoldInput("")).toBeNull();
    expect(parseGoldInput("0")).toBeNull();
    expect(parseGoldInput("abc")).toBeNull();
  });

  it("rcNeeded arredonda pra cima", () => {
    expect(rcNeeded(100_000_000, 38_000)).toBe(2632);
    expect(rcNeeded(76_000, 38_000)).toBe(2);
  });

  it("fmtIsoDate", () => {
    expect(fmtIsoDate("2026-10-09")).toBe("09/10/2026");
  });
});

describe("formatação", () => {
  it("fmtGold", () => {
    expect(fmtGold(1_500_000)).toBe("1.50M");
    expect(fmtGold(1_500)).toBe("1.5k");
    expect(fmtGold(999)).toBe("999");
    expect(fmtGold(-2_000_000)).toBe("-2.00M");
  });

  it("fmtDuration e fmtHoursMin", () => {
    expect(fmtDuration(64 * 60)).toBe("1h 04m");
    expect(fmtDuration(0)).toBe("0h 00m");
    expect(fmtHoursMin(1.5)).toBe("1h30");
    expect(fmtHoursMin(0.5)).toBe("30min");
    expect(fmtHoursMin(2)).toBe("2h");
  });

  it("fmtNum usa o formato pt-BR", () => {
    expect(fmtNum(1_234_567.4)).toBe("1.234.567");
  });
});
