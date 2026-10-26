import { describe, expect, it } from "vitest";
import { DETAIL_COLUMNS, LIST_COLUMNS, publicParty } from "../community-public";
import { canonicalizeHuntRows } from "../hunt-suggest";
import { rankElementsAgainstHunt } from "../monster-weakness";

describe("Comunidade: o que é público", () => {
  it("party pública mostra só tamanho e divisão — nunca os nomes dos membros", () => {
    const raw = {
      size: 3,
      self: "Meu Char",
      members: [
        { name: "Meu Char", leader: true, loot: 100, supplies: 10, balance: 90 },
        { name: "Fulano Secreto", loot: 50, supplies: 5, balance: 45 },
        { name: "Ciclano Secreto", loot: 50, supplies: 5, balance: 45 },
      ],
      splitterTransfers: [{ from: "Fulano Secreto", to: "Meu Char", amount: 10 }],
      personal: { loot: 100, balance: 90 },
    };
    const pub = publicParty(raw);
    expect(pub).not.toBeNull();
    expect(Object.keys(pub!).sort()).toEqual(["noXp", "size", "split"]);
    expect(pub!.size).toBe(3);
    const json = JSON.stringify(pub);
    for (const name of ["Meu Char", "Fulano", "Ciclano"]) expect(json).not.toContain(name);
  });

  it("sessão de grupo sem o Hunting Analyser pessoal aparece como sem XP", () => {
    expect(publicParty({ size: 2, noHuntingAnalyser: true })?.noXp).toBe(true);
  });

  it("sem party = null", () => {
    expect(publicParty(null)).toBeNull();
    expect(publicParty({ size: 1 })).toBeNull();
  });

  it("colunas públicas não incluem dono, observações nem e-mail", () => {
    for (const cols of [LIST_COLUMNS, DETAIL_COLUMNS]) {
      const list = cols.split(",").map((c) => c.trim());
      for (const banned of ["user_id", "character_id", "notes", "email", "is_public", "*"])
        expect(list).not.toContain(banned);
    }
  });
});

describe("nomes de hunt da comunidade", () => {
  const rows = (names: string[]) => names.map((huntName, i) => ({ id: i, huntName }));

  it("corrige typo e grafia pela forma mais usada, e marca andar improvável", () => {
    const input = rows([
      "Plague Seal -1",
      "Plague Seal -1",
      "plague  seal -1",
      "Plague Seal -2",
      "Plague Seal -2",
      "Plague Seal -2",
      "Plage Seal -3",
    ]);
    const { rows: out, suspicious } = canonicalizeHuntRows(input);
    expect(out.map((r) => r.huntName)).toEqual([
      "Plague Seal -1",
      "Plague Seal -1",
      "Plague Seal -1",
      "Plague Seal -2",
      "Plague Seal -2",
      "Plague Seal -2",
      "Plague Seal -3",
    ]);
    expect(suspicious.has("plague seal -3")).toBe(true);
    expect(suspicious.has("plague seal -1")).toBe(false);
    expect(out[0]).toBe(input[0]);
  });

  it("nomes diferentes de verdade continuam separados", () => {
    const { rows: out, suspicious } = canonicalizeHuntRows(rows(["Ingol", "Ingol", "Gloom Maw"]));
    expect(out.map((r) => r.huntName)).toEqual(["Ingol", "Ingol", "Gloom Maw"]);
    expect(suspicious.size).toBe(0);
  });
});

describe("elemento mais eficaz contra a hunt", () => {
  it("média ponderada por kills; monstro desconhecido não conta", () => {
    const rank = rankElementsAgainstHunt(
      [
        { name: "A", count: 300 },
        { name: "B", count: 100 },
        { name: "Desconhecido", count: 999 },
        { name: "C", count: 0 },
      ],
      {
        A: { fire: 120, ice: 80 },
        B: { fire: 80, ice: 120 },
        C: { ice: 500 },
        Desconhecido: null,
      },
    );
    expect(rank[0]).toEqual({ element: "fire", avgMod: 110, monstersCounted: 2 });
    expect(rank[1]).toEqual({ element: "ice", avgMod: 90, monstersCounted: 2 });
  });
});
