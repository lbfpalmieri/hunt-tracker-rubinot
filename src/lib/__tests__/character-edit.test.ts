import { describe, expect, it } from "vitest";
import { buildCharacterPatch, nameTaken } from "../character-edit";

const atual = { name: "Sir Test", vocation: "Elite Knight", world: "Rubinera" };

describe("editar personagem", () => {
  it("devolve só o que mudou", () => {
    const r = buildCharacterPatch(atual, { ...atual, world: "Outro Mundo" });
    expect(r).toEqual({ status: "ok", patch: { world: "Outro Mundo" } });
  });

  it("troca de vocação e de nome ao mesmo tempo, limpando espaços", () => {
    const r = buildCharacterPatch(atual, {
      name: "  Sir   Novo ",
      vocation: "Royal Paladin",
      world: "Rubinera",
    });
    expect(r).toEqual({ status: "ok", patch: { name: "Sir Novo", vocation: "Royal Paladin" } });
  });

  it("não salva quando nada mudou", () => {
    expect(buildCharacterPatch(atual, atual)).toEqual({ status: "nada-mudou" });
  });

  it("não aceita nome nem mundo vazios", () => {
    expect(buildCharacterPatch(atual, { ...atual, name: "  " }).status).toBe("erro");
    expect(buildCharacterPatch(atual, { ...atual, world: "" }).status).toBe("erro");
  });

  it("avisa quando outro personagem seu já tem o nome, sem contar ele mesmo", () => {
    const lista = [
      { id: "a", name: "Sir Test" },
      { id: "b", name: "Outro Char" },
    ];
    expect(nameTaken(lista, "a", "sir test")).toBe(false);
    expect(nameTaken(lista, "a", " outro char ")).toBe(true);
  });
});
