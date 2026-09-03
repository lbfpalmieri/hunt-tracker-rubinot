import { Link } from "@tanstack/react-router";
import { Globe2, User, Trophy, Zap, Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { CompareHunt } from "@/lib/compare";
import { perHour, topKills } from "@/lib/compare";
import { fmtDate, fmtGold, fmtNum } from "@/lib/format";
import { preyMarkLabel, preyMarkTitle, type PreyBonus } from "@/lib/prey";
import { BountyBadge } from "@/components/BountyBadge";
import { patchDeltaIndex, type PatchMetricDelta } from "@/lib/patch-impact";
import { formatPatchDate, latestPatch } from "@/lib/patches";

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

/** Rows with a clear winner/loser — the ones that make sense as scoring criteria. */
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
 * Sessões individuais da mesma hunt (o caso normal em Comparar sessões,
 * já que é aí que faz sentido testar variações no mesmo spot) têm o mesmo
 * huntName — nomeá-las igual no veredito/placar seria ambíguo, então
 * marcamos com o horário da sessão pra diferenciar.
 */
function isAmbiguousName(h: CompareHunt, hunts: CompareHunt[]): boolean {
  if ((h.sessionCount ?? 1) > 1) return false;
  return hunts.filter(
    (x) => (x.sessionCount ?? 1) <= 1 && x.huntName.trim().toLowerCase() === h.huntName.trim().toLowerCase(),
  ).length > 1;
}

function HuntLabel({ h, hunts, className }: { h: CompareHunt; hunts: CompareHunt[]; className?: string }) {
  return (
    <span className={className}>
      {h.huntName}
      {isAmbiguousName(h, hunts) && (
        <span className="font-normal text-muted-foreground"> ({fmtDate(h.createdAt)})</span>
      )}
    </span>
  );
}

interface Highlight {
  row: Row;
  pct: number;
  hi: CompareHunt;
  lo: CompareHunt;
}

/** Maior diferença percentual entre a maior e a menor sessão, entre os critérios marcados. */
function biggestGap(hunts: CompareHunt[], scoreOn: Set<string>): Highlight | null {
  let best: Highlight | null = null;
  for (const row of SCORABLE_ROWS) {
    if (!scoreOn.has(row.label)) continue;
    const vals = hunts
      .map((h) => ({ h, v: row.value(h) }))
      .filter((x): x is { h: CompareHunt; v: number } => x.v != null);
    if (vals.length < 2) continue;
    let hi = vals[0];
    let lo = vals[0];
    for (const x of vals) {
      if (x.v > hi.v) hi = x;
      if (x.v < lo.v) lo = x;
    }
    if (hi.h.key === lo.h.key) continue;
    const denom = Math.abs(lo.v) > 1e-9 ? Math.abs(lo.v) : Math.abs(hi.v);
    if (denom < 1e-9) continue;
    const pct = (Math.abs(hi.v - lo.v) / denom) * 100;
    if (!best || pct > best.pct) best = { row, pct, hi: hi.h, lo: lo.h };
  }
  return best;
}

const fmtPct = (v: number) => (v >= 10 ? `${Math.round(v)}%` : `${v.toFixed(1)}%`);
/** Abaixo disso a diferença não é interessante o bastante pra virar destaque. */
const MIN_HIGHLIGHT_PCT = 5;

/**
 * Badge de variação pós-atualização mostrado dentro da própria célula da
 * métrica: verde quando a mudança foi boa pro jogador, vermelho quando foi
 * ruim. Só aparece quando a hunt tem histórico dos dois lados do marco.
 */
function DeltaBadge({ delta, patchLabel }: { delta: PatchMetricDelta; patchLabel: string }) {
  const stable = Math.abs(delta.pct) < 3;
  const good = delta.lowerIsBetter ? delta.pct < 0 : delta.pct > 0;
  const tone = stable
    ? "text-muted-foreground border-border/60 bg-background/40"
    : good
      ? "text-rubi-success border-rubi-success/40 bg-rubi-success/10"
      : "text-rubi-danger border-rubi-danger/40 bg-rubi-danger/10";
  const Icon = stable ? Minus : delta.pct > 0 ? TrendingUp : TrendingDown;
  const fmtV = (v: number) =>
    delta.label === "Lucro" || delta.label === "Loot" || delta.label === "Supplies" ? fmtGold(v) : fmtNum(v);
  return (
    <span
      title={`${patchLabel}: ${fmtV(delta.before)}/h antes → ${fmtV(delta.after)}/h depois${stable ? " (variação dentro da flutuação normal)" : ""}`}
      className={"mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold " + tone}
    >
      <Icon className="h-3 w-3 flex-none" />
      {(delta.pct > 0 ? "+" : "−") + (Math.abs(delta.pct) >= 10 ? Math.round(Math.abs(delta.pct)) : Math.abs(delta.pct).toFixed(1)) + "%"}
    </span>
  );
}

export function CompareTable({ hunts, pool }: { hunts: CompareHunt[]; pool?: CompareHunt[] }) {
  const patch = latestPatch();
  const [showDelta, setShowDelta] = useState(true);
  const deltaIndex = useMemo(
    (): Map<string, Map<string, PatchMetricDelta>> =>
      pool && pool.length ? patchDeltaIndex(pool, hunts.map((h) => h.huntName), patch) : new Map(),
    [pool, hunts, patch],
  );
  const hasDelta = deltaIndex.size > 0;
  const deltaFor = (h: CompareHunt, label: string) =>
    showDelta ? deltaIndex.get(h.huntName.trim().toLowerCase())?.get(label) ?? null : null;
  const [scoreOn, setScoreOn] = useState<Set<string>>(() => new Set(SCORABLE_ROWS.map((r) => r.label)));
  const toggleScore = (label: string) =>
    setScoreOn((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  const scores = useMemo(() => {
    const map = new Map<string, number>(hunts.map((h) => [h.key, 0]));
    for (const row of SCORABLE_ROWS) {
      if (!scoreOn.has(row.label)) continue;
      for (const key of winnersOf(row, hunts)) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [hunts, scoreOn]);

  const activeCriteria = SCORABLE_ROWS.filter((r) => scoreOn.has(r.label)).length;
  const topScore = Math.max(0, ...hunts.map((h) => scores.get(h.key) ?? 0));
  const winners = hunts.filter((h) => topScore > 0 && (scores.get(h.key) ?? 0) === topScore);
  const soleWinner = winners.length === 1 ? winners[0] : null;
  // Só entram critérios que a vencedora levou sozinha — um critério empatado
  // (ex.: mesmo número de kills) não deveria virar "venceu em Kills" no texto.
  const winnerCriteria = soleWinner
    ? SCORABLE_ROWS.filter((r) => {
        if (!scoreOn.has(r.label)) return false;
        const w = winnersOf(r, hunts);
        return w.size === 1 && w.has(soleWinner.key);
      }).map((r) => r.label)
    : [];

  const highlight = useMemo(() => {
    const gap = biggestGap(hunts, scoreOn);
    return gap && gap.pct >= MIN_HIGHLIGHT_PCT ? gap : null;
  }, [hunts, scoreOn]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-rubi-gold/50 bg-gradient-to-br from-rubi-gold/10 via-surface to-rubi-blue/10 shadow-glow-gold">
        <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <span className="text-xl leading-none sm:text-2xl">
            {activeCriteria === 0 || winners.length === 0 ? "🤔" : winners.length === hunts.length ? "🤝" : "🏆"}
          </span>
          <div className="min-w-0 text-sm sm:text-[15px]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-rubi-gold">
              Veredito automático
            </div>
            <div className="mt-0.5">
              {activeCriteria === 0 ? (
                <span className="text-muted-foreground">
                  Marque pelo menos um critério abaixo para o sistema apontar automaticamente qual saiu melhor.
                </span>
              ) : winners.length === 0 ? (
                <span className="text-muted-foreground">
                  Sem dados suficientes nos critérios marcados pra apontar uma vencedora clara.
                </span>
              ) : winners.length === hunts.length ? (
                <span>Empate geral — nenhuma se destacou nos {activeCriteria} critério(s) avaliados.</span>
              ) : soleWinner ? (
                <span>
                  <strong className="text-rubi-gold">
                    <HuntLabel h={soleWinner} hunts={hunts} />
                  </strong>{" "}
                  teve o melhor resultado geral — venceu <strong>{topScore}</strong> de {activeCriteria}{" "}
                  critério(s) avaliados
                  {winnerCriteria.length > 0 && (
                    <>
                      : <span className="text-foreground">{winnerCriteria.join(", ")}</span>
                    </>
                  )}
                  .
                </span>
              ) : (
                <span>
                  Empate entre{" "}
                  {winners.map((h, i) => (
                    <Fragment key={h.key}>
                      {i > 0 && (i === winners.length - 1 ? " e " : ", ")}
                      <strong className="text-rubi-gold">
                        <HuntLabel h={h} hunts={hunts} />
                      </strong>
                    </Fragment>
                  ))}{" "}
                  — cada uma venceu {topScore} de {activeCriteria} critério(s) avaliados.
                </span>
              )}
            </div>
          </div>
        </div>

        {highlight && (
          <div className="flex items-start gap-3 border-t border-rubi-gold/20 bg-background/30 px-4 py-3 sm:px-5">
            <Zap className="h-4 w-4 flex-none translate-y-0.5 text-rubi-blue" />
            <div className="min-w-0 text-sm">
              <span className="font-semibold text-rubi-blue">Maior diferença: </span>
              <span className="text-foreground">{highlight.row.label}</span> foi{" "}
              <strong className="text-rubi-blue">{fmtPct(highlight.pct)}</strong> maior em{" "}
              <strong>
                <HuntLabel h={highlight.hi} hunts={hunts} />
              </strong>{" "}
              (<span className="font-mono">{highlight.row.render(highlight.hi)}</span>) do que em{" "}
              <strong>
                <HuntLabel h={highlight.lo} hunts={hunts} />
              </strong>{" "}
              (<span className="font-mono">{highlight.row.render(highlight.lo)}</span>).
            </div>
          </div>
        )}
      </div>

      <div className="card-surface p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-rubi-gold" /> Critérios da pontuação
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SCORABLE_ROWS.map((row) => {
            const on = scoreOn.has(row.label);
            return (
              <button
                key={row.label}
                type="button"
                onClick={() => toggleScore(row.label)}
                aria-pressed={on}
                className={
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
                  (on
                    ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                    : "border-border/60 text-muted-foreground hover:border-rubi-gold/40")
                }
              >
                {row.label}
              </button>
            );
          })}
        </div>

        {patch && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDelta((v) => !v)}
                aria-pressed={showDelta}
                disabled={!hasDelta}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors " +
                  (!hasDelta
                    ? "cursor-not-allowed border-border/50 text-muted-foreground/60"
                    : showDelta
                      ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                      : "border-border/60 text-muted-foreground hover:border-rubi-gold/40")
                }
              >
                <Scale className="h-3.5 w-3.5 flex-none" />
                Variação desde o {patch.label}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {hasDelta
                  ? `Cada métrica ganha um selo com o quanto ela subiu ou caiu por hora depois de ${formatPatchDate(patch)}.`
                  : `Nenhuma hunt selecionada tem histórico suficiente dos dois lados de ${formatPatchDate(patch)} para calcular a variação.`}
              </span>
            </div>
          </div>
        )}
      </div>

      {activeCriteria > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${hunts.length}, minmax(0, 1fr))` }}
        >
          {hunts.map((h) => {
            const score = scores.get(h.key) ?? 0;
            const isWinner = topScore > 0 && score === topScore;
            const pct = activeCriteria > 0 ? (score / activeCriteria) * 100 : 0;
            return (
              <div
                key={h.key}
                className={
                  "rounded-xl border p-3 text-center transition-colors " +
                  (isWinner
                    ? "border-rubi-gold bg-rubi-gold/10 shadow-glow-gold"
                    : "border-border/60 bg-surface/40")
                }
              >
                <div className="text-lg leading-none">{isWinner ? "🏆" : " "}</div>
                <div className="mt-1 truncate text-xs font-medium text-muted-foreground" title={h.huntName}>
                  {h.huntName}
                </div>
                {isAmbiguousName(h, hunts) && (
                  <div className="text-[10px] text-muted-foreground/70">{fmtDate(h.createdAt)}</div>
                )}
                <div className="mt-1 font-display text-2xl font-bold text-foreground">
                  {score}
                  <span className="text-sm font-normal text-muted-foreground">/{activeCriteria}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                  <div
                    className={"h-full rounded-full transition-all " + (isWinner ? "bg-rubi-gold" : "bg-rubi-blue/50")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
              Métrica
            </th>
            {hunts.map((h, i) => {
              const agg = (h.sessionCount ?? 1) > 1;
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
                  </div>
                  <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                    {h.charName} · {h.vocation}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {agg ? `Média de ${h.sessionCount} sessões` : fmtDate(h.createdAt)}
                  </div>
                  {!agg && h.bounty && (
                    <div className="mt-1">
                      <BountyBadge bounty={h.bounty} />
                    </div>
                  )}
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
      <div className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        {hunts.some((h) => (h.sessionCount ?? 1) > 1) ? (
          <>Valores calculados a partir da <strong>média de todas as sessões da hunt</strong>, projetada para uma hora de caça. </>
        ) : (
          <>Valores de cada sessão <strong>projetados para uma hora de caça</strong>, pra comparar durações diferentes de forma justa. </>
        )}
        <span className="font-semibold text-rubi-success">Verde</span>{" "}
        = melhor resultado · <span className="font-semibold text-rubi-danger">Vermelho</span> = pior resultado ·
        valores com Prey estão marcados em dourado. A pontuação 🏆 conta quantos dos critérios marcados acima
        cada hunt venceu.
        {patch && hasDelta && showDelta && (
          <>
            {" "}Os selos de porcentagem comparam o ritmo por hora <strong>antes e depois do {patch.label}</strong>{" "}
            ({formatPatchDate(patch)}), usando só hunts com pelo menos 20 min caçados em cada lado.
          </>
        )}
      </div>

      </div>
    </div>
  );
}
