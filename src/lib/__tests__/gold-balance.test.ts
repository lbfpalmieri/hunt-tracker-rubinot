import { describe, expect, it } from "vitest";
import {
  adjustmentToReach,
  goalProgress,
  netGoldBalance,
  parseGold,
  sumAdjustments,
  type GoldAdjustment,
} from "../gold-balance";
import { makeSession } from "./fixtures";

const adj = (amount: number, characterId = "char-1"): GoldAdjustment => ({
  id: String(amount),
  characterId,
  description: "Ajuste",
  amount,
  createdAt: "2026-10-01T00:00:00Z",
});

describe("saldo de gold com ajustes", () => {
  it("saldo atual = hunts − imbuements − gastos + ajustes", () => {
    const adjustments = sumAdjustments([adj(5_000_000), adj(-1_000_000), adj(999, "outro")], "char-1");
    expect(adjustments).toBe(4_000_000);
    expect(
      netGoldBalance({ sessionsBalance: 10_000_000, imbuementsSpent: 500_000, expensesSpent: 1_500_000, adjustments }),
    ).toBe(12_000_000);
  });

  it("Atualizar saldo grava a diferença (pra cima ou pra baixo)", () => {
    expect(adjustmentToReach(20_000_000, 12_000_000)).toBe(8_000_000);
    expect(adjustmentToReach(10_000_000, 12_000_000)).toBe(-2_000_000);
    expect(adjustmentToReach(12_000_000, 12_000_000)).toBe(0);
  });

  it("parseGold aceita pontuação de milhar e k/kk", () => {
    expect(parseGold("1.500.000")).toBe(1_500_000);
    expect(parseGold("1,500,000")).toBe(1_500_000);
    expect(parseGold("1500k")).toBe(1_500_000);
    expect(parseGold("1.5kk")).toBe(1_500_000);
    expect(parseGold("2,5kk")).toBe(2_500_000);
    expect(parseGold("0")).toBe(0);
    expect(parseGold("")).toBeNull();
    expect(parseGold("abc")).toBeNull();
    expect(parseGold("-5")).toBeNull();
  });
});

describe("goalProgress — objetivo principal", () => {
  const sessions = [
    makeSession({ createdAt: "2026-10-01T00:00:00Z", hunting: { balance: 3_000_000 } }),
    makeSession({ createdAt: "2026-10-05T00:00:00Z", hunting: { balance: 1_000_000 } }),
  ];
  const goal = { characterId: "char-1", createdAt: "2026-10-03T00:00:00Z", isMain: false };

  it("objetivo comum: só as hunts depois de criado", () => {
    expect(goalProgress(goal, { sessions, netBalance: 25_000_000 })).toBe(1_000_000);
  });

  it("principal: o saldo atual inteiro (gold de antes e ajustes contam)", () => {
    expect(goalProgress({ ...goal, isMain: true }, { sessions, netBalance: 25_000_000 })).toBe(25_000_000);
  });

  it("nunca negativo", () => {
    expect(goalProgress({ ...goal, isMain: true }, { sessions, netBalance: -5 })).toBe(0);
  });
});
