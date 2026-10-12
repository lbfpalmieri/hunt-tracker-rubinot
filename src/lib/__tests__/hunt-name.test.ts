import { describe, expect, it } from "vitest";
import { aggregateByHunt, fromOwnSession } from "../compare";
import { HUNT_NAME_MAX, normalizeHuntName, sameHuntName } from "../hunt-name";
import { makeSession } from "./fixtures";

const HOUR = 3600;
const own = (over: Parameters<typeof makeSession>[0]) =>
  fromOwnSession(makeSession(over), "Char", "Knight");

describe("nome da hunt", () => {
  it("tira espaço sobrando e respeita o limite de tamanho", () => {
    expect(normalizeHuntName("  Asura   Palace  ")).toBe("Asura Palace");
    expect(normalizeHuntName("x".repeat(500))).toHaveLength(HUNT_NAME_MAX);
  });

  it("compara sem diferenciar maiúscula nem espaço", () => {
    expect(sameHuntName("Asura Palace", " asura  palace ")).toBe(true);
    expect(sameHuntName("Asura Palace", "Asura Place")).toBe(false);
  });

  it("depois de corrigir o nome, a sessão entra na média da hunt certa", () => {
    const antes = aggregateByHunt([
      own({ huntName: "Asura Palace", hunting: { durationSec: HOUR, balance: 100 } }),
      own({ huntName: "Asura Palaec", hunting: { durationSec: HOUR, balance: 300 } }),
    ]);
    expect(antes).toHaveLength(2);

    const depois = aggregateByHunt([
      own({ huntName: "Asura Palace", hunting: { durationSec: HOUR, balance: 100 } }),
      own({ huntName: normalizeHuntName("asura  palace "), hunting: { durationSec: HOUR, balance: 300 } }),
    ]);
    expect(depois).toHaveLength(1);
    expect(depois[0].sessionCount).toBe(2);
    expect(depois[0].balance).toBe(200);
  });
});
