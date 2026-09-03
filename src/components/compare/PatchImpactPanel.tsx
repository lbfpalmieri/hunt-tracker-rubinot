import { useMemo, useState } from "react";
import { ChevronDown, TrendingDown, TrendingUp, Scale } from "lucide-react";
import type { CompareHunt } from "@/lib/compare";
import { patchImpactFor, type PatchMetricDelta } from "@/lib/patch-impact";
import { formatPatchDate, latestPatch } from "@/lib/patches";
import { fmtDuration, fmtGold, fmtNum } from "@/lib/format";

const fmtPct = (v: number) => `${v > 0 ? "+" : "−"}${Math.abs(v) >= 10 ? Math.round(Math.abs(v)) : Math.abs(v).toFixed(1)}%`;

const fmtValue = (label: string, v: number) =>
  label === "Lucro" || label === "Loot" || label === "Supplies" ? fmtGold(v) : fmtNum(v);

/** Verde quando a mudança foi boa pro jogador, vermelho quando foi ruim. */
function toneOf(d: PatchMetricDelta): string {
  const good = d.lowerIsBetter ? d.pct < 0 : d.pct > 0;
  return good ? "text-rubi-success" : "text-rubi-danger";
}

/**
 * Mostra, por hunt, quanto cada métrica por hora mudou depois do marco de
 * balanceamento mais recente. Não aparece quando não existe marco cadastrado
 * ou quando as hunts selecionadas não têm histórico dos dois lados da data —
 * é um extra contextual, não uma seção fixa.
 */
export function PatchImpactPanel({ pool, hunts }: { pool: CompareHunt[]; hunts: CompareHunt[] }) {
  const patch = latestPatch();
  const [open, setOpen] = useState(true);
  const impacts = useMemo(
    () => patchImpactFor(pool, hunts.map((h) => h.huntName), patch),
    [pool, hunts, patch],
  );

  if (!patch || impacts.length === 0) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-surface/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <Scale className="h-4 w-4 flex-none text-rubi-gold" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-rubi-gold">
            Antes x depois do {patch.label}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            Variação por hora nas hunts com histórico dos dois lados de {formatPatchDate(patch)}
          </div>
        </div>
        <ChevronDown
          className={"h-4 w-4 flex-none text-muted-foreground transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/60 px-4 py-3">
          {impacts.map((imp) => (
            <div key={imp.huntName}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-display text-sm font-semibold">{imp.huntName}</span>
                <span className="text-[11px] text-muted-foreground">
                  {imp.beforeSessions} sessão(ões) antes ({fmtDuration(imp.beforeDurationSec)}) ·{" "}
                  {imp.afterSessions} depois ({fmtDuration(imp.afterDurationSec)})
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {imp.deltas.map((d) => (
                  <span
                    key={d.label}
                    title={`${d.label}/h: ${fmtValue(d.label, d.before)} antes → ${fmtValue(d.label, d.after)} depois`}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2 py-1 text-xs"
                  >
                    {d.pct > 0 ? (
                      <TrendingUp className={"h-3.5 w-3.5 " + toneOf(d)} />
                    ) : (
                      <TrendingDown className={"h-3.5 w-3.5 " + toneOf(d)} />
                    )}
                    <span className="text-muted-foreground">{d.label}</span>
                    <strong className={"font-mono " + toneOf(d)}>{fmtPct(d.pct)}</strong>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Comparação feita só com hunts que têm pelo menos 20 min caçados antes e depois da data, e
            variações abaixo de 3% são ignoradas por serem flutuação normal de loot.
          </p>
        </div>
      )}
    </div>
  );
}
