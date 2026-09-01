import { fmtDay } from "./period";

/**
 * Marcos de balanceamento do RubinOT (nerfs/buffs) que mudam o "ground
 * truth" de quanto gold/xp uma hunt rende. Sessões de antes de um marco não
 * são comparáveis com sessões de depois — misturar as duas na mesma média
 * (Ranking, Comparar hunts, Top spot do Dashboard) produz um número sem
 * sentido. Ver [[MEMORY.md]] / conversa que originou isso: nerf geral de
 * Gold Coin em 01/09/2026.
 *
 * Cadastre um novo marco aqui sempre que a RubinOT mudar o balanceamento de
 * loot/xp de forma abrangente — o resto do app já reage automaticamente
 * (usa sempre o marco mais recente).
 */
export interface BalancePatch {
  id: string;
  label: string;
  /** Data (YYYY-MM-DD) em que o marco entrou em vigor, início do dia local. */
  date: string;
  description: string;
  /** Texto completo do aviso global (banner) mostrado uma vez por usuário/dispositivo. */
  announcement: string;
}

export const BALANCE_PATCHES: BalancePatch[] = [
  {
    id: "gold-nerf-2026-09",
    label: "Nerf de Gold Coin",
    date: "2026-09-01",
    description: "Redução geral na quantidade de Gold Coin (e outros itens) dropados por monstros no RubinOT.",
    announcement:
      "Rolou um ajuste geral na economia do RubinOT: a quantidade de Gold Coin (e outras coisas) que os " +
      "monstros soltam mudou. Os números que o sistema media antes disso não valem mais pra comparar com hoje " +
      "— por isso, a partir de agora, médias e rankings voltam a ser contados do zero. Nada foi apagado: as " +
      "sessões antigas continuam salvas, disponíveis pra consulta, e você ainda pode comparar uma hunt de " +
      "antes com uma de depois se quiser ver a diferença na prática.",
  },
];

export function latestPatch(): BalancePatch | null {
  return BALANCE_PATCHES.length ? BALANCE_PATCHES[BALANCE_PATCHES.length - 1] : null;
}

function patchCutoff(patch: BalancePatch): Date {
  const [y, m, d] = patch.date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * Data do marco formatada em pt-BR ("01 de set."), sem hora. Constrói a data
 * localmente a partir de Y-M-D em vez de `new Date(patch.date)` — passar
 * "YYYY-MM-DD" puro pro construtor Date é interpretado como UTC meia-noite,
 * o que pode mostrar o dia errado dependendo do fuso do navegador.
 */
export function formatPatchDate(patch: BalancePatch): string {
  return fmtDay(patchCutoff(patch));
}

export function isPrePatch(createdAt: string, patch: BalancePatch = latestPatch()!): boolean {
  if (!patch) return false;
  return new Date(createdAt) < patchCutoff(patch);
}

/**
 * Filtra uma lista pra fora dados de antes do marco mais recente, a menos
 * que `includePrePatch` esteja ligado. Espelha o mesmo padrão de
 * `filterByBonusInclusion`/`isHuntValid` em lib/compare.ts.
 */
export function filterByLatestPatch<T>(
  items: T[],
  getCreatedAt: (item: T) => string,
  includePrePatch: boolean,
): T[] {
  const patch = latestPatch();
  if (!patch || includePrePatch) return items;
  const cutoff = patchCutoff(patch);
  return items.filter((item) => new Date(getCreatedAt(item)) >= cutoff);
}
