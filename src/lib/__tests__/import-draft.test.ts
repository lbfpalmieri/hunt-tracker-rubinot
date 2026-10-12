import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_DRAFT,
  clearImportDraft,
  loadImportDraft,
  resetImportDraftMemory,
  saveImportDraft,
} from "../import-draft";
import { HUNT_TEXT } from "./fixtures";

beforeEach(() => {
  resetImportDraftMemory();
  clearImportDraft();
  resetImportDraftMemory();
});

describe("rascunho da Nova sessão", () => {
  it("começa vazio quando nada foi colado", () => {
    expect(loadImportDraft()).toEqual(EMPTY_DRAFT);
  });

  it("mantém o analyser colado ao voltar pra tela", () => {
    saveImportDraft({ ...EMPTY_DRAFT, hunting: HUNT_TEXT, huntQuery: "Cyclops" });
    const d = loadImportDraft();
    expect(d.hunting).toBe(HUNT_TEXT);
    expect(d.huntQuery).toBe("Cyclops");
  });

  it("sobrevive a recarregar a aba (sessionStorage)", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    });
    saveImportDraft({ ...EMPTY_DRAFT, hunting: HUNT_TEXT });
    resetImportDraftMemory();
    expect(loadImportDraft().hunting).toBe(HUNT_TEXT);
    vi.unstubAllGlobals();
  });

  it("limpa tudo depois de salvar a sessão", () => {
    saveImportDraft({ ...EMPTY_DRAFT, hunting: HUNT_TEXT });
    clearImportDraft();
    resetImportDraftMemory();
    expect(loadImportDraft()).toEqual(EMPTY_DRAFT);
  });
});
