import { describe, expect, it } from "vitest";
import { prefillCharms, updateMemory, type CharmMemory } from "../charm-memory";

const memory: CharmMemory = {
  Enflame: { creature: "Cursed Book", level: 3 },
  Zap: { creature: "Ink Blob", level: 1 },
};

describe("charm-memory", () => {
  it("preenche o charm que ativou com a criatura lembrada", () => {
    const r = prefillCharms([], ["Enflame", "Freeze"], ["Cursed Book", "Ink Blob"], memory);
    expect(r).toEqual([{ charm: "Enflame", level: 3, creature: "Cursed Book" }]);
  });

  it("não preenche se a criatura lembrada não foi morta nesta sessão", () => {
    expect(prefillCharms([], ["Enflame"], ["Squid Warden"], memory)).toBeNull();
  });

  it("não mexe em charm que a pessoa já escolheu ou desmarcou", () => {
    const cur = [{ charm: "Enflame", level: 2 as const, creature: null }];
    expect(prefillCharms(cur, ["Enflame"], ["Cursed Book"], memory)).toBeNull();
  });

  it("troca de criatura vira a nova lembrada; desmarcar esquece", () => {
    const next = updateMemory(memory, [
      { charm: "Enflame", level: 2, creature: "Biting Book" },
      { charm: "Zap", level: 1, creature: null },
    ]);
    expect(next).toEqual({ Enflame: { creature: "Biting Book", level: 2 } });
  });
});
