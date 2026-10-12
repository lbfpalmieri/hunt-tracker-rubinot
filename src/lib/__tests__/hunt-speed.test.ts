import { describe, expect, it } from "vitest";
import { rankHuntsByTask } from "../hunt-speed";

const HOUR = 3600;
const sess = (huntName: string, durationSec: number, kills: [string, number][]) => ({
  huntName,
  hunting: { durationSec, kills: kills.map(([name, count]) => ({ name, count })) },
});

describe("onde eu caço essas criaturas (task)", () => {
  const historico = [
    sess("Asura", HOUR, [["Dragon", 100]]),
    sess("asura ", HOUR, [["Dragon", 300]]),
    sess("Lava", 2 * HOUR, [["Dragon", 200], ["Hydra", 50]]),
    sess("Outra", HOUR, [["Rat", 999]]),
  ];

  it("ordena pela hunt que termina a task mais rápido, juntando grafias iguais", () => {
    const r = rankHuntsByTask(historico, ["Dragon"], 400);
    expect(r.map((h) => h.huntName)).toEqual(["Asura", "Lava"]);
    expect(r[0].sessionCount).toBe(2);
    expect(r[0].perHour).toBe(200); // 400 kills em 2h
    expect(r[0].estSec).toBe(2 * HOUR); // 400 kills a 200/h
    expect(r[1].perHour).toBe(100);
  });

  it("task com várias criaturas soma as kills de todas", () => {
    const lava = rankHuntsByTask(historico, ["Dragon", "Hydra"], 250).find((h) => h.huntName === "Lava")!;
    expect(lava.totalKills).toBe(250);
    expect(lava.perMonsterPerHour.map((m) => m.perHour)).toEqual([100, 25]);
  });

  it("quem nunca matou essas criaturas fica fora, e sem alvo não devolve nada", () => {
    expect(rankHuntsByTask(historico, ["Demon"], 100)).toEqual([]);
    expect(rankHuntsByTask(historico, [], 100)).toEqual([]);
  });
});
