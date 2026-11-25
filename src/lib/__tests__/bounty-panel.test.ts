import { describe, expect, it } from "vitest";
import { buildBountyPanel, type BountyPanelSession } from "../bounty-panel";

const HOUR = 3600;
const task = (
  characterId: string,
  creature: string | null,
  durationSec: number,
  kills: [string, number][],
  opts: { difficulty?: "beginner" | "master"; balance?: number; rawXp?: number; bountyXp?: number | null } = {},
): BountyPanelSession => ({
  characterId,
  hunting: {
    durationSec,
    balance: opts.balance ?? 0,
    rawXp: opts.rawXp ?? 0,
    xpGain: opts.rawXp ?? 0,
    kills: kills.map(([name, count]) => ({ name, count })),
  },
  bounty: {
    difficulty: opts.difficulty ?? "master",
    tier: "normal",
    xp: opts.bountyXp === undefined ? 0 : opts.bountyXp,
    creature,
  },
});

describe("painel de Bounty", () => {
  const sessoes = [
    task("a", "Dragon", HOUR, [["Dragon", 100]], { balance: 200_000, rawXp: 1_000_000 }),
    task("a", "dragon", 2 * HOUR, [["Dragon", 500], ["Hydra", 9]], { balance: 400_000, rawXp: 3_000_000 }),
    task("b", "Hydra", HOUR, [["Hydra", 400]], { difficulty: "beginner" }),
  ];

  it("ordena das criaturas mais rápidas pras mais lentas, juntando grafias iguais", () => {
    const rows = buildBountyPanel(sessoes);
    expect(rows.map((r) => r.creature)).toEqual(["Hydra", "Dragon"]);
    const dragon = rows[1];
    expect(dragon.tasks).toBe(2);
    expect(dragon.avgKillsPerHour).toBe(200); // 600 abates em 3h
    expect(dragon.bestKillsPerHour).toBe(250); // a sessão de 2h
    expect(dragon.avgTaskSec).toBe(1.5 * HOUR);
  });

  it("calcula XP/h e lucro/h pela soma das sessões, não pela média das médias", () => {
    const dragon = buildBountyPanel(sessoes).find((r) => r.creature === "Dragon")!;
    expect(dragon.profitPerHour).toBe(200_000); // 600k em 3h
    expect(dragon.xpPerHour).toBeCloseTo(1_333_333, -2); // 4M em 3h
  });

  it("filtra por personagem e por dificuldade", () => {
    expect(buildBountyPanel(sessoes, { characterId: "b" }).map((r) => r.creature)).toEqual(["Hydra"]);
    expect(buildBountyPanel(sessoes, { difficulty: "beginner" }).map((r) => r.creature)).toEqual(["Hydra"]);
    expect(buildBountyPanel(sessoes, { characterId: "zzz" })).toEqual([]);
  });

  it("desconta a XP do prêmio da Bounty no XP/h e deixa de fora quando ela é desconhecida", () => {
    const [a] = buildBountyPanel([
      task("a", "Dragon", HOUR, [["Dragon", 100]], { rawXp: 2_000_000, bountyXp: 500_000 }),
    ]);
    expect(a.xpPerHour).toBe(1_500_000);
    const [b] = buildBountyPanel([
      task("a", "Dragon", HOUR, [["Dragon", 100]], { rawXp: 2_000_000, bountyXp: null }),
    ]);
    expect(b.xpPerHour).toBeNull();
    expect(b.avgKillsPerHour).toBe(100);
  });

  it("ignora sessão sem criatura da Bounty; task sem abates da criatura conta, mas fica sem ritmo", () => {
    const rows = buildBountyPanel([
      task("a", null, HOUR, [["Dragon", 100]]),
      task("a", "Demon", HOUR, [["Dragon", 100]]),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ creature: "Demon", tasks: 1, measuredTasks: 0, avgKillsPerHour: null });
  });
});
