import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { InfoHint } from "@/components/InfoHint";
import { RendimentoNudge } from "@/components/RendimentoNudge";
import { useAppStore, useHydrated } from "@/lib/store";
import { aggregateImbuements, IMB_DURATION_HOURS } from "@/lib/imbuements";
import { totalXpLost } from "@/lib/deaths";
import { fmtGold, fmtNum, fmtDuration, fmtDate } from "@/lib/format";
import { huntRawXp } from "@/lib/bounty";
import { MIN_HUNT_DURATION_SEC } from "@/lib/compare";
import { aggregateSessions } from "@/lib/performance";
import { filterByLatestPatch, latestPatch } from "@/lib/patches";
import {
  Coins, Zap, Trophy, Swords, TrendingUp, Upload, ScrollText, Sparkles, Wallet, X, Skull,
} from "lucide-react";
import { currentLevel } from "@/lib/level";
import { LevelQuickAdd } from "@/components/LevelQuickAdd";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";

// Recharts é pesado: carrega depois do primeiro paint do dashboard.
const EvolutionChart = lazy(() => import("@/components/charts/EvolutionChart"));


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RubinOT Hunt Tracker" },
      { name: "description", content: "Acompanhe suas hunts no RubinOT: Raw Raw XP/h, lucro/h e evolução." },
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
  const expenses = useAppStore((s) => s.expenses);
  const deaths = useAppStore((s) => s.deaths);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const activeId = useAppStore((s) => s.activeCharacterId);


  const active = characters.find((c) => c.id === activeId) ?? null;
  const activeCharLevel = active ? currentLevel(levelSnapshots, active.id) : null;

  // Aviso de level ausente — dispensa por personagem, guardado localmente. Pega
  // principalmente quem usa o app desde antes dessa opção existir e talvez nem
  // tenha visto que dava pra registrar.
  const [levelNudgeDismissed, setLevelNudgeDismissed] = useState(true);
  useEffect(() => {
    if (!active) return;
    try {
      setLevelNudgeDismissed(localStorage.getItem(`level-nudge-dismissed:${active.id}`) === "1");
    } catch {
      setLevelNudgeDismissed(false);
    }
  }, [active]);
  const dismissLevelNudge = () => {
    setLevelNudgeDismissed(true);
    if (!active) return;
    try {
      localStorage.setItem(`level-nudge-dismissed:${active.id}`, "1");
    } catch {
      // sem localStorage, o aviso só fica dispensado nesta sessão
    }
  };
  const mySessions = useMemo(
    () => (active ? sessions.filter((s) => s.characterId === active.id) : []),
    [sessions, active],
  );

  // Top spot ignora sessões de antes do último marco de balanceamento por padrão — a explicação
  // completa mora no aviso global (PatchAnnouncementBanner), não repetida aqui.
  const patch = latestPatch();
  const postPatchSessions = useMemo(
    () => filterByLatestPatch(mySessions, (s) => s.createdAt, false),
    [mySessions],
  );
  const prePatchCount = mySessions.length - postPatchSessions.length;

  const agg = useMemo(() => aggregateSessions(mySessions, postPatchSessions), [mySessions, postPatchSessions]);


  const imbAgg = useMemo(
    () => (active ? aggregateImbuements(imbuements, sessions, active.id) : null),
    [imbuements, sessions, active],
  );
  const myExpenses = useMemo(
    () => (active ? expenses.filter((e) => e.characterId === active.id) : []),
    [expenses, active],
  );
  const totalSpentOnPurchases = useMemo(() => myExpenses.reduce((a, e) => a + e.amount, 0), [myExpenses]);
  const netBalance = agg.balance - (imbAgg?.totalSpent ?? 0) - totalSpentOnPurchases;

  const myDeaths = useMemo(
    () => (active ? deaths.filter((d) => d.characterId === active.id) : []),
    [deaths, active],
  );
  const deathsXpLost = useMemo(() => (active ? totalXpLost(deaths, active.id) : 0), [deaths, active]);
  const netRawXp = agg.totalRawXp - deathsXpLost;



  const chartData = useMemo(
    () =>
      [...mySessions].reverse().map((s, i) => ({
        i: i + 1,
        name: s.huntName,
        "Raw XP/h": Math.round((huntRawXp(s) ?? 0) / (s.hunting.durationSec / 3600 || 1)),
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
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {active ? (
              <>Olá, <span className="text-gradient-brand">{active.name}</span></>
            ) : (
              <>Bem-vindo, caçador</>
            )}
            {active && <RendimentoNudge />}
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

      {hydrated && active && mySessions.length > 0 && activeCharLevel == null && !levelNudgeDismissed && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rubi-gold/40 bg-rubi-gold/[0.06] p-4">
          <Swords className="mt-0.5 h-5 w-5 flex-none text-rubi-gold" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rubi-gold">
              Ainda não registramos o level de {active.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              É opcional, mas ajuda a acompanhar sua evolução em Meu rendimento — se você usa o app desde antes
              dessa opção existir, talvez nem tenha visto ainda. Registre aqui ou na próxima sessão que importar.
            </p>
            <div className="mt-2.5">
              {/* key força remontar ao trocar de personagem — evita salvar um level digitado
                  pra um personagem no registro de outro depois de uma troca. */}
              <LevelQuickAdd key={active.id} characterId={active.id} currentLevel={null} onSaved={dismissLevelNudge} />
            </div>
          </div>
          <button
            type="button"
            onClick={dismissLevelNudge}
            aria-label="Dispensar aviso"
            className="flex-none rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                  Saldo atual
                  <InfoHint title="Saldo atual" description="Quanto de gold o personagem ativo tem, hoje.">
                    <p>Soma do balance de todas as sessões, já <strong>descontando</strong> imbuements consumidos e gastos registrados.</p>
                    <p>O balance bruto (sem descontos), o detalhe do que foi gasto e a evolução no tempo ficam em <strong>Meu rendimento</strong>.</p>
                    <p><strong>Top spot:</strong> hunt (agrupada por nome) com maior <code>balance / horas</code>, entre as que já somam pelo menos {fmtDuration(MIN_HUNT_DURATION_SEC)} de sessões.</p>
                    {latestPatch() && <p>O Top spot ignora sessões de antes do último balanceamento do servidor ({latestPatch()!.label}).</p>}
                  </InfoHint>
                </div>
                <div className={"mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl " + (netBalance >= 0 ? "text-gradient-brand" : "text-rubi-danger")}>
                  {fmtGold(netBalance)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {agg.bestHunt ? (
                    <>Top spot: <span className="text-foreground/80">{agg.bestHunt.name}</span></>
                  ) : patch && prePatchCount > 0 ? (
                    `ainda sem dados suficientes desde o ${patch.label} — falta caçar mais um pouco`
                  ) : (
                    `nenhuma hunt com ${fmtDuration(MIN_HUNT_DURATION_SEC)} ou mais registrada ainda`
                  )}
                </div>
              </div>
              <div className="flex-none">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tempo jogado</div>
                <div className="mt-1 font-display text-lg font-semibold">{fmtDuration(agg.totalTime)}</div>
                <div className="text-[11px] text-muted-foreground">{mySessions.length} sessões</div>
              </div>
            </div>
          </div>

          {/* XP */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-blue">
              <Zap className="h-3.5 w-3.5" /> Experiência
              <InfoHint title="Experiência" description="Como a Raw XP/h, a Raw XP total e a XP líquida são calculadas.">
                <p><strong>Raw XP total:</strong> <code>Σ rawXp</code> de cada sessão (é o <em>Raw XP Gain</em> do Hunting Analyser — valor bruto, sem bônus de stamina/XP boost/evento).</p>
                <p><strong>Raw XP / hora (média):</strong> <code>Raw XP total ÷ horas caçadas consideradas</code>. Média ponderada pelo tempo, então hunts longas pesam mais que curtas.</p>
                <p><strong>Bounty Task:</strong> quando você marca uma sessão como tendo bônus de Bounty e informa a XP do bônus, ela é descontada da Raw XP. Se o valor não for informado, a sessão fica fora das médias de Raw XP.</p>
                <p>A <em>XP com bônus</em> (<code>XP Gain</code>) aparece como valor secundário — ela varia conforme os bônus ativos, por isso a Raw XP é a referência principal.</p>
                <p><strong>XP líquida:</strong> <code>Raw XP total − XP perdida em mortes</code>. Toda morte no Tibia desconta XP (10% flat até o level 23, uma fórmula do level 24+ em diante — reduzida por promoted e bênçãos). Registre suas mortes em <strong>Meu rendimento → Mortes</strong> pra esse número aparecer aqui.</p>
              </InfoHint>
            </div>
            <div className={"grid grid-cols-1 gap-4 " + (myDeaths.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
              <StatCard
                label="Raw XP / hora (média)"
                value={fmtNum(agg.rawXph)}
                hint={
                  agg.excludedBounty > 0
                    ? `sem bônus · ${agg.excludedBounty} sessão(ões) de bounty fora da média`
                    : "valor bruto, sem bônus"
                }
                icon={Zap}
                accent="blue"
              />
              <StatCard
                label="Raw XP total"
                value={fmtNum(agg.totalRawXp)}
                hint={`em ${fmtDuration(agg.xpTime)} · ${fmtNum(agg.totalXp)} XP com bônus`}
                icon={TrendingUp}
                accent="blue"
              />
              {myDeaths.length > 0 && (
                <StatCard
                  label="Raw XP líquida"
                  value={fmtNum(netRawXp)}
                  hint={`${fmtNum(deathsXpLost)} perdidos em ${myDeaths.length} morte${myDeaths.length === 1 ? "" : "s"}`}
                  icon={Skull}
                  accent={netRawXp >= 0 ? "blue" : "danger"}
                />
              )}
            </div>

          </div>

          {/* Gold */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-gold">
              <Coins className="h-3.5 w-3.5" /> Ouro
              <InfoHint title="Ouro" description="Ritmo de lucro das hunts.">
                <p><strong>Lucro / hora (média):</strong> <code>Σ (loot − supplies) ÷ horas totais</code>. Média ponderada pelo tempo — igual a rodar todas as suas hunts como uma só e dividir pelo tempo real. Não desconta imbuements nem gastos.</p>
                <p>Pode ficar negativo se você gastou mais em supplies do que fez em loot.</p>
                <p>O balance acumulado sem descontos e a evolução no tempo ficam em <strong>Meu rendimento</strong>.</p>
              </InfoHint>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <StatCard label="Lucro / hora (média)" value={fmtGold(agg.gph)} hint="gold bruto por hora, sem descontar imbuements/gastos" icon={Coins} accent="gold" />
            </div>
          </div>

          {imbAgg && imbAgg.rows.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-gold">
                <Sparkles className="h-3.5 w-3.5" /> Imbuements
                <InfoHint title="Imbuements" description="Como o custo dos imbuements é diluído nas hunts.">
                  <p>Todo imbuement dura <strong>{IMB_DURATION_HOURS}h</strong> de caça no jogo. O custo total é <code>preço do tier + Gold Token</code>.</p>
                  <p><strong>Custo / hora (ativo):</strong> <code>Σ (custo total ÷ {IMB_DURATION_HOURS}h)</code> de cada imbuement ainda ativo. É quanto você "queima" de gold por hora enquanto está com os imbuements ligados.</p>
                  <p><strong>Consumido:</strong> para cada imbuement, somamos as horas caçadas <em>depois</em> do registro (até o limite das horas restantes informadas) e multiplicamos por <code>custo/hora</code>. Sessões anteriores ao registro não amortizam nada — por isso pode aparecer 0.</p>
                  <p><strong>Saldo atual:</strong> <code>balance das sessões − imbuements consumidos − gastos registrados</code>.</p>
                  <p><strong>Projeção líquida / h:</strong> <code>Lucro/h médio − Custo/h ativo</code>. Se ficar positivo, o imbuement se paga; negativo, custa mais do que rende.</p>
                </InfoHint>
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
                  label="Saldo atual"
                  value={fmtGold(netBalance)}
                  hint="balance − imbuements consumidos e gastos"
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
                  <p className="text-xs text-muted-foreground">Raw XP/h e Lucro/h nas últimas hunts</p>
                </div>
                <div className="flex items-center gap-1">
                  <InfoHint title="Evolução por sessão" description="O que cada eixo representa.">
                    <p>Cada ponto no eixo X é uma sessão importada, da mais antiga (1) para a mais recente.</p>
                    <p><strong>Raw XP/h (azul, eixo esquerdo):</strong> <code>rawXp ÷ (duração em horas)</code> daquela sessão isolada — o <em>Raw XP Gain</em> do Hunting Analyser, sem bônus.</p>

                    <p><strong>Lucro/h (dourado, eixo direito):</strong> <code>balance ÷ (duração em horas)</code> daquela sessão isolada.</p>
                    <p>Não é média acumulada — é o desempenho hunt a hunt, útil para ver tendências.</p>
                  </InfoHint>
                  <TrendingUp className="h-4 w-4 text-rubi-blue" />
                </div>
              </div>
              <div className="h-72 w-full">
                <Suspense fallback={<div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />}>
                  <EvolutionChart data={chartData} />
                </Suspense>
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
                        <div className="text-xs text-muted-foreground">
                          {huntRawXp(s) == null
                            ? "bounty · raw xp/h n/d"
                            : `${fmtNum((huntRawXp(s) as number) / (s.hunting.durationSec / 3600 || 1))} raw xp/h`}
                        </div>
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
