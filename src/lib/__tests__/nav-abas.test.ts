import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NAV_ITEMS,
  findNavItem,
  isItemActive,
  navItemForPath,
  navTabs,
  navTarget,
  rememberTab,
} from "../nav-items";

afterEach(() => vi.unstubAllGlobals());

function fakeStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  });
}

describe("menu com abas (Rendimento e Calculadoras)", () => {
  it("cada par de páginas virou um item só no menu", () => {
    const ids = NAV_ITEMS.map((n) => n.id) as string[];
    expect(ids).not.toContain("overview");
    expect(ids).not.toContain("rubini-coins");
    expect(navTabs(findNavItem("rendimento")!).map((t) => t.to)).toEqual(["/rendimento", "/overview"]);
    expect(navTabs(findNavItem("monster-calc")!).map((t) => t.to)).toEqual([
      "/tools/monster-calculator",
      "/tools/rubini-coins",
    ]);
  });

  it("os endereços antigos continuam acendendo o item certo do menu", () => {
    expect(navItemForPath("/overview")?.id).toBe("rendimento");
    expect(navItemForPath("/tools/rubini-coins")?.id).toBe("monster-calc");
    expect(isItemActive("/rendimento", findNavItem("rendimento")!)).toBe(true);
    expect(isItemActive("/sessions", findNavItem("rendimento")!)).toBe(false);
  });

  it("o menu abre na última aba usada, e na primeira se nunca usou", () => {
    fakeStorage();
    const item = findNavItem("rendimento")!;
    expect(navTarget(item)).toBe("/rendimento");
    rememberTab("rendimento", "/overview");
    expect(navTarget(item)).toBe("/overview");
  });

  it("aba lembrada que não existe mais é ignorada", () => {
    fakeStorage();
    rememberTab("rendimento", "/rota-velha");
    expect(navTarget(findNavItem("rendimento")!)).toBe("/rendimento");
  });

  it("item sem abas leva direto pra própria página", () => {
    expect(navTarget(findNavItem("dashboard")!)).toBe("/dashboard");
  });
});
