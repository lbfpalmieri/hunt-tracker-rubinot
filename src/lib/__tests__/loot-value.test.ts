import { describe, expect, it } from "vitest";
import { groupLoot, sortLoot, valueLoot } from "../loot-value";
import { lootCategoryOf, npcPriceOf } from "../item-info";

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

describe("preço de NPC como padrão", () => {
  it("usa o preço de NPC da TibiaWiki quando a pessoa não definiu o dela, marcado como NPC", () => {
    const v = valueLoot([{ name: "Giant Ruby", count: 2 }], new Map());
    const r = v.rows[0];
    expect(r.unit).toBe(70_000);
    expect(r.total).toBe(140_000);
    expect(r.source).toBe("npc");
    expect(v.unpriced).toBe(0);
  });

  it("o preço da pessoa vence o de NPC, e o de NPC segue guardado como referência", () => {
    const v = valueLoot([{ name: "Giant Ruby", count: 1 }], new Map([["Giant Ruby", 90_000]]));
    expect(v.rows[0].source).toBe("mine");
    expect(v.rows[0].total).toBe(90_000);
    expect(v.rows[0].npc).toBe(70_000);
  });

  it("item que o NPC não compra e sem preço da pessoa continua sem valor", () => {
    const v = valueLoot([{ name: "Item Que Nao Existe", count: 3 }], new Map());
    expect(v.rows[0].source).toBeNull();
    expect(v.rows[0].total).toBeNull();
    expect(npcPriceOf("Gold Token")).toBeNull();
  });
});

describe("loot por categoria", () => {
  it("classifica pelos dados da TibiaWiki e cai em Outros quando não conhece", () => {
    expect(lootCategoryOf("Lion's Mane")).toBe("imbuement");
    expect(lootCategoryOf("Afflicted Strider Head")).toBe("task");
    expect(lootCategoryOf("gold coin")).toBe("coins");
    expect(lootCategoryOf("Gold Token")).toBe("coins");
    expect(lootCategoryOf("Lizard Leather")).toBe("creature");
    expect(lootCategoryOf("Giant Ruby")).toBe("valuables");
    expect(lootCategoryOf("Item Que Nao Existe")).toBe("other");
  });

  it("agrupa com subtotal por grupo, Outros por último, e mantém a ordenação dentro dos grupos", () => {
    const rows = valueLoot(
      [
        { name: "Lion's Mane", count: 20 },
        { name: "Demon Horn", count: 3 },
        { name: "gold coin", count: 50_000 },
        { name: "Lizard Leather", count: 10 },
        { name: "Item Que Nao Existe", count: 9 },
      ],
      new Map(),
    ).rows;
    const porValor = groupLoot(rows, "value");
    expect(porValor.map((g) => g.category)).toEqual(["coins", "imbuement", "creature", "other"]);
    const imb = porValor.find((g) => g.category === "imbuement")!;
    expect(imb.total).toBe(20 * 60 + 3 * 1000);
    expect(imb.rows.map((r) => r.name)).toEqual(["Demon Horn", "Lion's Mane"]);
    const porQtd = groupLoot(rows, "count").find((g) => g.category === "imbuement")!;
    expect(porQtd.rows.map((r) => r.name)).toEqual(["Lion's Mane", "Demon Horn"]);
  });

  it("não mostra grupo vazio", () => {
    const g = groupLoot(valueLoot([{ name: "gold coin", count: 1 }], new Map()).rows, "value");
    expect(g).toHaveLength(1);
  });
});
