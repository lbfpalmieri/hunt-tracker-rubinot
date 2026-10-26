import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  filterByPeriod,
  formatRange,
  parseDateInput,
  periodRange,
  startOfWeek,
} from "../period";
import { filterByLatestPatch, isPrePatch, latestPatch, type BalancePatch } from "../patches";

// Filtro de período (Meu rendimento, Comparar sessões...) e corte do último balanceamento
// (médias e rankings só contam sessões depois do patch). Fuso fixo em vitest.config.ts.
const local = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) =>
  new Date(y, m - 1, d, h, min, s, ms);

describe("periodRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(local(2026, 10, 15, 14, 30)); // quinta-feira
  });
  afterEach(() => vi.useRealTimers());

  it("Tudo = sem limite", () => {
    expect(periodRange("all", "", "")).toEqual({ start: null, end: null });
  });

  it("Hoje e Ontem pegam o dia inteiro", () => {
    expect(periodRange("today", "", "")).toEqual({
      start: local(2026, 10, 15),
      end: local(2026, 10, 15, 23, 59, 59, 999),
    });
    expect(periodRange("yesterday", "", "")).toEqual({
      start: local(2026, 10, 14),
      end: local(2026, 10, 14, 23, 59, 59, 999),
    });
  });

  it("Esta semana vai de segunda a domingo", () => {
    expect(periodRange("week", "", "")).toEqual({
      start: local(2026, 10, 12),
      end: local(2026, 10, 18, 23, 59, 59, 999),
    });
  });

  it("Este mês vai do dia 1 ao último dia", () => {
    expect(periodRange("month", "", "")).toEqual({
      start: local(2026, 10, 1),
      end: local(2026, 10, 31, 23, 59, 59, 999),
    });
  });

  it("Personalizado usa as datas do campo (data inválida = sem limite daquele lado)", () => {
    expect(periodRange("custom", "2026-09-01", "2026-09-05")).toEqual({
      start: local(2026, 9, 1),
      end: local(2026, 9, 5, 23, 59, 59, 999),
    });
    expect(periodRange("custom", "", "lixo")).toEqual({ start: null, end: null });
  });
});

describe("datas", () => {
  it("startOfWeek: domingo pertence à semana que começou na segunda anterior", () => {
    expect(startOfWeek(local(2026, 10, 18, 22))).toEqual(local(2026, 10, 12));
    expect(startOfWeek(local(2026, 10, 12, 8))).toEqual(local(2026, 10, 12));
  });

  it("parseDateInput lê YYYY-MM-DD como data local (não UTC)", () => {
    expect(parseDateInput("2026-10-01")).toEqual(local(2026, 10, 1));
    expect(parseDateInput("01/10/2026")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });

  it("formatRange", () => {
    expect(formatRange(null, null)).toBe("Todo o histórico registrado");
    expect(formatRange(local(2026, 10, 1), null)).toBe("Escolha as duas datas");
    expect(formatRange(local(2026, 10, 1), local(2026, 10, 1, 23))).not.toContain("—");
    expect(formatRange(local(2026, 10, 1), local(2026, 10, 5))).toContain(" — ");
  });

  it("filterByPeriod inclui as pontas do período", () => {
    const items = [
      { at: local(2026, 10, 1, 0, 0).toISOString() },
      { at: local(2026, 10, 3, 12).toISOString() },
      { at: local(2026, 10, 5, 23, 59, 59, 999).toISOString() },
      { at: local(2026, 10, 6).toISOString() },
    ];
    const range = { start: local(2026, 10, 1), end: local(2026, 10, 5, 23, 59, 59, 999) };
    expect(filterByPeriod(items, (i) => i.at, range)).toHaveLength(3);
    expect(filterByPeriod(items, (i) => i.at, { start: null, end: null })).toBe(items);
  });
});

describe("marco de balanceamento (patch)", () => {
  const patch: BalancePatch = {
    id: "x",
    label: "x",
    date: "2026-09-01",
    description: "",
    announcement: "",
  };

  it("sessão antes da meia-noite local do dia do patch é pré-patch", () => {
    expect(isPrePatch(local(2026, 8, 31, 23, 59).toISOString(), patch)).toBe(true);
    expect(isPrePatch(local(2026, 9, 1, 0, 0).toISOString(), patch)).toBe(false);
  });

  it("médias usam só sessões depois do último patch, a menos que a pessoa inclua as antigas", () => {
    expect(latestPatch()).not.toBeNull();
    const items = [{ at: "2020-01-01T12:00:00Z" }, { at: "2099-01-01T12:00:00Z" }];
    expect(filterByLatestPatch(items, (i) => i.at, false)).toEqual([items[1]]);
    expect(filterByLatestPatch(items, (i) => i.at, true)).toEqual(items);
  });
});
