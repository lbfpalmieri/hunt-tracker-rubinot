import { describe, expect, it } from "vitest";
import {
  fixBalanceSign,
  parseDamage,
  parseHunting,
  parseMiscellaneous,
  parseSessionStamp,
  resolveDurationSec,
  withDuration,
} from "../parser";
import { HUNT_TEXT, INPUT_TEXT, MISC_TEXT } from "./fixtures";

describe("parseHunting", () => {
  it("lê o Hunting Analyser real do RubinOT", () => {
    const h = parseHunting(HUNT_TEXT);
    expect(h.startedAt).toBe("2026-09-28, 13:16:35");
    expect(h.endedAt).toBe("2026-09-28, 14:20:35");
    expect(h.durationSec).toBe(64 * 60);
    expect(h.rawXp).toBe(10_640_217);
    expect(h.xpGain).toBe(65_235_290);
    expect(h.xpPerHour).toBe(61_158_084);
    expect(h.rawXpPerHour).toBe(9_975_203);
    expect(h.loot).toBe(2_665_021);
    expect(h.supplies).toBe(12_886);
    expect(h.balance).toBe(2_652_135);
    expect(h.damage).toBe(9_210_557);
    expect(h.healing).toBe(2_956_525);
  });

  it("lê criaturas e itens com a quantidade", () => {
    const h = parseHunting(HUNT_TEXT);
    expect(h.kills).toHaveLength(8);
    expect(h.kills[0]).toEqual({ count: 571, name: "Orclops Bloodbreaker" });
    expect(h.kills.reduce((a, k) => a + k.count, 0)).toBe(1809);
    expect(h.lootedItems).toHaveLength(4);
    expect(h.lootedItems[0]).toEqual({ count: 17166, name: "platinum coin" });
  });

  it("não confunde Raw XP com XP (nem os /h)", () => {
    const h = parseHunting(HUNT_TEXT);
    expect(h.rawXp).not.toBe(h.xpGain);
    expect(h.rawXpPerHour).not.toBe(h.xpPerHour);
  });

  it("aceita ponto como separador de milhar e quebra de linha do Windows", () => {
    const text = HUNT_TEXT.replace(/,(\d{3})/g, ".$1").replace(/\n/g, "\r\n");
    const h = parseHunting(text);
    expect(h.rawXp).toBe(10_640_217);
    expect(h.balance).toBe(2_652_135);
    expect(h.durationSec).toBe(64 * 60);
    expect(h.kills).toHaveLength(8);
  });

  it("mantém XP e Balance negativos (morte / prejuízo)", () => {
    const text = HUNT_TEXT.replace("Raw XP Gain: 10,640,217", "Raw XP Gain: -1,234,567")
      .replace("XP Gain: 65,235,290", "XP Gain: -2,000,000")
      .replace("Balance: 2,652,135", "Balance: -272,478");
    const h = parseHunting(text);
    expect(h.rawXp).toBe(-1_234_567);
    expect(h.xpGain).toBe(-2_000_000);
    expect(h.balance).toBe(-272_478);
  });

  it("sem a linha Session, usa o intervalo From/to como duração", () => {
    const h = parseHunting(HUNT_TEXT.replace("Session: 01:04h\n", ""));
    expect(h.durationSec).toBe(64 * 60);
  });

  it("aceita 'Session length:'", () => {
    const h = parseHunting(HUNT_TEXT.replace("Session: 01:04h", "Session length: 02:30h"));
    expect(h.durationSec).toBe(2 * 3600 + 30 * 60);
  });

  it("texto que não é analyser não quebra: tudo zerado", () => {
    const h = parseHunting("um texto qualquer");
    expect(h.durationSec).toBe(0);
    expect(h.rawXp).toBe(0);
    expect(h.kills).toEqual([]);
    expect(h.startedAt).toBeNull();
  });
});

describe("duração", () => {
  it("parseSessionStamp lê a data do analyser em hora local", () => {
    const a = parseSessionStamp("2026-09-28, 13:16:35");
    const b = parseSessionStamp("2026-09-28, 14:20:35");
    expect(a).not.toBeNull();
    expect((b as number) - (a as number)).toBe(64 * 60 * 1000);
    expect(parseSessionStamp("nada")).toBeNull();
    expect(parseSessionStamp(null)).toBeNull();
  });

  it("resolveDurationSec: duração direta > intervalo > Miscellaneous", () => {
    const range = { startedAt: "2026-09-28, 13:00:00", endedAt: "2026-09-28, 13:45:00" };
    expect(resolveDurationSec({ durationSec: 1800, ...range })).toBe(1800);
    expect(resolveDurationSec({ durationSec: 0, ...range })).toBe(45 * 60);
    expect(resolveDurationSec({ durationSec: 0 }, 900)).toBe(900);
    expect(resolveDurationSec({ durationSec: 0 })).toBe(0);
  });
});

describe("withDuration (Corrigir tempo)", () => {
  const h = parseHunting(HUNT_TEXT);

  it("mantém os totais e recalcula todo /h pela duração nova", () => {
    const fixed = withDuration(h, 50 * 60);
    expect(fixed.durationSec).toBe(3000);
    expect(fixed.rawXp).toBe(h.rawXp);
    expect(fixed.xpGain).toBe(h.xpGain);
    expect(fixed.loot).toBe(h.loot);
    expect(fixed.balance).toBe(h.balance);
    expect(fixed.kills).toEqual(h.kills);
    expect(fixed.rawXpPerHour).toBe(Math.round(h.rawXp / (3000 / 3600)));
    expect(fixed.xpPerHour).toBe(Math.round(h.xpGain / (3000 / 3600)));
    expect(fixed.damagePerHour).toBe(Math.round(h.damage / (3000 / 3600)));
    expect(fixed.healingPerHour).toBe(Math.round(h.healing / (3000 / 3600)));
  });

  it("ajusta o fim da sessão a partir do início", () => {
    expect(withDuration(h, 50 * 60).endedAt).toBe("2026-09-28, 14:06:35");
    expect(withDuration(h, 50 * 60).startedAt).toBe(h.startedAt);
  });

  it("nunca deixa menos de 1 minuto", () => {
    expect(withDuration(h, 5).durationSec).toBe(60);
  });
});

describe("fixBalanceSign", () => {
  it("corrige balance salvo positivo quando loot − supplies é negativo", () => {
    expect(fixBalanceSign({ loot: 100, supplies: 500, balance: 400 }).balance).toBe(-400);
  });

  it("não mexe em balance coerente", () => {
    expect(fixBalanceSign({ loot: 500, supplies: 100, balance: 400 }).balance).toBe(400);
    expect(fixBalanceSign({ loot: 100, supplies: 500, balance: -400 }).balance).toBe(-400);
    // Sessão de grupo: balance é a parte da divisão, não loot − supplies.
    expect(fixBalanceSign({ loot: 100, supplies: 500, balance: 90_000 }).balance).toBe(90_000);
  });
});

describe("parseDamage (Input Analyser)", () => {
  it("lê total, max DPS, tipos e fontes sem misturar as duas listas", () => {
    const d = parseDamage(INPUT_TEXT);
    expect(d.totalReceived).toBe(1_234_567);
    expect(d.maxDps).toBe(2_345);
    expect(d.damageTypes).toEqual([
      { type: "Physical", value: 800_000, pct: 64.8 },
      { type: "Fire", value: 434_567, pct: 35.2 },
    ]);
    expect(d.damageSources).toEqual([
      { source: "Gloom Maw", value: 700_000, pct: 56.7 },
      { source: "Varg", value: 534_567, pct: 43.3 },
    ]);
  });
});

describe("parseMiscellaneous", () => {
  it("lê as três seções, sufixos k/m e ignora 'No data yet'", () => {
    const m = parseMiscellaneous(MISC_TEXT);
    expect(m.sessionSec).toBe(3600 + 4 * 60 + 10);
    expect(m.charm).toEqual({ "Low Blow": 1234 });
    expect(m.imbuement).toEqual({ Vampirism: 2500 });
    expect(m.itemUpgrade).toEqual({});
  });
});
