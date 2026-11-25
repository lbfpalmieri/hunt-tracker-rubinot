import { describe, expect, it } from "vitest";
import {
  adviseCreature,
  CHARM_RULES,
  characterHp,
  characterMana,
  charmCostToLevel,
  charmRule,
  huntKills,
  planHuntCharms,
  type CharmContext,
} from "../charm-optimizer";
import { findMonster } from "../monsters";

// Criaturas reais da TibiaWiki BR (src/data/monsters-data.ts), nunca dado de jogador.
const monster = (name: string) => {
  const m = findMonster(name);
  if (!m) throw new Error(`${name} sumiu do monsters-data`);
  return m;
};
const ctx = (over: Partial<CharmContext> = {}): CharmContext => ({
  vocation: null,
  level: null,
  owned: {},
  ...over,
});

describe("regras dos charms (TibiaWiki BR)", () => {
  it("tem os 14 major e os 11 minor da wiki", () => {
    expect(CHARM_RULES.filter((r) => r.kind === "major")).toHaveLength(14);
    expect(CHARM_RULES.filter((r) => r.kind === "minor")).toHaveLength(11);
  });

  it("soma o custo de cada nível até o nível pedido", () => {
    expect(charmCostToLevel(charmRule("Wound")!, 3)).toBe(240 + 360 + 1200);
    expect(charmCostToLevel(charmRule("Low Blow")!, 2)).toBe(800 + 1200);
    expect(charmCostToLevel(charmRule("Gut")!, 3)).toBe(100 + 150 + 225);
  });

  it("estima vida e mana pela vocação e level (185 de vida e 90 de mana no level 8)", () => {
    expect(characterHp("knight", 100)).toBe(185 + 15 * 92);
    expect(characterHp("druid", 8)).toBe(185);
    expect(characterMana("sorcerer", 100)).toBe(90 + 30 * 92);
    expect(characterMana("paladin", 200)).toBe(90 + 15 * 192);
    expect(characterHp(null, 100)).toBeNull();
    expect(characterHp("knight", null)).toBeNull();
  });
});

describe("melhor charm contra uma criatura", () => {
  it("sem ficha, considera todos no Nv1 e escolhe o elemento a que ela é mais fraca", () => {
    const r = adviseCreature(monster("Hydra"), ctx());
    expect(r.knowsOwned).toBe(false);
    expect(r.bestMajor?.charm).toBe("Zap"); // Hydra toma 110% de energia
    // 5% de 2350 de vida × 110% × 5% de chance no Nv1
    expect(r.bestMajor?.avgDamage).toBeCloseTo(2350 * 0.05 * 1.1 * 0.05);
    expect(r.unlock).toEqual([]);
  });

  it("criatura imune ao elemento: o charm não causa dano e explica por quê", () => {
    const r = adviseCreature(monster("Hydra"), ctx());
    const poison = r.damage.find((o) => o.charm === "Poison")!;
    expect(poison.avgDamage).toBe(0);
    expect(poison.why).toContain("Imune a Terra");
    const enflame = adviseCreature(monster("Dragon Lord"), ctx()).damage.find(
      (o) => o.charm === "Enflame",
    )!;
    expect(enflame.avgDamage).toBe(0);
  });

  it("com ficha, lista só os charms que o personagem tem e sugere desbloquear o que rende mais", () => {
    const r = adviseCreature(monster("Hydra"), ctx({ owned: { Wound: 3, Poison: 3 } }));
    expect(r.damage.map((o) => o.charm)).toEqual(["Wound", "Poison"]);
    expect(r.bestMajor?.charm).toBe("Wound");
    expect(r.bestMajor?.level).toBe(3);
    // Zap no mesmo Nv3 do Wound rende mais na Hydra (110% de energia contra 105% de físico)
    const majors = r.unlock.filter((o) => o.kind === "major");
    expect(majors.map((o) => o.charm)).toEqual(["Zap"]);
    expect(majors[0].owned).toBeNull();
    expect(majors[0].level).toBe(3);
  });

  it("Overpower de knight alto bate no limite de 8% da vida da criatura", () => {
    const r = adviseCreature(monster("Hydra"), ctx({ vocation: "knight", level: 300 }));
    const op = r.damage.find((o) => o.charm === "Overpower")!;
    // 5% de 4565 de vida = 228, mas o teto é 8% de 2350 = 188; Hydra toma 105% de físico
    expect(op.avgDamage).toBeCloseTo(2350 * 0.08 * 1.05 * 0.05);
    expect(op.why).toContain("limite de 8%");
    expect(r.bestMajor?.charm).toBe("Overpower");
  });

  it("Overpower de level baixo fica abaixo do teto e perde pro elemento fraco", () => {
    const r = adviseCreature(monster("Hydra"), ctx({ vocation: "knight", level: 50 }));
    const op = r.damage.find((o) => o.charm === "Overpower")!;
    expect(op.avgDamage).toBeCloseTo(815 * 0.05 * 1.05 * 0.05);
    expect(op.why).toContain("abaixo do limite");
    expect(r.bestMajor?.charm).toBe("Zap");
  });

  it("sem level, Overpower e Overflux pedem o level em vez de inventar número", () => {
    const r = adviseCreature(monster("Hydra"), ctx());
    const op = r.damage.find((o) => o.charm === "Overflux")!;
    expect(op.avgDamage).toBeNull();
    expect(op.why).toContain("level");
  });

  it("criatura que drena mana: Void Inversion é o melhor minor", () => {
    expect(adviseCreature(monster("Warlock"), ctx()).bestMinor?.charm).toBe("Void Inversion");
    const rot = adviseCreature(monster("Rotworm"), ctx()).minor.find(
      (o) => o.charm === "Void Inversion",
    )!;
    expect(rot.score).toBe(0);
    expect(rot.why).toBe("Ela não drena mana");
  });

  it("criatura que tira 20% da vida num ataque pede charm de defesa", () => {
    const demon = adviseCreature(monster("Demon"), ctx({ vocation: "knight", level: 100 }));
    expect(demon.dangerous).toBe(true);
    expect(demon.maxHit).toBe(500);
    expect(demon.defense[0].why).toContain("32% da sua vida");
    const rot = adviseCreature(monster("Rotworm"), ctx({ vocation: "knight", level: 100 }));
    expect(rot.dangerous).toBe(false);
    expect(rot.defense[0].why).toContain("Ela bate pouco");
  });
});

describe("charms pra uma hunt inteira", () => {
  it("usa cada charm uma vez só e dá o melhor pra criatura mais matada", () => {
    const plan = planHuntCharms(
      [
        { name: "Dragon Lord", count: 100 },
        { name: "Dragon", count: 300 },
        { name: "Ferumbras", count: 1 },
        { name: "Criatura Inventada", count: 1 },
        { name: "Rotworm", count: 5 },
      ],
      ctx({ owned: { Freeze: 3, Wound: 3 } }),
    );
    // Freeze é o melhor nos dois (110% de gelo): vai pro Dragon (mais kills); o Dragon Lord fica com o Wound
    expect(plan.rows.map((r) => [r.monster.name, r.major?.charm])).toEqual([
      ["Dragon", "Freeze"],
      ["Dragon Lord", "Wound"],
    ]);
    // Sem minor na ficha, nenhum minor é escolhido
    expect(plan.rows.every((r) => r.minor === null)).toBe(true);
    // Boss e criatura fora da wiki ficam de fora; Rotworm (1% das kills) só não entra no plano
    expect(plan.skipped).toEqual(["Ferumbras", "Criatura Inventada"]);
  });

  it("junta as criaturas de todas as sessões da mesma hunt", () => {
    const sess = (huntName: string, kills: [string, number][]) => ({
      huntName,
      hunting: { durationSec: 3600, kills: kills.map(([name, count]) => ({ name, count })) },
    });
    const kills = huntKills(
      [
        sess("Asura", [["Dragon", 10]]),
        sess("asura ", [
          ["Dragon", 5],
          ["Hydra", 2],
        ]),
        sess("Lava", [["Demon", 1]]),
      ],
      "Asura",
    );
    expect(kills).toEqual([
      { name: "Dragon", count: 15 },
      { name: "Hydra", count: 2 },
    ]);
  });
});
