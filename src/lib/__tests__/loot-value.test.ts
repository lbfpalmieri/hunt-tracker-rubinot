import { describe, expect, it } from "vitest";
import { sortLoot, valueLoot } from "../loot-value";

const itens = [
  { name: "gold coin", count: 5000 },
  { name: "Giant Sword", count: 2 },
  { name: "Dragon Scale Mail", count: 1 },
  { name: "Mini Item", count: 40 },
];
const precos = new Map([
  ["Giant Sword", 17_000],
  ["Dragon Scale Mail", 36_000],
]);

describe("valor do loot por item", () => {
  it("multiplica o preço pela quantidade e usa o valor fixo das moedas", () => {
    const v = valueLoot(itens, precos);
    expect(v.rows.find((r) => r.name === "Giant Sword")?.total).toBe(34_000);
    expect(v.rows.find((r) => r.name === "gold coin")?.total).toBe(5_000);
    expect(v.pricedTotal).toBe(5_000 + 34_000 + 36_000);
  });

  it("item sem preço fica sem valor (não vira zero) e é contado", () => {
    const v = valueLoot(itens, precos);
    const mini = v.rows.find((r) => r.name === "Mini Item")!;
    expect(mini.total).toBeNull();
    expect(v.unpriced).toBe(1);
  });

  it("ordena pelo que mais pagou a hunt, com os sem preço no fim", () => {
    const rows = sortLoot(valueLoot(itens, precos).rows, "value");
    expect(rows.map((r) => r.name)).toEqual([
      "Dragon Scale Mail",
      "Giant Sword",
      "gold coin",
      "Mini Item",
    ]);
  });

  it("também ordena por quantidade", () => {
    expect(sortLoot(valueLoot(itens, precos).rows, "count")[0].name).toBe("gold coin");
  });
});
