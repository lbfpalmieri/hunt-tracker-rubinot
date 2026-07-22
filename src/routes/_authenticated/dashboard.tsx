import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { aggregateImbuements } from "@/lib/imbuements";
import { fmtGold, fmtNum, fmtDuration, fmtDate } from "@/lib/format";
import {
  Coins, Zap, Trophy, Swords, TrendingUp, Upload, ScrollText, Sparkles, Wallet,
} from "lucide-react";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useMemo } from "react";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RubinOT Hunt Tracker" },
      { name: "description", content: "Acompanhe suas hunts no RubinOT: XP/h, lucro/h e evolução." },
      { property: "og:title", content: "Dashboard RubinOT Hunt Tracker" },
      { property: "og:description", content: "Métricas das suas hunts no RubinOT." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const imbuements = useAppStore((s) => s.imbuements);
  const activeId = useAppStore((s) => s.activeCharacterId);


  const active = characters.find((c) => c.id === activeId) ?? null;
  const mySessions = useMemo(
    () => (active ? sessions.filter((s) => s.characterId === active.id) : []),
    [sessions, active],
  );

  const agg = useMemo(() => {
    if (mySessions.length === 0) {
      return { xph: 0, gph: 0, totalTime: 0, balance: 0, bestHunt: null as null | { name: string; gph: number } };
    }
    const totalTime = mySessions.reduce((a, s) => a + s.hunting.durationSec, 0);
    const totalXp = mySessions.reduce((a, s) => a + s.hunting.xpGain, 0);
    const totalBal = mySessions.reduce((a, s) => a + s.hunting.balance, 0);
    const hoursTotal = totalTime / 3600 || 1;
    const xph = totalXp / hoursTotal;
    const gph = totalBal / hoursTotal;
    const bySpot = new Map<string, { time: number; bal: number }>();
    for (const s of mySessions) {
      const cur = bySpot.get(s.huntName) ?? { time: 0, bal: 0 };
      cur.time += s.hunting.durationSec;
      cur.bal += s.hunting.balance;
      bySpot.set(s.huntName, cur);
    }
    let bestHunt: null | { name: string; gph: number } = null;
    for (const [name, v] of bySpot) {
      const g = v.bal / (v.time / 3600 || 1);
      if (!bestHunt || g > bestHunt.gph) bestHunt = { name, gph: g };
    }
    return { xph, gph, totalTime, balance: totalBal, bestHunt };
  }, [mySessions]);

  const imbAgg = useMemo(
    () => (active ? aggregateImbuements(imbuements, sessions, active.id) : null),
    [imbuements, sessions, active],
  );
  const netBalance = agg.balance - (imbAgg?.totalSpent ?? 0);



  const chartData = useMemo(
    () =>
      [...mySessions].reverse().map((s, i) => ({
        i: i + 1,
        name: s.huntName,
        "XP/h": Math.round(s.hunting.xpPerHour),
        "Lucro/h": Math.round(s.hunting.balance / (s.hunting.durationSec / 3600 || 1)),
      })),
    [mySessions],
  );

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
            RubinOT Hunt Tracker
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {active ? (
              <>Olá, <span className="text-gradient-brand">{active.name}</span></>
            ) : (
              <>Bem-vindo, caçador</>
            )}
          </h1>
          {active && (
            <p className="mt-1 text-sm text-muted-foreground">
              {active.vocation} · {active.world} · {mySessions.length} sessão(ões) registrada(s)
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link
            to="/import"
            className="inline-flex items-center gap-2 rounded-lg bg-rubi-blue px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-blue hover:opacity-90"
          >
            <Upload className="h-4 w-4" /> Nova sessão
          </Link>
          <Link
            to="/imbuements"
            className="inline-flex items-center gap-2 rounded-lg border border-rubi-gold/50 bg-rubi-gold/10 px-4 py-2.5 text-sm font-semibold text-rubi-gold hover:bg-rubi-gold/20"
          >
            <Sparkles className="h-4 w-4" /> Adicionar imbuement
          </Link>
        </div>

      </div>

      {!hydrated ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Comece criando seu personagem"
          description="Cadastre seu char para vincular as sessões de hunt e ver a evolução ao longo do tempo."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      ) : mySessions.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="Nenhuma sessão importada ainda"
          description="Cole os dados do Hunting Analyser, Damage Analyser e Miscellaneous do RubinOT para começar."
          ctaLabel="Importar primeira sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          {/* Hero: Balance em destaque */}
          <div className="card-surface relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rubi-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-rubi-blue/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5 text-rubi-gold" />
                  Balance acumulado
                </div>
                <div className={"mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl " + (agg.balance >= 0 ? "text-gradient-brand" : "text-rubi-danger")}>
                  {fmtGold(agg.balance)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {agg.bestHunt ? <>Top spot: <span className="text-foreground/80">{agg.bestHunt.name}</span></> : "sem hunts comparáveis ainda"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:min-w-[280px]">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tempo</div>
                  <div className="mt-1 font-display text-lg font-semibold">{fmtDuration(agg.totalTime)}</div>
                  <div className="text-[11px] text-muted-foreground">{mySessions.length} sessões</div>
                </div>
                {imbAgg && imbAgg.rows.some((r) => r.active) && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Líquido</div>
                    <div className={"mt-1 font-display text-lg font-semibold " + (netBalance >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
                      {fmtGold(netBalance)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">após imbuements</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* XP */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-blue">
              <Zap className="h-3.5 w-3.5" /> Experiência
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="XP / hora (média)" value={fmtNum(agg.xph)} icon={Zap} accent="blue" />
              <StatCard
                label="XP total ganha"
                value={fmtNum(mySessions.reduce((a, s) => a + s.hunting.xpGain, 0))}
                hint={`em ${fmtDuration(agg.totalTime)}`}
                icon={TrendingUp}
                accent="blue"
              />
            </div>
          </div>

          {/* Gold */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-gold">
              <Coins className="h-3.5 w-3.5" /> Ouro
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="Lucro / hora (média)" value={fmtGold(agg.gph)} hint="gold bruto por hora" icon={Coins} accent="gold" />
              <StatCard
                label="Balance bruto"
                value={fmtGold(agg.balance)}
                hint="antes dos imbuements"
                icon={Wallet}
                accent={agg.balance >= 0 ? "success" : "danger"}
              />
            </div>
          </div>

          {imbAgg && imbAgg.rows.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-gold">
                <Sparkles className="h-3.5 w-3.5" /> Imbuements
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Custo / hora"
                  value={fmtGold(imbAgg.activeCostPerHour)}
                  hint={`${imbAgg.rows.filter((r) => r.active).length} ativo(s)`}
                  icon={Sparkles}
                  accent="gold"
                />
                <StatCard
                  label="Consumido"
                  value={fmtGold(imbAgg.totalSpent)}
                  hint={imbAgg.totalSpent === 0 ? "nenhuma hunt após registro" : "amortizado nas hunts"}
                  icon={Coins}
                  accent="muted"
                />
                <StatCard
                  label="Lucro líquido"
                  value={fmtGold(netBalance)}
                  hint="balance − imbuements consumidos"
                  icon={Wallet}
                  accent={netBalance >= 0 ? "success" : "danger"}
                />
                <StatCard
                  label="Projeção líquida / h"
                  value={fmtGold(agg.gph - imbAgg.activeCostPerHour)}
                  hint={agg.gph - imbAgg.activeCostPerHour >= 0 ? "imbuement se paga" : "custa mais que rende"}
                  icon={TrendingUp}
                  accent={agg.gph - imbAgg.activeCostPerHour >= 0 ? "success" : "danger"}
                />
              </div>
            </div>
          )}



          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card-surface p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Evolução por sessão</h2>
                  <p className="text-xs text-muted-foreground">XP/h e Lucro/h nas últimas hunts</p>
                </div>
                <TrendingUp className="h-4 w-4 text-rubi-blue" />
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--rubi-blue)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--rubi-blue)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--rubi-gold)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--rubi-gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="i" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis yAxisId="l" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => fmtGold(v)} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => fmtGold(v)} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} formatter={(v) => fmtGold(Number(v))} />
                    <Area yAxisId="l" type="monotone" dataKey="XP/h" stroke="var(--rubi-blue)" strokeWidth={2} fill="url(#gXp)" />
                    <Area yAxisId="r" type="monotone" dataKey="Lucro/h" stroke="var(--rubi-gold)" strokeWidth={2} fill="url(#gGold)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Últimas sessões</h2>
                <Link to="/sessions" className="text-xs text-rubi-blue hover:underline">ver todas</Link>
              </div>
              <ul className="space-y-2">
                {mySessions.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link to="/sessions/$id" params={{ id: s.id }} className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-border hover:bg-accent/40">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 truncate font-medium">
                          <Swords className="h-3.5 w-3.5 text-rubi-blue" />
                          {s.huntName}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {fmtDate(s.createdAt)} · {fmtDuration(s.hunting.durationSec)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={"text-sm font-semibold " + (s.hunting.balance >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
                          {fmtGold(s.hunting.balance)}
                        </div>
                        <div className="text-xs text-muted-foreground">{fmtNum(s.hunting.xpPerHour)} xp/h</div>
                      </div>
                    </Link>
                  </li>
                ))}
                {mySessions.length === 0 && (
                  <li className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
                    <ScrollText className="h-5 w-5" />
                    Nenhuma sessão ainda.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
