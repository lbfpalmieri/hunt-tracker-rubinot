import { describe, expect, it } from "vitest";
import { buildSessionRows, csvCell, sessionsToCsv, sessionsToJson } from "../sessions-export";
import { makeSession } from "./fixtures";

const chars = [{ id: "char-1", name: "Sir Test", vocation: "Elite Knight" }];
const HOUR = 3600;

describe("exportar todas as sessões", () => {
  it("calcula o /h pela duração da própria sessão", () => {
    const [row] = buildSessionRows(
      [makeSession({ hunting: { durationSec: 2 * HOUR, balance: 1_000_000, rawXp: 4_000_000 } })],
      chars,
    );
    expect(row.balancePerHour).toBe(500_000);
    expect(row.rawXpPerHour).toBe(2_000_000);
    expect(row.durationMin).toBe(120);
    expect(row.character).toBe("Sir Test");
  });

  it("sessão de grupo sem Hunting Analyser fica sem XP (vazio), não zero", () => {
    const [row] = buildSessionRows(
      [
        makeSession({
          party: { size: 2, members: null, self: null, personal: null, noHuntingAnalyser: true },
        }),
      ],
      chars,
    );
    expect(row.mode).toBe("grupo");
    expect(row.rawXp).toBeNull();
    expect(sessionsToCsv([row]).split("\r\n")[1]).toContain(";;");
  });

  it("ordena da mais recente pra mais antiga", () => {
    const rows = buildSessionRows(
      [
        makeSession({ createdAt: "2026-10-01T10:00:00Z", huntName: "Antiga" }),
        makeSession({ createdAt: "2026-10-09T10:00:00Z", huntName: "Nova" }),
      ],
      chars,
    );
    expect(rows.map((r) => r.hunt)).toEqual(["Nova", "Antiga"]);
  });

  it("CSV: separa por ponto e vírgula, escapa aspas e não vira fórmula na planilha", () => {
    expect(csvCell('Asura; "norte"')).toBe('"Asura; ""norte"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(null)).toBe("");
    expect(csvCell(true)).toBe("sim");
    const csv = sessionsToCsv(buildSessionRows([makeSession()], chars));
    expect(csv.startsWith("﻿Data;Hunt;Personagem")).toBe(true);
    expect(csv.trim().split("\r\n")).toHaveLength(2);
  });

  it("JSON traz todas as sessões e nenhuma observação privada", () => {
    const json = sessionsToJson(
      buildSessionRows([makeSession({ notes: "segredo da hunt" })], chars),
    );
    expect(JSON.parse(json).sessions).toHaveLength(1);
    expect(json).not.toContain("segredo da hunt");
  });
});
