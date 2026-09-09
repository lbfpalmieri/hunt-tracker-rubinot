import type { Character, HuntSession, Imbuement, Expense, LevelSnapshot } from "./store";
import { aggregateSessions, type PerformanceAgg } from "./performance";
import { aggregateImbuements } from "./imbuements";
import { currentLevel } from "./level";

/**
 * Resumo de um personagem pra tela "Todos os personagens" — reaproveita
 * exatamente as mesmas fórmulas do Dashboard (aggregateSessions,
 * aggregateImbuements) pra cada personagem individualmente, então os
 * números aqui sempre batem com o que aparece quando você troca o
 * personagem ativo.
 */
export interface CharacterOverview {
  character: Character;
  agg: PerformanceAgg;
  imbSpent: number;
  expensesSpent: number;
  /** Balance − imbuements consumidos − gastos registrados. */
  netBalance: number;
  level: number | null;
}

export function buildAccountOverview(
  characters: Character[],
  sessions: HuntSession[],
  imbuements: Imbuement[],
  expenses: Expense[],
  levelSnapshots: LevelSnapshot[],
): CharacterOverview[] {
  return characters.map((c) => {
    const charSessions = sessions.filter((s) => s.characterId === c.id);
    const agg = aggregateSessions(charSessions);
    const imbSpent = aggregateImbuements(imbuements, sessions, c.id).totalSpent;
    const expensesSpent = expenses
      .filter((e) => e.characterId === c.id)
      .reduce((a, e) => a + e.amount, 0);
    return {
      character: c,
      agg,
      imbSpent,
      expensesSpent,
      netBalance: agg.balance - imbSpent - expensesSpent,
      level: currentLevel(levelSnapshots, c.id),
    };
  });
}
