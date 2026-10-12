import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TUTORIALS,
  hideTutorial,
  isTutorialHidden,
  resetTutorials,
  shouldAutoOpen,
  skipTutorial,
  tutorialFor,
} from "../page-tutorials";
import { NAV_ITEMS } from "../nav-items";

function fakeStorages() {
  const mk = () => {
    const d = new Map<string, string>();
    return { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v) };
  };
  vi.stubGlobal("localStorage", mk());
  vi.stubGlobal("sessionStorage", mk());
}
afterEach(() => vi.unstubAllGlobals());

describe("tutorial de cada página", () => {
  it("cada página do menu (exceto as públicas) tem tutorial", () => {
    const semTutorial = ["community", "compare", "wiki", "about"]; // públicas ou de leitura
    for (const n of NAV_ITEMS) {
      if (semTutorial.includes(n.id)) continue;
      expect(tutorialFor(n.to), n.to).not.toBeNull();
    }
  });

  it("as duas abas de uma página dividem o mesmo tutorial; página interna e pública não têm", () => {
    expect(tutorialFor("/rendimento")?.key).toBe(tutorialFor("/overview")?.key);
    expect(tutorialFor("/tools/rubini-coins")?.key).toBe("calculadoras");
    expect(tutorialFor("/sessions/abc")).toBeNull();
    expect(tutorialFor("/community")).toBeNull();
  });

  it("todo tutorial tem passos com título e texto", () => {
    for (const t of TUTORIALS) {
      expect(t.steps.length, t.key).toBeGreaterThan(0);
      for (const s of t.steps) {
        expect(s.title.trim()).not.toBe("");
        expect(s.text.trim()).not.toBe("");
      }
    }
  });
});

describe("não mostrar de novo e pular", () => {
  it("abre sozinho na primeira visita", () => {
    fakeStorages();
    expect(shouldAutoOpen("import")).toBe(true);
  });

  it("'não mostrar de novo' vale por página e continua nas próximas visitas", () => {
    fakeStorages();
    hideTutorial("import");
    expect(isTutorialHidden("import")).toBe(true);
    expect(shouldAutoOpen("import")).toBe(false);
    expect(shouldAutoOpen("sessions")).toBe(true);
  });

  it("'pular' esconde só nesta visita (não grava o não mostrar de novo)", () => {
    fakeStorages();
    skipTutorial("sessions");
    expect(shouldAutoOpen("sessions")).toBe(false);
    expect(isTutorialHidden("sessions")).toBe(false);
  });

  it("reativar os tutoriais traz todos de volta", () => {
    fakeStorages();
    hideTutorial("import");
    skipTutorial("sessions");
    resetTutorials();
    expect(shouldAutoOpen("import")).toBe(true);
    expect(shouldAutoOpen("sessions")).toBe(true);
  });
});
