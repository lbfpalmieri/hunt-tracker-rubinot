import { describe, expect, it } from "vitest";
import {
  EMPTY_SHEET,
  loyaltyBonusPct,
  loyaltyTitle,
  normalizeSheet,
  sheetFilled,
  talismanPct,
} from "../character-sheet";

describe("ficha do personagem", () => {
  it("guarda só skills, talisman e charms que o app conhece, com número válido", () => {
    const s = normalizeSheet({
      skills: { magic: "110", sword: 120.4, axe: -3, club: 9999, inventada: 50 },
      loyalty: "1500",
      talisman: { damage: 24, loot: 0, lifeLeech: "x" },
      charms: { Wound: 3, Gut: 1, Inventado: 2, Zap: 4, Freeze: "2" },
    });
    expect(s.skills).toEqual({ magic: 110, sword: 120 });
    expect(s.loyalty).toBe(1500);
    expect(s.talisman).toEqual({ damage: 24 });
    expect(s.charms).toEqual({ Wound: 3, Gut: 1 });
  });

  it("ficha vazia ou estragada vira a ficha em branco", () => {
    expect(normalizeSheet(null)).toEqual(EMPTY_SHEET);
    expect(normalizeSheet("lixo")).toEqual(EMPTY_SHEET);
    expect(sheetFilled(normalizeSheet({}))).toBe(false);
    expect(sheetFilled(normalizeSheet({ loyalty: 0 }))).toBe(true);
  });
});

describe("Bounty Talisman", () => {
  it("sobe 0,5% por nível até 10% no nível 20 e 0,25% por nível depois", () => {
    expect(talismanPct(0)).toBe(0);
    expect(talismanPct(1)).toBe(0.5);
    expect(talismanPct(20)).toBe(10);
    expect(talismanPct(24)).toBe(11);
  });
});

describe("Loyalty", () => {
  it("dá +5% de skill a cada 360 pontos, no máximo 50%", () => {
    expect(loyaltyBonusPct(359)).toBe(0);
    expect(loyaltyBonusPct(360)).toBe(5);
    expect(loyaltyBonusPct(1500)).toBe(20);
    expect(loyaltyBonusPct(99999)).toBe(50);
  });

  it("mostra o título da faixa de pontos", () => {
    expect(loyaltyTitle(49)).toBeNull();
    expect(loyaltyTitle(50)).toBe("Scout of Tibia");
    expect(loyaltyTitle(1000)).toBe("Squire of Tibia");
    expect(loyaltyTitle(7500)).toBe("Enlightened of Tibia");
  });
});
