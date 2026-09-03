import { Link } from "@tanstack/react-router";
import { Globe2, User, Percent, TrendingDown, TrendingUp, Minus, History } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompareHunt } from "@/lib/compare";
import { perHour, topKills } from "@/lib/compare";
import { fmtDate, fmtGold, fmtNum } from "@/lib/format";
import { preyMarkLabel, preyMarkTitle, type PreyBonus } from "@/lib/prey";
import { BountyBadge } from "@/components/BountyBadge";
import { patchDeltaIndex, type PatchMetricDelta } from "@/lib/patch-impact";
import { formatPatchDate, isPrePatch, latestPatch } from "@/lib/patches";

type Better = "high" | "low" | "none";

interface Row {
  label: string;
  better: Better;
  /** Numeric value used for the best/worst highlight. Null = sem dado. */
  value: (h: CompareHunt) => number | null;
  render: (h: CompareHunt) => React.ReactNode;
  /** Prey bonus that influences this metric. */
  prey?: PreyBonus;
}

const ROWS: Row[] = [
  {
    label: "Raw XP (sem bounty)",
    better: "high",
    value: (h) => perHour(h.rawXpHunt, h.durationSec),
    render: (h) => {
      const v = perHour(h.rawXpHunt, h.durationSec);
      return v == null ? "—" : fmtNum(v);
    },
    prey: "xp",
  },
  {
    label: "Lucro",
    better: "high",
    value: (h) => perHour(h.balance, h.durationSec),
    render: (h) => fmtGold(perHour(h.balance, h.durationSec) ?? 0),
    prey: "loot",
  },
  {
    label: "Loot",
    better: "high",
    value: (h) => perHour(h.loot, h.durationSec),
    render: (h) => fmtGold(perHour(h.loot, h.durationSec) ?? 0),
    prey: "loot",
  },
  {
    label: "Supplies",
    better: "low",
    value: (h) => perHour(h.supplies, h.durationSec),
    render: (h) => fmtGold(perHour(h.supplies, h.durationSec) ?? 0),
  },
  {
    label: "Kills",
    better: "high",
    value: (h) => perHour(h.killsTotal, h.durationSec),
    render: (h) => fmtNum(perHour(h.killsTotal, h.durationSec) ?? 0),
  },
  {
    label: "Dano causado",
    better: "high",
    value: (h) => perHour(h.damageDealt, h.durationSec),
    render: (h) => fmtNum(perHour(h.damageDealt, h.durationSec) ?? 0),
    prey: "damage",
  },
  {
    label: "Cura",
    better: "none",
    value: (h) => perHour(h.healing, h.durationSec),
    render: (h) => fmtNum(perHour(h.healing, h.durationSec) ?? 0),
  },
  {
    label: "Dano recebido",
    better: "low",
    value: (h) => perHour(h.damageReceived, h.durationSec),
    render: (h) => {
      const v = perHour(h.damageReceived, h.durationSec);
      return v == null ? "—" : fmtNum(v);
    },
    prey: "defense",
  },
  {
    label: "Top 3 monstros",
    better: "none",
    value: () => null,
    render: (h) => {
      const top = topKills(h);
      if (!top.length) return "—";
      return (
        <span className="inline-flex flex-col gap-0.5 text-xs">
          {top.map((k) => (
            <span key={k.name}>
              {k.name}{" "}
              <span className="font-mono text-rubi-gold">
                ×{fmtNum(perHour(k.count, h.durationSec) ?? 0)}
              </span>
            </span>
          ))}
        </span>
      );
    },
  },
];

function toneFor(row: Row, hunts: CompareHunt[], h: CompareHunt): string {
  if (row.better === "none" || hunts.length < 2) return "";
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return "";
  const v = row.value(h);
  if (v == null) return "";
  const best = row.better === "high" ? Math.max(...values) : Math.min(...values);
  const worst = row.better === "high" ? Math.min(...values) : Math.max(...values);
  if (best === worst) return "";
  if (v === best) return "text-rubi-success font-semibold";
  if (v === worst) return "text-rubi-danger";
  return "";
}

/** Rows with a clear winner/loser — used only for the discreet "melhor geral" mark. */
const SCORABLE_ROWS = ROWS.filter((r) => r.better !== "none");

function winnersOf(row: Row, hunts: CompareHunt[]): Set<string> {
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return new Set();
  const best = row.better === "high" ? Math.max(...values) : Math.min(...values);
  const winners = new Set<string>();
  for (const h of hunts) {
    if (row.value(h) === best) winners.add(h.key);
  }
  return winners;
}

/**
 * Sessões individuais da mesma hunt têm o mesmo huntName — marcamos com a data
 * pra diferenciar quando isso acontece.
 */
function isAmbiguousName(h: CompareHunt, hunts: CompareHunt[]): boolean {
  if ((h.sessionCount ?? 1) > 1) return false;
  return hunts.filter(
    (x) => (x.sessionCount ?? 1) <= 1 && x.huntName.trim().toLowerCase() === h.huntName.trim().toLowerCase(),
  ).length > 1;
}

/**
 * Selo de variação pós-atualização, exibido só quando o usuário liga o botão
 * de porcentagem. Quando a mudança é pequena o selo fica neutro e mostra "≈"
 * em vez de um sinal — um "+0,4%" cinza ao lado de um número vermelho (que
 * significa outra coisa: pior entre as hunts) só confundia a leitura.
 */
function DeltaBadge({ delta, patchLabel }: { delta: PatchMetricDelta; patchLabel: string }) {
  const stable = Math.abs(delta.pct) < 3;
  const good = delta.lowerIsBetter ? delta.pct < 0 : delta.pct > 0;
  const tone = stable
    ? "text-muted-foreground border-border/60"
    : good
      ? "text-rubi-success border-rubi-success/40"
      : "text-rubi-danger border-rubi-danger/40";
  const Icon = stable ? Minus : delta.pct > 0 ? TrendingUp : TrendingDown;
  const fmtV = (v: number) =>
    delta.label === "Lucro" || delta.label === "Loot" || delta.label === "Supplies" ? fmtGold(v) : fmtNum(v);
  const abs = Math.abs(delta.pct);
  const num = (abs >= 10 ? Math.round(abs) : Number(abs.toFixed(1))).toLocaleString("pt-BR");
  return (
    <span
      title={`${patchLabel}: ${fmtV(delta.before)}/h antes → ${fmtV(delta.after)}/h depois${stable ? " (dentro da flutuação normal)" : ""}`}
      className={"mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold " + tone}
    >
      <Icon className="h-3 w-3 flex-none" />
      {stable ? `≈${num}%` : `${delta.pct > 0 ? "+" : "−"}${num}%`}
    </span>
  );
}

export function CompareTable({ hunts, pool }: { hunts: CompareHunt[]; pool?: CompareHunt[] }) {
  const patch = latestPatch();
  const [showDelta, setShowDelta] = useState(false);
  const deltaIndex = useMemo(
    (): Map<string, Map<string, PatchMetricDelta>> =>
      pool && pool.length ? patchDeltaIndex(pool, hunts.map((h) => h.huntName), patch) : new Map(),
    [pool, hunts, patch],
  );
  const hasDelta = deltaIndex.size > 0;
  const deltaFor = (h: CompareHunt, label: string) =>
    showDelta ? deltaIndex.get(h.huntName.trim().toLowerCase())?.get(label) ?? null : null;

  /** Melhor geral: quem venceu mais métricas com vencedor claro. Sem configuração. */
  const bestKey = useMemo(() => {
    const scores = new Map<string, number>(hunts.map((h) => [h.key, 0]));
    for (const row of SCORABLE_ROWS) {
      const w = winnersOf(row, hunts);
      if (w.size !== 1) continue;
      for (const key of w) scores.set(key, (scores.get(key) ?? 0) + 1);
    }
    const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    if (ranked.length < 2 || ranked[0][1] === 0) return null;
    if (ranked[0][1] === ranked[1][1]) return null;
    return ranked[0][0];
  }, [hunts]);

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Por hora de caça
        </div>
        {patch && (
          <button
            type="button"
            onClick={() => setShowDelta((v) => !v)}
            aria-pressed={showDelta}
            disabled={!hasDelta}
            title={
              hasDelta
                ? `Mostra, em cada métrica, quanto o ritmo por hora mudou depois do ${patch.label} (${formatPatchDate(patch)}).`
                : `Nenhuma hunt selecionada tem histórico suficiente dos dois lados de ${formatPatchDate(patch)}.`
            }
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
              (!hasDelta
                ? "cursor-not-allowed border-border/50 text-muted-foreground/50"
                : showDelta
                  ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                  : "border-border/60 text-muted-foreground hover:border-rubi-gold/40")
            }
          >
            <Percent className="h-3.5 w-3.5 flex-none" />
            Variação desde o {patch.label}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Métrica
              </th>
              {hunts.map((h, i) => {
                const agg = (h.sessionCount ?? 1) > 1;
                const pre = patch && !agg && isPrePatch(h.createdAt, patch);
                return (
                  <th key={h.key} className="px-4 py-3 text-left align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-rubi-blue/20 px-1.5 py-0.5 font-mono text-[10px] text-rubi-blue">
                        #{i + 1}
                      </span>
                      {h.source === "community" ? (
                        <Globe2 className="h-3.5 w-3.5 flex-none text-rubi-blue" />
                      ) : (
                        <User className="h-3.5 w-3.5 flex-none text-rubi-gold" />
                      )}
                      {agg ? (
                        <span className="font-display text-sm font-semibold">{h.huntName}</span>
                      ) : (
                        <Link
                          to={h.source === "own" ? "/sessions/$id" : "/community/$id"}
                          params={{ id: h.id }}
                          className="font-display text-sm font-semibold hover:text-rubi-blue"
                        >
                          {h.huntName}
                        </Link>
                      )}
                      {bestKey === h.key && (
                        <span title="Melhor resultado geral" className="text-sm leading-none">🏆</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {h.charName} · {h.vocation}
                    </div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {agg ? `Média de ${h.sessionCount} sessões` : fmtDate(h.createdAt)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {pre && patch && (
                        <span
                          title={`Sessão de antes do ${patch.label} (${formatPatchDate(patch)}) — o balanceamento do servidor era outro.`}
                          className="inline-flex items-center gap-1 rounded-full border border-rubi-gold/40 px-1.5 py-0.5 text-[10px] font-semibold text-rubi-gold"
                        >
                          <History className="h-3 w-3 flex-none" /> pré-nerf
                        </span>
                      )}
                      {!agg && h.bounty && <BountyBadge bounty={h.bounty} />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border/40 last:border-0">
                <th className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </th>
                {hunts.map((h) => {
                  const mark = row.prey ? preyMarkLabel(h.prey, row.prey) : null;
                  const delta = deltaFor(h, row.label);
                  return (
                    <td key={h.key} className="px-4 py-2.5 align-top">
                      <div className={"font-mono " + toneFor(row, hunts, h)}>{row.render(h)}</div>
                      {delta && patch && <DeltaBadge delta={delta} patchLabel={patch.label} />}
                      {mark && (
                        <div
                          title={row.prey ? preyMarkTitle(h.prey, row.prey) : undefined}
                          className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-gold"
                        >
                          {mark}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <span className="font-semibold text-rubi-success">Verde</span> = melhor ·{" "}
        <span className="font-semibold text-rubi-danger">vermelho</span> = pior · dourado = bônus de Prey.
      </div>
    </div>
  );
}
