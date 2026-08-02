import { Link } from "@tanstack/react-router";
import { Globe2, User } from "lucide-react";
import type { CompareHunt } from "@/lib/compare";
import { perHour, topKills } from "@/lib/compare";
import { fmtDate, fmtDuration, fmtGold, fmtNum } from "@/lib/format";
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
    label: "Duração",
    better: "none",
    value: (h) => h.durationSec,
    render: (h) => fmtDuration(h.durationSec),
  },
  {
    label: "Raw XP (sem bounty)",
    better: "high",
    value: (h) => h.rawXpHunt,
    render: (h) => (h.rawXpHunt == null ? "—" : fmtNum(h.rawXpHunt)),
    prey: "xp",
  },
  {
    label: "Raw XP/h",
    better: "high",
    value: (h) => perHour(h.rawXpHunt, h.durationSec),
    render: (h) => {
      const v = perHour(h.rawXpHunt, h.durationSec);
      return v == null ? "—" : fmtNum(v);
    },
    prey: "xp",
  },
  {
    label: "XP com bônus",
    better: "high",
    value: (h) => h.xpGain,
    render: (h) => fmtNum(h.xpGain),
    prey: "xp",
  },
  {
    label: "Balance",
    better: "high",
    value: (h) => h.balance,
    render: (h) => fmtGold(h.balance),
    prey: "loot",
  },
  {
    label: "Lucro/h",
    better: "high",
    value: (h) => perHour(h.balance, h.durationSec),
    render: (h) => fmtGold(perHour(h.balance, h.durationSec) ?? 0),
    prey: "loot",
  },
  {
    label: "Loot/h",
    better: "high",
    value: (h) => perHour(h.loot, h.durationSec),
    render: (h) => fmtGold(perHour(h.loot, h.durationSec) ?? 0),
    prey: "loot",
  },
  {
    label: "Supplies/h",
    better: "low",
    value: (h) => perHour(h.supplies, h.durationSec),
    render: (h) => fmtGold(perHour(h.supplies, h.durationSec) ?? 0),
  },
  {
    label: "Kills totais",
    better: "high",
    value: (h) => h.killsTotal,
    render: (h) => fmtNum(h.killsTotal),
  },
  {
    label: "Kills/h",
    better: "high",
    value: (h) => perHour(h.killsTotal, h.durationSec),
    render: (h) => fmtNum(perHour(h.killsTotal, h.durationSec) ?? 0),
  },
  {
    label: "Dano causado/h",
    better: "high",
    value: (h) => perHour(h.damageDealt, h.durationSec),
    render: (h) => fmtNum(perHour(h.damageDealt, h.durationSec) ?? 0),
    prey: "damage",
  },
  {
    label: "Cura/h",
    better: "none",
    value: (h) => perHour(h.healing, h.durationSec),
    render: (h) => fmtNum(perHour(h.healing, h.durationSec) ?? 0),
  },
  {
    label: "Dano recebido/h",
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
              {k.name} <span className="font-mono text-rubi-gold">×{fmtNum(k.count)}</span>
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

export function CompareTable({ hunts }: { hunts: CompareHunt[] }) {
  return (
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
        <span className="font-semibold text-rubi-success">Verde</span> = melhor resultado ·{" "}
        <span className="font-semibold text-rubi-danger">Vermelho</span> = pior resultado · valores com Prey
        estão marcados em dourado.
      </div>
    </div>
  );
}
