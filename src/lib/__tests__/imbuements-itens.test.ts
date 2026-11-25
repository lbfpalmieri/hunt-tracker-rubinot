import { describe, expect, it } from "vitest";
import {
  aggregateImbuements,
  gearItemKey,
  itemStartsStored,
  parseGearItem,
  parseStoredPeriods,
  planEquipItem,
} from "../imbuements";
import type { Imbuement } from "../store";
import { makeSession } from "./fixtures";

/**
 * Pedido do jogador Yin Sylvan (22/10): ele usa 2 rods, cada uma com o seu imbuement e tempos
 * diferentes. Antes, o 2º Void na "Arma" contava como renovação do 1º e o custo/h saía errado.
 */
const HOUR = 3600;
const POWERFUL_POR_HORA = 12_500; // 250.000 ÷ 20h

const imb = (over: Partial<Imbuement> & { id: string }): Imbuement => ({
  characterId: "char-1",
  tier: "powerful",
  goldTokenCost: 0,
  label: "void",
  gearSlot: "weapon",
  hoursRemaining: 20,
  createdAt: "2026-11-01T10:00:00Z",
  ...over,
});
const session = (createdAt: string, hours: number) =>
  makeSession({ createdAt, hunting: { durationSec: hours * HOUR } });

/** Aplica o resultado do planEquipItem como o app faz depois de gravar no banco. */
const apply = (list: Imbuement[], updates: ReturnType<typeof planEquipItem>) =>
  list.map((i) => {
    const u = updates.find((x) => x.id === i.id);
    return u ? { ...i, storedPeriods: u.storedPeriods } : i;
  });

describe("imbuements em mais de um item do mesmo tipo", () => {
  it("a 2ª arma é um item à parte e o dado antigo ('weapon') continua sendo a 1ª", () => {
    expect(parseGearItem("weapon")).toEqual({ slot: "weapon", n: 1 });
    expect(parseGearItem("weapon#2")).toEqual({ slot: "weapon", n: 2 });
    expect(parseGearItem("helmet#3")).toEqual({ slot: "helmet", n: 3 });
    expect(parseGearItem("weapon#lixo")).toEqual({ slot: "weapon", n: 1 });
    expect(parseGearItem(null)).toBeNull();
    expect(gearItemKey("weapon", 1)).toBe("weapon");
    expect(gearItemKey("weapon", 2)).toBe("weapon#2");
  });

  it("2 armas com o mesmo imbuement e tempos diferentes: uma não renova a outra e cada uma gasta o seu tempo", () => {
    const list = [
      imb({ id: "rod-1-void", hoursRemaining: 20 }),
      imb({ id: "rod-2-void", gearSlot: "weapon#2", hoursRemaining: 8, createdAt: "2026-11-02T10:00:00Z" }),
    ];

    const antes = aggregateImbuements(list, [], "char-1");
    expect(antes.rows.every((r) => r.active)).toBe(true);
    expect(antes.activeCostPerHour).toBe(2 * POWERFUL_POR_HORA);

    const depois = aggregateImbuements(list, [session("2026-11-03T10:00:00Z", 10)], "char-1");
    const row = (id: string) => depois.rows.find((r) => r.imb.id === id)!;
    expect(row("rod-1-void")).toMatchObject({ hoursConsumed: 10, hoursRemaining: 10, active: true });
    // A rod 2 tinha só 8h: acaba no meio da hunt e não passa disso.
    expect(row("rod-2-void")).toMatchObject({ hoursConsumed: 8, hoursRemaining: 0, active: false });
    expect(depois.activeCostPerHour).toBe(POWERFUL_POR_HORA);
    expect(depois.totalSpent).toBe(POWERFUL_POR_HORA * 18);
  });

  it("arma guardada não gasta tempo nem entra no custo/h; ao trocar, o gasto passa pra outra", () => {
    let list = [
      imb({ id: "rod-1-void" }),
      imb({ id: "rod-1-vamp", label: "vampirism" }),
      imb({
        id: "rod-2-void",
        gearSlot: "weapon#2",
        hoursRemaining: 8,
        storedPeriods: [{ from: "2026-11-01T10:00:00Z", to: null }],
      }),
    ];
    const hunts = [session("2026-11-02T10:00:00Z", 5)];

    let agg = aggregateImbuements(list, hunts, "char-1");
    let row = (id: string) => agg.rows.find((r) => r.imb.id === id)!;
    expect(row("rod-1-void")).toMatchObject({ hoursConsumed: 5, hoursRemaining: 15, active: true });
    expect(row("rod-2-void")).toMatchObject({ hoursConsumed: 0, hoursRemaining: 8, active: false, stored: true });
    expect(agg.activeCostPerHour).toBe(2 * POWERFUL_POR_HORA);

    // Trocou pra rod 2: a rod 1 vai pra mochila, a rod 2 volta a gastar.
    list = apply(list, planEquipItem(list, "char-1", "weapon#2", "2026-11-03T10:00:00Z"));
    hunts.push(session("2026-11-04T10:00:00Z", 3));

    agg = aggregateImbuements(list, hunts, "char-1");
    row = (id: string) => agg.rows.find((r) => r.imb.id === id)!;
    expect(row("rod-1-void")).toMatchObject({ hoursConsumed: 5, hoursRemaining: 15, active: false, stored: true });
    expect(row("rod-1-vamp")).toMatchObject({ hoursConsumed: 5, stored: true });
    expect(row("rod-2-void")).toMatchObject({ hoursConsumed: 3, hoursRemaining: 5, active: true, stored: false });
    expect(agg.activeCostPerHour).toBe(POWERFUL_POR_HORA);
    expect(agg.totalSpent).toBe(POWERFUL_POR_HORA * (5 + 5 + 3));
  });

  it("trocar de arma só mexe nas armas do personagem, e não no imbuement já renovado", () => {
    const list = [
      imb({ id: "velho", createdAt: "2026-10-01T10:00:00Z" }),
      imb({ id: "rod-1-void" }),
      imb({ id: "capacete", gearSlot: "helmet", label: "lich_shroud" }),
      imb({ id: "outro-char", characterId: "char-2" }),
      imb({ id: "rod-2-void", gearSlot: "weapon#2", storedPeriods: [{ from: "2026-11-01T10:00:00Z", to: null }] }),
    ];
    const updates = planEquipItem(list, "char-1", "weapon#2", "2026-11-05T10:00:00Z");
    expect(updates).toEqual([
      { id: "rod-1-void", storedPeriods: [{ from: "2026-11-05T10:00:00Z", to: null }] },
      { id: "rod-2-void", storedPeriods: [{ from: "2026-11-01T10:00:00Z", to: "2026-11-05T10:00:00Z" }] },
    ]);
    // Já está em uso: nada a gravar.
    expect(planEquipItem(apply(list, updates), "char-1", "weapon#2", "2026-11-06T10:00:00Z")).toEqual([]);
  });

  it("imbuement novo numa 2ª arma começa guardado quando outra arma está em uso", () => {
    const comRod1 = aggregateImbuements([imb({ id: "rod-1-void" })], [], "char-1").rows;
    expect(itemStartsStored(comRod1, "weapon#2")).toBe(true);
    expect(itemStartsStored(comRod1, "weapon")).toBe(false);
    expect(itemStartsStored(comRod1, "helmet")).toBe(false);
    expect(itemStartsStored([], "weapon#2")).toBe(false);

    const rod2Guardada = aggregateImbuements(
      [imb({ id: "rod-2-void", gearSlot: "weapon#2", storedPeriods: [{ from: "2026-11-01T10:00:00Z", to: null }] })],
      [],
      "char-1",
    ).rows;
    expect(itemStartsStored(rod2Guardada, "weapon#2")).toBe(true);
  });

  it("período guardado vindo do banco: vazio ou inválido vira lista vazia", () => {
    expect(parseStoredPeriods(null)).toEqual([]);
    expect(parseStoredPeriods("lixo")).toEqual([]);
    expect(parseStoredPeriods([{ from: "2026-11-01T10:00:00Z", to: null }])).toEqual([
      { from: "2026-11-01T10:00:00Z", to: null },
    ]);
  });
});
