import { describe, expect, it } from "vitest";
import {
  daysToComplete,
  goalFromForm,
  goalMissing,
  goalToForm,
  parseGoalTarget,
  splitGoals,
  type GoalLike,
} from "../goals";

// Meu rendimento → Objetivos: criar/editar (nome, valor, moeda, imagem) e a lista de conquistados.
function goal(p: Partial<GoalLike>): GoalLike {
  return {
    id: "g",
    name: "Boots of Haste",
    targetAmount: 2_000_000,
    createdAt: "2026-10-01T12:00:00Z",
    isMain: false,
    completedAt: null,
    ...p,
  };
}

describe("formulário do objetivo", () => {
  it("valor alvo aceita separador de milhar", () => {
    expect(parseGoalTarget("2.000.000")).toBe(2_000_000);
    expect(parseGoalTarget("2,500,000")).toBe(2_500_000);
    expect(parseGoalTarget(" 750 000 ")).toBe(750_000);
  });

  it("valor vazio, zero ou texto não vale", () => {
    expect(parseGoalTarget("")).toBeNull();
    expect(parseGoalTarget("0")).toBeNull();
    expect(parseGoalTarget("abc")).toBeNull();
  });

  it("goalFromForm limpa o nome e usa Gold quando a moeda fica vazia", () => {
    expect(goalFromForm({ name: "  Boots  ", target: "2.000.000", currency: " ", imageUrl: null })).toEqual({
      name: "Boots",
      targetAmount: 2_000_000,
      currencyLabel: "Gold",
      imageUrl: null,
    });
  });

  it("sem nome ou sem valor = não dá pra salvar", () => {
    expect(goalFromForm({ name: " ", target: "100", currency: "Gold", imageUrl: null })).toBeNull();
    expect(goalFromForm({ name: "Boots", target: "", currency: "Gold", imageUrl: null })).toBeNull();
  });

  it("editar: o formulário vem preenchido e salvar sem mudar devolve o mesmo objetivo", () => {
    const g = { name: "Boots", targetAmount: 2_000_000, currencyLabel: "Rubini Coins", imageUrl: "data:image/png;base64,x" };
    const form = goalToForm(g);
    expect(form).toEqual({ name: "Boots", target: "2000000", currency: "Rubini Coins", imageUrl: "data:image/png;base64,x" });
    expect(goalFromForm(form)).toEqual(g);
  });

  it("editar: trocar o valor e pôr a imagem que faltava", () => {
    const form = goalToForm({ name: "Boots", targetAmount: 2_000_000, currencyLabel: "Gold", imageUrl: null });
    expect(goalFromForm({ ...form, target: "2.400.000", imageUrl: "data:image/png;base64,y" })).toMatchObject({
      targetAmount: 2_400_000,
      imageUrl: "data:image/png;base64,y",
    });
  });
});

describe("em andamento × conquistados", () => {
  it("separa as listas: principal primeiro; conquistado mais recente primeiro", () => {
    const goals = [
      goal({ id: "velho", createdAt: "2026-09-01T00:00:00Z" }),
      goal({ id: "novo", createdAt: "2026-10-10T00:00:00Z" }),
      goal({ id: "principal", createdAt: "2026-08-01T00:00:00Z", isMain: true }),
      goal({ id: "feito-antes", completedAt: "2026-10-05T00:00:00Z" }),
      goal({ id: "feito-depois", completedAt: "2026-10-20T00:00:00Z" }),
    ];
    const { active, completed } = splitGoals(goals);
    expect(active.map((g) => g.id)).toEqual(["principal", "novo", "velho"]);
    expect(completed.map((g) => g.id)).toEqual(["feito-depois", "feito-antes"]);
  });

  it("sem objetivos = duas listas vazias", () => {
    expect(splitGoals([])).toEqual({ active: [], completed: [] });
  });

  it("dias até conquistar (mesmo dia conta 1)", () => {
    expect(daysToComplete(goal({}))).toBeNull();
    expect(daysToComplete(goal({ completedAt: "2026-10-01T15:00:00Z" }))).toBe(1);
    expect(daysToComplete(goal({ completedAt: "2026-10-11T12:00:00Z" }))).toBe(10);
    // 12 dias e uns minutos = 12, não 13
    expect(daysToComplete(goal({ completedAt: "2026-10-13T12:05:00Z" }))).toBe(12);
  });

  it("quanto falta pro valor alvo (pra confirmar antes de marcar conquistado)", () => {
    expect(goalMissing(2_000_000, 1_500_000)).toBe(500_000);
    expect(goalMissing(2_000_000, 2_500_000)).toBe(0);
    expect(goalMissing(2_000_000, -10)).toBe(2_000_000);
  });
});
