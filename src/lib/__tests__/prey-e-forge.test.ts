import { describe, expect, it } from "vitest";
import { fmtPct, forgeLines, maxTierForClass, tierPct } from "../forge";
import {
  normalizePrey,
  preyBonusLabel,
  preyMarkLabel,
  preyMarkTitle,
  preyPctForStars,
  preySlotLabel,
  preyStarsForPct,
} from "../prey";

describe("Prey", () => {
  it("estrelas fora de 1–10 ficam no limite", () => {
    expect(preyPctForStars("xp", 0)).toBe(13);
    expect(preyPctForStars("xp", 15)).toBe(40);
    expect(preyPctForStars("damage", 10)).toBe(25);
    expect(preyPctForStars("defense", 1)).toBe(12);
  });

  it("sessão antiga sem % conta como 10 estrelas", () => {
    expect(preyStarsForPct("loot", null)).toBe(10);
    expect(preyStarsForPct("loot", 22)).toBe(4);
  });

  it("normalizePrey limpa o que vem do banco", () => {
    expect(normalizePrey(null)).toBeNull();
    expect(normalizePrey("xp")).toBeNull();
    expect(normalizePrey([{ bonus: "voar" }])).toBeNull();
    expect(
      normalizePrey([
        { bonus: "xp", pct: 40, creature: "  Ingol " },
        { bonus: "loot", pct: Number.NaN, creature: "" },
        null,
        { bonus: "damage", pct: "25" },
        { bonus: "defense", pct: 30 },
      ]),
    ).toEqual([
      { bonus: "xp", pct: 40, creature: "Ingol" },
      { bonus: "loot", pct: null, creature: null },
      { bonus: "damage", pct: null, creature: null },
    ]);
  });

  it("rótulos", () => {
    expect(preyBonusLabel("xp")).toBe("Bonus XP");
    expect(preyBonusLabel("outro")).toBe("outro");
    expect(preySlotLabel({ bonus: "xp", pct: 40, creature: "Ingol" })).toBe("Bonus XP 40% (Ingol)");
    expect(preySlotLabel({ bonus: "loot" })).toBe("Improved Loot");
  });

  it("marca dos cards afetados por prey (sem % = padrão de 10 estrelas)", () => {
    const prey = [
      { bonus: "loot" as const, pct: 31, creature: "Ingol" },
      { bonus: "loot" as const, pct: null, creature: null },
      { bonus: "defense" as const, pct: 20, creature: "Gloom Maw" },
    ];
    expect(preyMarkLabel(prey, "loot")).toBe("Loot com Prey +31/40%");
    expect(preyMarkLabel(prey, "defense")).toBe("Defesa com Prey -20%");
    expect(preyMarkLabel(prey, "xp")).toBeNull();
    expect(preyMarkTitle(prey, "loot")).toContain("Ingol (31%), criatura (40%)");
    expect(preyMarkTitle(null, "xp")).toBeUndefined();
  });
});

describe("Exaltation Forge (tier)", () => {
  it("% por tier, com tier 0 = nada e acima de 10 = tier 10", () => {
    expect(tierPct("weapon", 0)).toBe(0);
    expect(tierPct("weapon", 1)).toBe(0.5);
    expect(tierPct("weapon", 10)).toBe(9.05);
    expect(tierPct("weapon", 12)).toBe(9.05);
    expect(tierPct("legs", 3)).toBe(0.44);
  });

  it("tier máximo pela classe do item", () => {
    expect(maxTierForClass(0)).toBe(0);
    expect(maxTierForClass(-1)).toBe(0);
    expect(maxTierForClass(2)).toBe(2);
    expect(maxTierForClass(3)).toBe(3);
    expect(maxTierForClass(4)).toBe(10);
  });

  it("bota com tier amplifica as outras habilidades, não ela mesma", () => {
    const lines = forgeLines({ feet: 2, weapon: 10, head: 0 });
    expect(lines.map((l) => [l.slot, l.skill.name, l.base, l.amplified])).toEqual([
      ["weapon", "Onslaught", 9.05, 9.54],
      ["feet", "Amplification", 5.4, null],
    ]);
  });

  it("sem bota não há amplificação; sem tier não há linha", () => {
    expect(forgeLines({ armor: 1 })).toMatchObject([{ slot: "armor", base: 0.5, amplified: null }]);
    expect(forgeLines({})).toEqual([]);
  });

  it("formato pt-BR do %", () => {
    expect(fmtPct(9.054)).toBe("9,05%");
  });
});
