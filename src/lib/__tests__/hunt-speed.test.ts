import { describe, expect, it } from "vitest";
import { finishDate, listHunts, playDays, rankHuntsByTask } from "../hunt-speed";

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

describe("o que não conta pra task", () => {
  it("guarda as criaturas da hunt que não são da task, da mais matada pra menos", () => {
    const r = rankHuntsByTask(
      [
        sess("Furious Crater", HOUR, [["Vibrant Phantom", 66], ["Bonebeast", 10], ["Ghoul", 40]]),
        sess("furious crater", HOUR, [["Vibrant Phantom", 30], ["Bonebeast", 50]]),
      ],
      ["Vibrant Phantom"],
      100,
    );
    expect(r[0].totalKills).toBe(96);
    expect(r[0].ignoredKills).toEqual([
      { name: "Bonebeast", count: 60 },
      { name: "Ghoul", count: 40 },
    ]);
  });
});

describe("hunts do histórico com as criaturas (escolher pela hunt)", () => {
  it("junta grafias iguais, soma as kills e ordena pela mais jogada", () => {
    const h = listHunts([
      sess("Lava", HOUR, [["Dragon", 10]]),
      sess("Asura", HOUR, [["Dragon", 100], ["Hydra", 5]]),
      sess("asura ", HOUR, [["Hydra", 300]]),
      sess("Vazia", HOUR, []),
    ]);
    expect(h.map((x) => x.huntName)).toEqual(["Asura", "Lava"]);
    expect(h[0].sessionCount).toBe(2);
    expect(h[0].monsters).toEqual([
      { name: "Hydra", count: 305 },
      { name: "Dragon", count: 100 },
    ]);
  });
});

describe("tempo em dias jogando X horas por dia", () => {
  it("arredonda pra cima: 116h40 a 4h por dia termina no 30º dia", () => {
    expect(playDays(116 * HOUR + 40 * 60, 4)).toBe(30);
  });

  it("conta exata não ganha um dia a mais", () => {
    expect(playDays(8 * HOUR, 4)).toBe(2);
    expect(playDays(0.3 * HOUR * 10, 0.5)).toBe(6);
  });

  it("sem estimativa ou sem horas por dia: Infinity", () => {
    expect(playDays(Infinity, 4)).toBe(Infinity);
    expect(playDays(HOUR, 0)).toBe(Infinity);
  });

  it("data de término: hoje conta como o 1º dia", () => {
    const start = new Date(2026, 10, 9);
    expect(finishDate(3 * HOUR, 4, start)?.getDate()).toBe(9);
    const d = finishDate(116 * HOUR + 40 * 60, 4, start)!;
    expect([d.getMonth(), d.getDate()]).toEqual([11, 8]); // 9/nov + 29 dias = 8/dez
    expect(finishDate(Infinity, 4, start)).toBeNull();
  });
});
