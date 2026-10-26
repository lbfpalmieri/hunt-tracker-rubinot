/**
 * Objetivos (Meu rendimento → Objetivos): regras do formulário de criar/editar e da lista de
 * conquistados. O progresso em si fica em gold-balance.ts (goalProgress).
 */

export interface GoalLike {
  id: string;
  name: string;
  targetAmount: number;
  createdAt: string;
  isMain: boolean;
  /** Quando foi marcado como conquistado (null = em andamento). */
  completedAt: string | null;
}

export interface GoalForm {
  name: string;
  /** Texto do campo "Valor alvo" ("2.000.000", "2000000"). */
  target: string;
  currency: string;
  imageUrl: string | null;
}

/** Valor alvo digitado → número inteiro (pontos/vírgulas/espaços são separador de milhar). */
export function parseGoalTarget(text: string): number | null {
  const n = Number(text.replace(/[.,\s]/g, ""));
  return text.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Campos do objetivo a salvar, ou null quando o formulário ainda não está válido. */
export function goalFromForm(
  form: GoalForm,
): { name: string; targetAmount: number; currencyLabel: string; imageUrl: string | null } | null {
  const name = form.name.trim();
  const targetAmount = parseGoalTarget(form.target);
  if (!name || targetAmount == null) return null;
  return { name, targetAmount, currencyLabel: form.currency.trim() || "Gold", imageUrl: form.imageUrl };
}

/** Formulário de edição já preenchido com o objetivo. */
export function goalToForm(goal: {
  name: string;
  targetAmount: number;
  currencyLabel: string;
  imageUrl: string | null;
}): GoalForm {
  return {
    name: goal.name,
    target: String(goal.targetAmount),
    currency: goal.currencyLabel,
    imageUrl: goal.imageUrl,
  };
}

/**
 * Em andamento (principal primeiro, depois os mais novos) e conquistados (o mais recente primeiro).
 */
export function splitGoals<T extends GoalLike>(goals: T[]): { active: T[]; completed: T[] } {
  const active = goals
    .filter((g) => !g.completedAt)
    .sort((a, b) => Number(b.isMain) - Number(a.isMain) || b.createdAt.localeCompare(a.createdAt));
  const completed = goals
    .filter((g) => g.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
  return { active, completed };
}

/** Dias entre criar e conquistar o objetivo (mínimo 1 — conquistado no mesmo dia = 1 dia). */
export function daysToComplete(goal: Pick<GoalLike, "createdAt" | "completedAt">): number | null {
  if (!goal.completedAt) return null;
  const ms = new Date(goal.completedAt).getTime() - new Date(goal.createdAt).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

/** Quanto ainda falta pro valor alvo (0 = já chegou). */
export function goalMissing(targetAmount: number, progress: number): number {
  return Math.max(0, targetAmount - Math.max(0, progress));
}
