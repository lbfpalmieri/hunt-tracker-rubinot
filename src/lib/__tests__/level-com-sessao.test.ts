import { describe, expect, it } from "vitest";
import { levelToSaveWithSession, suggestedSessionLevel } from "../level";
import { EMPTY_SETUP, syncSetupWheelLevel } from "../session-setup";
import { emptyWheel } from "../wheel";

// Nova sessão → passo Finalizar: o level ajustado ali (ou subido na roda do setup) tem que chegar
// no personagem ao salvar a sessão, não ficar só na sessão.
describe("suggestedSessionLevel", () => {
  it("sem roda, mostra o level atual do personagem", () => {
    expect(suggestedSessionLevel(300, undefined)).toBe(300);
    expect(suggestedSessionLevel(300, null)).toBe(300);
    expect(suggestedSessionLevel(null, null)).toBeNull();
  });

  it("roda com level maior que o atual vira a sugestão", () => {
    expect(suggestedSessionLevel(300, 305)).toBe(305);
  });

  it("roda com level menor ou igual não baixa o level do personagem", () => {
    expect(suggestedSessionLevel(300, 250)).toBe(300);
    expect(suggestedSessionLevel(300, 300)).toBe(300);
  });

  it("personagem sem level registrado usa o da roda", () => {
    expect(suggestedSessionLevel(null, 420)).toBe(420);
  });

  it("ignora level de roda zerado ou negativo", () => {
    expect(suggestedSessionLevel(300, 0)).toBe(300);
    expect(suggestedSessionLevel(null, -5)).toBeNull();
  });
});

describe("levelToSaveWithSession", () => {
  it("level diferente do atual é gravado", () => {
    expect(levelToSaveWithSession("305", 300)).toBe(305);
    expect(levelToSaveWithSession(" 298 ", 300)).toBe(298);
  });

  it("igual ao atual não grava nada (não cria registro repetido)", () => {
    expect(levelToSaveWithSession("300", 300)).toBeNull();
  });

  it("primeiro level do personagem é gravado", () => {
    expect(levelToSaveWithSession("150", null)).toBe(150);
  });

  it("vazio, zero ou texto inválido não grava", () => {
    expect(levelToSaveWithSession("", 300)).toBeNull();
    expect(levelToSaveWithSession("0", 300)).toBeNull();
    expect(levelToSaveWithSession("abc", 300)).toBeNull();
    expect(levelToSaveWithSession("30.5", 300)).toBeNull();
  });

  it("level vindo da roda chega no personagem e na roda salva da sessão", () => {
    const setup = { ...EMPTY_SETUP, wheel: emptyWheel("knight", 305) };
    const suggested = suggestedSessionLevel(300, setup.wheel.level);
    const toSave = levelToSaveWithSession(String(suggested), 300);
    expect(toSave).toBe(305);
    expect(syncSetupWheelLevel(setup, toSave).wheel?.level).toBe(305);
  });
});
