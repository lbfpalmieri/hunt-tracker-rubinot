import { Link } from "@tanstack/react-router";
import { Globe2, User, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompareHunt } from "@/lib/compare";
import { perHour, topKills } from "@/lib/compare";
import { fmtDate, fmtGold, fmtNum } from "@/lib/format";
import { preyMarkLabel, preyMarkTitle, type PreyBonus } from "@/lib/prey";
import { BountyBadge } from "@/components/BountyBadge";

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

export function CompareTable({ hunts }: { hunts: CompareHunt[] }) {
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

  return (
    <div className="space-y-4">
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
      </div>

      {activeCriteria > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${hunts.length}, minmax(0, 1fr))` }}
        >
          {hunts.map((h) => {
            const score = scores.get(h.key) ?? 0;
            const isWinner = topScore > 0 && score === topScore;
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
                <div className="mt-1 font-display text-2xl font-bold text-foreground">
                  {score}
                  <span className="text-sm font-normal text-muted-foreground">/{activeCriteria}</span>
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
            {hunts.map((h) => {
              const agg = (h.sessionCount ?? 1) > 1;
              return (
                <th key={h.key} className="px-4 py-3 text-left align-top">
                  <div className="flex items-center gap-1.5">
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
                return (
                  <td key={h.key} className="px-4 py-2.5 align-top">
                    <div className={"font-mono " + toneFor(row, hunts, h)}>{row.render(h)}</div>
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
      </div>

      </div>
    </div>
  );
}
