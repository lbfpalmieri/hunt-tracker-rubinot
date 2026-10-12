import { describe, expect, it } from "vitest";
import {
  budgetLevel,
  estimateIncoming,
  huntStage,
  recommendSet,
  suggestImbuements,
} from "../hunt-advisor";
import { findEquipment } from "../equipment";
import { findWeapon } from "../weapons";

const task = (...names: string[]) => names.map((name) => ({ name, count: 1 }));

describe("fase da hunt (conselho da Linked Task)", () => {
  it("criaturas do começo do jogo são starter: Goblin, Rat, Wolf, Troll, Cyclops", () => {
    for (const n of ["Goblin", "Rat", "Wolf", "Troll", "Cyclops"]) {
      expect(huntStage(task(n)), n).toBe("starter");
    }
  });

  it("criaturas médias não pedem set de ponta: Dragon, Hydra, Giant Spider, Orc Warlord", () => {
    for (const n of ["Dragon", "Hydra", "Giant Spider", "Orc Warlord"]) {
      expect(huntStage(task(n)), n).toBe("mid");
    }
  });

  it("criaturas de end-game justificam set e imbuement: Demon, Hellhound", () => {
    expect(huntStage(task("Demon"))).toBe("hard");
    expect(huntStage(task("Hellhound"))).toBe("hard");
  });

  it("vale a criatura mais difícil da task", () => {
    expect(huntStage(task("Rat", "Demon"))).toBe("hard");
    expect(huntStage(task("Rat", "Dragon"))).toBe("mid");
  });

  it("criatura desconhecida não muda a fase", () => {
    expect(huntStage(task("Criatura Que Nao Existe"))).toBe("starter");
  });
});

describe("orçamento do jogador", () => {
  it("starter não permite item nenhum, mid limita no level 150, hard libera tudo", () => {
    expect(budgetLevel("starter", 1096)).toBe(0);
    expect(budgetLevel("mid", 1096)).toBe(150);
    expect(budgetLevel("mid", 80)).toBe(80);
    expect(budgetLevel("mid", null)).toBe(150);
    expect(budgetLevel("hard", 1096)).toBe(1096);
    expect(budgetLevel("hard", null)).toBeNull();
  });

  it("set de Dragon pra Knight level 1096 não traz item acima do level 150", () => {
    const monsters = task("Dragon");
    const r = recommendSet({
      vocation: "knight",
      level: budgetLevel(huntStage(monsters), 1096),
      mode: "defensive",
      monsters,
      incoming: estimateIncoming(monsters),
    });
    const names = [
      r.setup.weapon,
      ...Object.values(r.setup.gear ?? {}),
    ].filter((n): n is string => !!n);
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      const lvl = (findEquipment(n) ?? findWeapon(n))?.level ?? 0;
      expect(lvl, n).toBeLessThanOrEqual(150);
    }
  });

  it("set de Demon pra Knight 1096 continua de ponta e sugere imbuement", () => {
    const monsters = task("Demon");
    const input = {
      vocation: "knight" as const,
      level: budgetLevel(huntStage(monsters), 1096),
      mode: "defensive" as const,
      monsters,
      incoming: estimateIncoming(monsters),
    };
    const r = recommendSet(input);
    expect(input.level).toBe(1096);
    expect(suggestImbuements(input, r.setup).length).toBeGreaterThan(0);
  });
});
