import { describe, expect, it } from "vitest";
import {
  EMPTY_SETUP,
  SET_PARTS,
  applySet,
  applyWheel,
  normalizeSetup,
  presetPart,
  type SessionSetup,
} from "../session-setup";
import { availableSlices, emptyWheel, setSlicePoints, usedPoints, type WheelBuild } from "../wheel";
import { rowsToWheelPresets, sameWheel, suggestedWheelName } from "../wheel-presets";

/** Roda válida de knight com `fill` fatias do centro cheias. */
function wheel(fill = 1, level = 1000): WheelBuild {
  let b = emptyWheel("knight", level);
  for (let n = 0; n < fill; n++) {
    const i = [...availableSlices(b.points)].find((s) => b.points[s] === 0)!;
    const res = setSlicePoints(b, i, 9999);
    if (!res.ok) throw new Error(res.reason);
    b = res.build;
  }
  return b;
}

const setA: SessionSetup = {
  ...EMPTY_SETUP,
  weapon: "Soulcutter",
  weaponTier: 2,
  gear: { head: "Spiritthorn Helmet", armor: "Spiritthorn Armor" },
  gearTier: { head: 1 },
  stance: "Fighting",
};
const setB: SessionSetup = { ...EMPTY_SETUP, weapon: "Soulshredder", stance: "Defensive" };
const charm = { charm: "Low Blow", level: 2 as const, creature: "Rat" };

describe("set e roda são independentes", () => {
  it("o set é só equipamento + postura", () => {
    expect(SET_PARTS).toEqual(["equipment", "stance"]);
  });

  it("escolher um set troca equipamento e postura e mantém a roda e os charms", () => {
    const w = wheel(2);
    const current = applyWheel({ ...setA, charms: [charm] }, w);
    const next = applySet(current, setB);
    expect(next.weapon).toBe("Soulshredder");
    expect(next.weaponTier).toBeNull();
    expect(next.gear).toEqual({});
    expect(next.stance).toBe("Defensive");
    expect(next.wheel).toEqual(w);
    expect(next.conviction).toEqual(current.conviction);
    expect(next.revelation).toEqual(current.revelation);
    expect(next.wheelDmgHeal).toBe(current.wheelDmgHeal);
    expect(next.charms).toEqual([charm]);
  });

  it("escolher uma roda mantém o equipamento, a postura e os charms", () => {
    const next = applyWheel({ ...setA, charms: [charm] }, wheel(3));
    expect(next.weapon).toBe("Soulcutter");
    expect(next.weaponTier).toBe(2);
    expect(next.gear).toEqual(setA.gear);
    expect(next.gearTier).toEqual(setA.gearTier);
    expect(next.stance).toBe("Fighting");
    expect(next.charms).toEqual([charm]);
    expect(usedPoints(next.wheel!)).toBe(usedPoints(wheel(3)));
  });

  it("trocar de roda substitui a anterior por inteiro", () => {
    const first = applyWheel(setA, wheel(1));
    const second = applyWheel(first, wheel(4));
    expect(usedPoints(second.wheel!)).toBe(usedPoints(wheel(4)));
    expect(second.weapon).toBe("Soulcutter");
  });

  it("tirar a roda (null ou vazia) limpa os campos dela e só eles", () => {
    const withWheel = applyWheel(setA, wheel(2));
    for (const none of [null, emptyWheel("knight", 500)]) {
      const cleared = applyWheel(withWheel, none);
      expect(cleared.wheel).toBeNull();
      expect(cleared.conviction).toEqual([]);
      expect(cleared.revelation).toEqual([]);
      expect(cleared.wheelDmgHeal).toBeNull();
      expect(cleared.weapon).toBe("Soulcutter");
      expect(cleared.stance).toBe("Fighting");
    }
  });

  it("a sessão guarda uma CÓPIA: mexer na roda salva depois não muda o setup", () => {
    const saved = wheel(2);
    const setup = applyWheel(setA, saved);
    saved.points[0] = 0;
    saved.level = 1;
    expect(setup.wheel).toEqual(wheel(2));
  });

  it("tirar o set (set vazio) limpa equipamento e postura e mantém a roda", () => {
    const next = applySet(applyWheel(setA, wheel(1)), EMPTY_SETUP);
    expect(next.weapon).toBeNull();
    expect(next.gear).toEqual({});
    expect(next.stance).toBeNull();
    expect(next.wheel).toEqual(wheel(1));
  });
});

describe("presetPart — o que é salvo/lido como set", () => {
  it("tira a roda (e os campos calculados dela) e os charms", () => {
    const full = applyWheel({ ...setA, charms: [charm] }, wheel(2));
    const part = presetPart(full);
    expect(part.wheel).toBeNull();
    expect(part.conviction).toEqual([]);
    expect(part.revelation).toEqual([]);
    expect(part.wheelDmgHeal).toBeNull();
    expect(part.charms).toEqual([]);
    expect(part.weapon).toBe("Soulcutter");
    expect(part.stance).toBe("Fighting");
  });

  it("set antigo (com roda no jsonb) é lido sem a roda", () => {
    const stored = JSON.parse(JSON.stringify(applyWheel(setA, wheel(2))));
    const read = normalizeSetup(presetPart(normalizeSetup(stored)!));
    expect(read?.weapon).toBe("Soulcutter");
    expect(read?.wheel ?? null).toBeNull();
    expect(read?.conviction).toEqual([]);
  });

  it("set antigo que só tinha roda deixa de existir como set", () => {
    const onlyWheel = JSON.parse(JSON.stringify(applyWheel(EMPTY_SETUP, wheel(2))));
    expect(normalizeSetup(presetPart(normalizeSetup(onlyWheel)!))).toBeNull();
  });
});

describe("rodas salvas", () => {
  it("sameWheel compara o conteúdo (a sessão guarda cópia)", () => {
    expect(sameWheel(wheel(2), JSON.parse(JSON.stringify(wheel(2))))).toBe(true);
    expect(sameWheel(wheel(2), wheel(3))).toBe(false);
    expect(sameWheel(wheel(2), wheel(2, 900))).toBe(false);
    expect(sameWheel(null, wheel(2))).toBe(false);
    expect(sameWheel(null, null)).toBe(false);
  });

  it("rowsToWheelPresets descarta linhas que não são roda válida", () => {
    const rows = [
      { id: "1", name: "Dano", wheel: JSON.parse(JSON.stringify(wheel(2))) },
      { id: "2", name: "Quebrada", wheel: { voc: "knight" } },
      { id: "3", name: "Lixo", wheel: "x" },
      { name: "Sem id", wheel: wheel(1) },
    ];
    const out = rowsToWheelPresets(rows);
    expect(out.map((p) => p.name)).toEqual(["Dano"]);
    expect(out[0].wheel).toEqual(wheel(2));
    expect(rowsToWheelPresets(null)).toEqual([]);
  });

  it("suggestedWheelName não repete nome", () => {
    expect(suggestedWheelName([])).toBe("Roda");
    expect(suggestedWheelName([{ name: "roda" }])).toBe("Roda 2");
    expect(suggestedWheelName([{ name: "Roda" }, { name: " Roda 2 " }, { name: "Outra" }])).toBe("Roda 3");
  });
});
