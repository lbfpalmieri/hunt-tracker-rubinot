/**
 * Resistência elemental de um monstro, do jeito que a Infobox_Criatura da
 * TibiaWiki guarda ("fireDmgMod = 0%" → { fire: 0 }). 100 = dano normal,
 * abaixo de 100 = resistente, acima de 100 = fraco (toma mais dano).
 */
export interface ElementMods {
  physical?: number;
  earth?: number;
  fire?: number;
  death?: number;
  energy?: number;
  holy?: number;
  ice?: number;
  drown?: number;
  lifedrain?: number;
  manadrain?: number;
}

/** Só os elementos que fazem sentido como "escolha de arma/imbuement". */
export const RECOMMENDABLE_ELEMENTS: (keyof ElementMods)[] = [
  "physical",
  "earth",
  "fire",
  "death",
  "energy",
  "holy",
  "ice",
];

export interface ElementRanking {
  element: keyof ElementMods;
  /** Média de dano tomado (100 = normal), ponderada pelo nº de kills de cada monstro. */
  avgMod: number;
  /** Quantos dos monstros considerados tinham esse dado na wiki. */
  monstersCounted: number;
}

/**
 * Rankeia os elementos por quanto dano em média os monstros da hunt tomam
 * dele (ponderado por kills — um monstro matado 300x pesa mais que um
 * matado 5x). O primeiro da lista é o "mais forte contra a hunt".
 * `weaknesses[name] == null` (nome não encontrado na wiki) simplesmente não
 * entra na conta, sem quebrar o resto.
 */
export function rankElementsAgainstHunt(
  kills: { name: string; count: number }[],
  weaknesses: Record<string, ElementMods | null | undefined>,
): ElementRanking[] {
  const sums = new Map<keyof ElementMods, { weighted: number; weight: number; count: number }>();
  for (const k of kills) {
    const mods = weaknesses[k.name];
    if (!mods || k.count <= 0) continue;
    for (const el of RECOMMENDABLE_ELEMENTS) {
      const v = mods[el];
      if (v == null) continue;
      const cur = sums.get(el) ?? { weighted: 0, weight: 0, count: 0 };
      cur.weighted += v * k.count;
      cur.weight += k.count;
      cur.count += 1;
      sums.set(el, cur);
    }
  }
  return Array.from(sums, ([element, s]) => ({
    element,
    avgMod: s.weight > 0 ? s.weighted / s.weight : 0,
    monstersCounted: s.count,
  })).sort((a, b) => b.avgMod - a.avgMod);
}
