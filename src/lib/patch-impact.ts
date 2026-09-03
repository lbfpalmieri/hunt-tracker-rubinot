import type { CompareHunt } from "./compare";
import { perHour } from "./compare";
import { isPrePatch, latestPatch, type BalancePatch } from "./patches";

/**
 * "Antes x depois do balanceamento": pega as sessões brutas de uma hunt,
 * separa pelas datas do marco mais recente (lib/patches.ts) e mostra em
 * porcentagem o quanto cada métrica por hora subiu ou caiu.
 *
 * De propósito nada aqui é fixo no nerf de Gold Coin: a comparação sempre usa
 * `latestPatch()`. Quando um novo marco entrar em BALANCE_PATCHES, o painel
 * passa a medir o impacto do marco novo automaticamente, e quando não houver
 * dado nos dois lados o painel simplesmente não aparece — é informação extra,
 * não uma seção permanente da tela.
 */

export interface PatchMetricDelta {
  label: string;
  /** Média por hora das sessões de antes do marco. */
  before: number;
  /** Média por hora das sessões de depois do marco. */
  after: number;
  /** Variação percentual (positivo = subiu depois do marco). */
  pct: number;
  /** Em quais métricas "cair" é bom (supplies). */
  lowerIsBetter?: boolean;
}

export interface HuntPatchImpact {
  huntName: string;
  beforeSessions: number;
  afterSessions: number;
  beforeDurationSec: number;
  afterDurationSec: number;
  deltas: PatchMetricDelta[];
}

interface MetricDef {
  label: string;
  value: (h: CompareHunt) => number | null;
  lowerIsBetter?: boolean;
}

const METRICS: MetricDef[] = [
  { label: "Raw XP (sem bounty)", value: (h) => h.rawXpHunt ?? h.rawXpTotal },
  { label: "Lucro", value: (h) => h.balance },
  { label: "Loot", value: (h) => h.loot },
  { label: "Supplies", value: (h) => h.supplies, lowerIsBetter: true },
  { label: "Kills", value: (h) => h.killsTotal },
  { label: "Dano causado", value: (h) => h.damageDealt },
  { label: "Cura", value: (h) => h.healing },
  { label: "Dano recebido", value: (h) => h.damageReceived, lowerIsBetter: true },
];

/**
 * Piso de tempo caçado em cada lado do marco. Uma sessão de 5 min projetada
 * pra 1h viraria um "-70% de loot" que não existe — sem esse piso o painel
 * mentiria com facilidade.
 */
export const MIN_SIDE_DURATION_SEC = 20 * 60;

/** Abaixo disso a variação é ruído (flutuação normal de loot), não nerf/buff. */
export const MIN_RELEVANT_PCT = 3;

const sameHunt = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function ratePerHour(sessions: CompareHunt[], metric: MetricDef): number | null {
  const totalDuration = sessions.reduce((a, s) => a + s.durationSec, 0);
  if (totalDuration <= 0) return null;
  let total = 0;
  let any = false;
  for (const s of sessions) {
    const v = metric.value(s);
    if (v == null) continue;
    any = true;
    total += v;
  }
  if (!any) return null;
  return perHour(total, totalDuration);
}

/**
 * Impacto do marco em cada hunt selecionada. `pool` são as sessões brutas
 * (não agregadas) da mesma fonte da comparação — próprias ou da comunidade.
 */
export function patchImpactFor(
  pool: CompareHunt[],
  huntNames: string[],
  patch: BalancePatch | null = latestPatch(),
): HuntPatchImpact[] {
  if (!patch) return [];
  const out: HuntPatchImpact[] = [];
  const seen = new Set<string>();

  for (const name of huntNames) {
    const slug = name.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const sessions = pool.filter((h) => sameHunt(h.huntName, name));
    const before = sessions.filter((h) => isPrePatch(h.createdAt, patch));
    const after = sessions.filter((h) => !isPrePatch(h.createdAt, patch));
    const beforeDurationSec = before.reduce((a, s) => a + s.durationSec, 0);
    const afterDurationSec = after.reduce((a, s) => a + s.durationSec, 0);
    if (beforeDurationSec < MIN_SIDE_DURATION_SEC || afterDurationSec < MIN_SIDE_DURATION_SEC) continue;

    const deltas: PatchMetricDelta[] = [];
    for (const metric of METRICS) {
      const b = ratePerHour(before, metric);
      const a = ratePerHour(after, metric);
      if (b == null || a == null || Math.abs(b) < 1e-9) continue;
      const pct = ((a - b) / Math.abs(b)) * 100;
      if (Math.abs(pct) < MIN_RELEVANT_PCT) continue;
      deltas.push({ label: metric.label, before: b, after: a, pct, lowerIsBetter: metric.lowerIsBetter });
    }
    if (!deltas.length) continue;

    out.push({
      huntName: sessions[0]?.huntName ?? name,
      beforeSessions: before.length,
      afterSessions: after.length,
      beforeDurationSec,
      afterDurationSec,
      deltas,
    });
  }

  return out;
}

/**
 * Mesmo cálculo do painel, mas indexado por hunt + rótulo de métrica — é
 * assim que a tabela comparativa consegue mostrar o percentual de variação
 * pós-atualização direto na célula, sem duplicar regra de negócio.
 */
export function patchDeltaIndex(
  pool: CompareHunt[],
  huntNames: string[],
  patch: BalancePatch | null = latestPatch(),
): Map<string, Map<string, PatchMetricDelta>> {
  const index = new Map<string, Map<string, PatchMetricDelta>>();
  for (const imp of patchImpactFor(pool, huntNames, patch)) {
    const byLabel = new Map<string, PatchMetricDelta>();
    for (const d of imp.deltas) byLabel.set(d.label, d);
    index.set(imp.huntName.trim().toLowerCase(), byLabel);
  }
  return index;
}
