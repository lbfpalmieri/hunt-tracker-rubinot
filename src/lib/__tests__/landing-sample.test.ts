import { describe, expect, it } from "vitest";
import { LANDING_SAMPLE_TEXT, landingSample } from "../landing-sample";
import { HUNT_TEXT } from "./fixtures";

describe("prévia da landing", () => {
  it("usa o mesmo Hunting Analyser real dos testes (nada de número inventado)", () => {
    expect(LANDING_SAMPLE_TEXT).toBe(HUNT_TEXT);
  });

  it("calcula Raw XP/h, lucro/h e monstros/h pela duração da própria sessão", () => {
    const s = landingSample();
    expect(s.durationSec).toBe(64 * 60);
    // 10.640.217 de Raw XP em 64 min = 9.975.203/h (bate com o Raw XP/h que o jogo mostra).
    expect(s.rawXpPerHour).toBe(9_975_203);
    // 2.652.135 de balance em 64 min.
    expect(s.balancePerHour).toBe(Math.round(2_652_135 / (64 / 60)));
    expect(s.kills).toBe(1809);
    expect(s.killsPerHour).toBe(Math.round(1809 / (64 / 60)));
  });

  it("mostra as criaturas mais mortas primeiro", () => {
    expect(landingSample().topKills.map((k) => k.name)).toEqual([
      "Orclops Bloodbreaker",
      "Gloom Maw",
      "Dworc Shadowstalker",
      "Norcferatu Heartless",
    ]);
  });
});
