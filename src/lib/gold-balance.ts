import type { HuntSession } from "./store";
import { balanceSince } from "./performance";

/**
 * Ajuste do saldo de gold que não veio das hunts (public.gold_adjustments): positivo = entrou gold
 * (itens vendidos, gold de antes de usar o app), negativo = saiu. Gerado por "Atualizar saldo": a
 * pessoa digita quanto tem no jogo e o app grava a diferença pro saldo que ele calcula.
 */
export interface GoldAdjustment {
  id: string;
  characterId: string;
  description: string;
  amount: number;
  createdAt: string;
}

export const sumAdjustments = (list: GoldAdjustment[], characterId: string) =>
  list.filter((a) => a.characterId === characterId).reduce((t, a) => t + a.amount, 0);

/** Saldo atual do personagem: hunts − imbuements consumidos − gastos + ajustes. */
export const netGoldBalance = (p: {
  sessionsBalance: number;
  imbuementsSpent: number;
  expensesSpent: number;
  adjustments: number;
}) => p.sessionsBalance - p.imbuementsSpent - p.expensesSpent + p.adjustments;

/** Quanto ajustar pra o saldo do app virar o saldo que a pessoa vê no jogo (0 = já bate). */
export const adjustmentToReach = (gameBalance: number, appBalance: number) =>
  Math.round(gameBalance - appBalance);

/** Lê "1.500.000", "1,500,000", "1500k" ou "1.5kk" como número de gold (null = não deu pra ler). */
export function parseGold(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:[.,]\d+)*)(kk|k|m)?$/);
  if (!m) return null;
  const mult = m[2] === "kk" || m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1_000 : 1;
  let num = m[1];
  if (mult === 1) num = num.replace(/[.,]/g, "");
  else {
    // "1.5k" / "1,5kk": a última pontuação é decimal; as outras são milhar.
    const parts = num.split(/[.,]/);
    num = parts.length > 1 ? `${parts.slice(0, -1).join("")}.${parts[parts.length - 1]}` : parts[0];
  }
  const v = Number(num) * mult;
  return Number.isFinite(v) ? Math.round(v) : null;
}

/**
 * Progresso de um objetivo. O PRINCIPAL conta o saldo atual inteiro do personagem (inclusive o gold
 * de antes do objetivo e os ajustes); os outros contam só o lucro das hunts feitas depois que foram
 * criados — assim o mesmo gold não é contado duas vezes.
 */
export function goalProgress(
  goal: { characterId: string; createdAt: string; isMain: boolean },
  ctx: { sessions: HuntSession[]; netBalance: number },
): number {
  const raw = goal.isMain ? ctx.netBalance : balanceSince(ctx.sessions, goal.characterId, goal.createdAt);
  return Math.max(0, raw);
}
