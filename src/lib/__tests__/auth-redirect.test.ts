import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../auth-redirect";

describe("destino depois do login", () => {
  it("volta pra página do app que a pessoa tentou abrir, com filtros e âncora", () => {
    expect(safeRedirectPath("/tools/linked-tasks")).toBe("/tools/linked-tasks");
    expect(safeRedirectPath("/sessions?page=2#topo")).toBe("/sessions?page=2#topo");
  });

  it("não deixa o link de login mandar a pessoa pra outro site", () => {
    for (const evil of [
      "//evil.com",
      "//evil.com/tools/linked-tasks",
      "/\\evil.com",
      "\\\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "evil.com/dashboard",
      "/\tevil",
    ]) {
      expect(safeRedirectPath(evil), evil).toBeUndefined();
    }
  });

  it("ignora destino vazio, gigante ou que não é texto", () => {
    expect(safeRedirectPath("")).toBeUndefined();
    expect(safeRedirectPath("   ")).toBeUndefined();
    expect(safeRedirectPath(undefined)).toBeUndefined();
    expect(safeRedirectPath(42)).toBeUndefined();
    expect(safeRedirectPath("/" + "a".repeat(600))).toBeUndefined();
  });

  it("não volta pra landing nem pro próprio login (evita ficar em círculo)", () => {
    expect(safeRedirectPath("/")).toBeUndefined();
    expect(safeRedirectPath("/auth")).toBeUndefined();
    expect(safeRedirectPath("/auth?redirect=/dashboard")).toBeUndefined();
  });
});
