import { describe, expect, it } from "vitest";
import { splitShare } from "../boss-rotations";

describe("splitShare (rotação de boss em PT)", () => {
  it("sem dividir, tudo é seu", () => {
    expect(splitShare(1_000_000, 100_000, 4, false)).toEqual({
      loot: 1_000_000,
      supplies: 100_000,
      balance: 900_000,
      divisor: 1,
    });
  });

  it("divide loot e supplies igualmente entre os jogadores", () => {
    expect(splitShare(1_000_000, 100_000, 4, true)).toEqual({
      loot: 250_000,
      supplies: 25_000,
      balance: 225_000,
      divisor: 4,
    });
  });

  it("arredonda pra baixo e 1 jogador não divide", () => {
    expect(splitShare(1_000, 0, 3, true).loot).toBe(333);
    expect(splitShare(1_000, 0, 1, true).loot).toBe(1_000);
    expect(splitShare(1_000, 0, 0, true).divisor).toBe(1);
  });
});
