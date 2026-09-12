import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Users, Coins, Clock, ScrollText, Wallet, Trophy, UserCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { LevelBadge } from "@/components/LevelBadge";
import { useAppStore, useHydrated } from "@/lib/store";
import { buildAccountOverview, type CharacterOverview } from "@/lib/account-overview";
import { fmtGold, fmtNum, fmtDuration } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({
    meta: [
      { title: "Todos os personagens — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Balance, tempo jogado e rendimento combinado de todos os seus personagens, lado a lado.",
      },
      { property: "og:title", content: "Todos os personagens" },
      { property: "og:description", content: "Visão geral e comparativo entre todos os seus personagens." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: OverviewPage,
});

/** Maior valor entre os personagens com dado (>0 sessões) — usado pra destacar a coluna vencedora. */
function bestOf(rows: CharacterOverview[], value: (r: CharacterOverview) => number): number | null {
  const withData = rows.filter((r) => r.agg.sessionCount > 0);
  if (withData.length < 2) return null;
  const values = withData.map(value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max === min ? null : max;
}

function toneFor(rows: CharacterOverview[], r: CharacterOverview, value: (r: CharacterOverview) => number): string {
  if (r.agg.sessionCount === 0) return "";
  const best = bestOf(rows, value);
  if (best == null) return "";
  return value(r) === best ? "text-rubi-success font-semibold" : "";
}

function OverviewPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const imbuements = useAppStore((s) => s.imbuements);
  const expenses = useAppStore((s) => s.expenses);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);

  const overview = useMemo(
    () => buildAccountOverview(characters, sessions, imbuements, expenses, levelSnapshots),
    [characters, sessions, imbuements, expenses, levelSnapshots],
  );

  const ranked = useMemo(
    () => [...overview].sort((a, b) => b.agg.balance - a.agg.balance),
    [overview],
  );

  const totals = useMemo(
    () => ({
      balance: overview.reduce((a, r) => a + r.agg.balance, 0),
      netBalance: overview.reduce((a, r) => a + r.netBalance, 0),
      time: overview.reduce((a, r) => a + r.agg.totalTime, 0),
      sessions: overview.reduce((a, r) => a + r.agg.sessionCount, 0),
      rawXp: overview.reduce((a, r) => a + r.agg.totalRawXp, 0),
    }),
    [overview],
  );

  const timeRanked = useMemo(
    () => [...overview].filter((r) => r.agg.totalTime > 0).sort((a, b) => b.agg.totalTime - a.agg.totalTime),
    [overview],
  );

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  if (characters.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={Users}
          title="Crie seus personagens primeiro"
          description="Essa tela mostra o balance e o tempo jogado combinado de todos os seus personagens, lado a lado."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Conta</div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <Users className="h-7 w-7 text-rubi-blue" /> Todos os personagens
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O que você já farmou com {characters.length === 1 ? "seu personagem" : `os ${characters.length} personagens`}{" "}
          da sua conta, tudo somado e lado a lado.
        </p>
      </div>

      {characters.length === 1 && (
        <div className="mb-6 rounded-xl border border-border/60 bg-surface/40 p-4 text-sm text-muted-foreground">
          Você só tem 1 personagem cadastrado — os números abaixo já são o total dele. Assim que cadastrar mais
          personagens, essa tela vira um comparativo entre todos eles.{" "}
          <Link to="/characters" className="text-rubi-blue underline decoration-dotted hover:text-foreground">
            Cadastrar outro personagem
          </Link>
          .
        </div>
      )}

      {/* Hero: total combinado da conta */}
      <div className="card-surface relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rubi-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-rubi-blue/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-rubi-gold" />
              Balance global da conta
            </div>
            <div
              className={
                "mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl " +
                (totals.balance >= 0 ? "text-gradient-brand" : "text-rubi-danger")
              }
            >
              {fmtGold(totals.balance)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Somando todas as sessões de {characters.length}{" "}
              {characters.length === 1 ? "personagem" : "personagens"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:min-w-[280px]">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Tempo total jogado
              </div>
              <div className="mt-1 font-display text-lg font-semibold">{fmtDuration(totals.time)}</div>
              <div className="text-[11px] text-muted-foreground">{totals.sessions} sessões</div>
            </div>
            {totals.netBalance !== totals.balance && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Saldo atual
                </div>
                <div
                  className={
                    "mt-1 font-display text-lg font-semibold " +
                    (totals.netBalance >= 0 ? "text-rubi-success" : "text-rubi-danger")
                  }
                >
                  {fmtGold(totals.netBalance)}
                </div>
                <div className="text-[11px] text-muted-foreground">após imbuements e gastos</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Raw XP total (conta)" value={fmtNum(totals.rawXp)} icon={ScrollText} accent="blue" />
        <StatCard
          label="Personagens cadastrados"
          value={String(characters.length)}
          hint={`${overview.filter((r) => r.agg.sessionCount > 0).length} com sessões registradas`}
          icon={UserCircle2}
          accent="gold"
        />
        <StatCard
          label="Sessões totais"
          value={String(totals.sessions)}
          hint={fmtDuration(totals.time)}
          icon={Trophy}
          accent="success"
        />
      </div>

      {/* Comparativo lado a lado */}
      <div className="card-surface mt-6 overflow-hidden">
        <div className="border-b border-border/60 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Comparativo entre personagens
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Personagem
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Balance total
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Saldo atual
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Lucro/h médio
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Raw XP/h médio
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Tempo jogado
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Sessões
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => {
                const noData = r.agg.sessionCount === 0;
                return (
                  <tr key={r.character.id} className="border-b border-border/40 last:border-0">
                    <th className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left align-top">
                      <Link
                        to="/characters"
                        className="flex items-center gap-1.5 font-display text-sm font-semibold hover:text-rubi-blue"
                      >
                        {r.character.name}
                        <LevelBadge level={r.level} />
                      </Link>
                      <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                        {r.character.vocation} · {r.character.world}
                      </div>
                    </th>
                    <td className={"px-4 py-2.5 align-top font-mono " + toneFor(overview, r, (x) => x.agg.balance)}>
                      {noData ? "—" : fmtGold(r.agg.balance)}
                    </td>
                    <td className={"px-4 py-2.5 align-top font-mono " + toneFor(overview, r, (x) => x.netBalance)}>
                      {noData ? "—" : fmtGold(r.netBalance)}
                    </td>
                    <td className={"px-4 py-2.5 align-top font-mono " + toneFor(overview, r, (x) => x.agg.gph)}>
                      {noData ? "—" : fmtGold(r.agg.gph)}
                    </td>
                    <td className={"px-4 py-2.5 align-top font-mono " + toneFor(overview, r, (x) => x.agg.rawXph)}>
                      {noData ? "—" : fmtNum(r.agg.rawXph)}
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-muted-foreground">
                      {noData ? "—" : fmtDuration(r.agg.totalTime)}
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-muted-foreground">
                      {noData ? "sem sessões ainda" : r.agg.sessionCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-rubi-success">Verde</span> = melhor da coluna entre os personagens
          com sessões registradas.
        </div>
      </div>

      {/* Tempo jogado por personagem */}
      {timeRanked.length > 1 && (
        <div className="card-surface mt-6 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-rubi-blue" /> Tempo jogado por personagem
          </h2>
          <div className="space-y-3">
            {timeRanked.map((r) => {
              const pct = totals.time > 0 ? (r.agg.totalTime / totals.time) * 100 : 0;
              return (
                <div key={r.character.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 truncate font-medium">{r.character.name}</span>
                      <LevelBadge level={r.level} />
                    </span>
                    <span className="flex-none font-mono text-xs text-muted-foreground">
                      {fmtDuration(r.agg.totalTime)} · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted-foreground/15">
                    <div
                      className="h-full rounded-full bg-rubi-blue"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 text-xs text-muted-foreground">
        <Wallet className="mt-0.5 h-4 w-4 flex-none text-rubi-blue" />
        <p>
          <strong className="text-foreground">Balance total</strong> é a soma bruta de todas as sessões (
          <code>loot − supplies</code>), sem descontar nada — o mesmo número que aparece em Meu rendimento de cada
          personagem. <strong className="text-foreground">Saldo atual</strong> já desconta imbuements consumidos e
          gastos registrados. Personagens sem sessão ainda aparecem no comparativo, mas ficam de fora do destaque
          verde.
        </p>
      </div>
    </AppShell>
  );
}
