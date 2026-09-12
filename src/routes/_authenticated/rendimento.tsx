import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { errorMessage } from "@/lib/errors";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { InfoHint } from "@/components/InfoHint";
import { PasteImageBox } from "@/components/PasteImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore, useHydrated } from "@/lib/store";
import { aggregateSessions, balanceSince } from "@/lib/performance";
import { aggregateImbuements } from "@/lib/imbuements";
import { type Period, PERIODS, periodRange, formatRange, filterByPeriod } from "@/lib/period";
import { filterByLatestPatch, formatPatchDate, isPrePatch, latestPatch } from "@/lib/patches";
import { huntRawXp, parseXpAmount } from "@/lib/bounty";
import { MAX_BLESSINGS, computeDeathXpLoss, deathReduction, fractionalLevel, totalXpLost } from "@/lib/deaths";
import { fmtGold, fmtNum, fmtDuration, fmtDate } from "@/lib/format";
import { confirmDialog } from "@/lib/confirm-dialog";
import { useCountUp } from "@/lib/use-count-up";
import {
  Gauge,
  Zap,
  Coins,
  TrendingUp,
  Swords,
  Wallet,
  Trophy,
  Plus,
  Trash2,
  Target,
  PartyPopper,
  Calendar,
  AlertTriangle,
  Receipt,
  Skull,
} from "lucide-react";

const EvolutionChart = lazy(() => import("@/components/charts/EvolutionChart"));
const LevelChart = lazy(() => import("@/components/charts/LevelChart"));

export const Route = createFileRoute("/_authenticated/rendimento")({
  head: () => ({
    meta: [
      { title: "Meu rendimento — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Rendimento por período, evolução de nível e objetivos de gold do seu personagem.",
      },
      { property: "og:title", content: "Meu rendimento" },
      { property: "og:description", content: "Acompanhe seu progresso no RubinOT dia a dia." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RendimentoPage,
});

function RendimentoPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const goals = useAppStore((s) => s.goals);
  const imbuements = useAppStore((s) => s.imbuements);
  const expenses = useAppStore((s) => s.expenses);
  const deaths = useAppStore((s) => s.deaths);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const addLevelSnapshot = useAppStore((s) => s.addLevelSnapshot);
  const removeLevelSnapshot = useAppStore((s) => s.removeLevelSnapshot);
  const addGoal = useAppStore((s) => s.addGoal);
  const removeGoal = useAppStore((s) => s.removeGoal);
  const addExpense = useAppStore((s) => s.addExpense);
  const removeExpense = useAppStore((s) => s.removeExpense);
  const addDeath = useAppStore((s) => s.addDeath);
  const removeDeath = useAppStore((s) => s.removeDeath);

  const active = characters.find((c) => c.id === activeId) ?? null;
  const [tab, setTab] = useState<"overview" | "level" | "goals" | "expenses" | "deaths">("overview");
  const [period, setPeriod] = useState<Period>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const mySessions = useMemo(
    () => (active ? sessions.filter((s) => s.characterId === active.id) : []),
    [sessions, active],
  );

  const range = useMemo(
    () => periodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const periodSessions = useMemo(() => {
    return filterByPeriod(mySessions, (s) => s.createdAt, range);
  }, [mySessions, range]);

  const isAllPeriod = period === "all";
  const [includePrePatchOverview, setIncludePrePatchOverview] = useState(false);
  const patch = latestPatch();
  const prePatchCount = useMemo(
    () => (patch && isAllPeriod ? periodSessions.filter((s) => isPrePatch(s.createdAt, patch)).length : 0),
    [periodSessions, patch, isAllPeriod],
  );
  const visibleSessions = useMemo(() => {
    if (!isAllPeriod) return periodSessions;
    return filterByLatestPatch(periodSessions, (s) => s.createdAt, includePrePatchOverview);
  }, [periodSessions, isAllPeriod, includePrePatchOverview]);

  const agg = useMemo(() => aggregateSessions(visibleSessions), [visibleSessions]);

  const chartData = useMemo(
    () =>
      [...visibleSessions].reverse().map((s, i) => ({
        i: i + 1,
        name: s.huntName,
        "Raw XP/h": Math.round((huntRawXp(s) ?? 0) / (s.hunting.durationSec / 3600 || 1)),
        "Lucro/h": Math.round(s.hunting.balance / (s.hunting.durationSec / 3600 || 1)),
      })),
    [visibleSessions],
  );

  // --- Nível ---
  const myLevels = useMemo(
    () =>
      (active ? levelSnapshots.filter((l) => l.characterId === active.id) : [])
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [levelSnapshots, active],
  );
  const currentLevel = myLevels[myLevels.length - 1] ?? null;
  const levelChartData = useMemo(
    () => myLevels.map((l) => ({ date: fmtDate(l.createdAt), level: l.level })),
    [myLevels],
  );

  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [levelInput, setLevelInput] = useState("");
  const [savingLevel, setSavingLevel] = useState(false);
  const [levelError, setLevelError] = useState<string | null>(null);

  const openLevelDialog = () => {
    setLevelInput(currentLevel ? String(currentLevel.level) : "");
    setLevelError(null);
    setLevelDialogOpen(true);
  };

  const handleAddLevel = async () => {
    const lvl = Math.round(Number(levelInput));
    if (!active || !Number.isFinite(lvl) || lvl <= 0) return;
    setSavingLevel(true);
    setLevelError(null);
    try {
      await addLevelSnapshot(active.id, lvl);
      setLevelDialogOpen(false);
      setLevelInput("");
    } catch (e) {
      setLevelError(errorMessage(e));
    } finally {
      setSavingLevel(false);
    }
  };

  const handleRemoveLevel = async (id: string) => {
    const ok = await confirmDialog({ description: "Remover esse registro de nível?", tone: "danger" });
    if (!ok) return;
    try {
      await removeLevelSnapshot(id);
    } catch (e) {
      toast.error("Falha ao remover", { description: errorMessage(e) });
    }
  };

  // --- Objetivos ---
  const myGoals = useMemo(
    () => (active ? goals.filter((g) => g.characterId === active.id) : []),
    [goals, active],
  );

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrency, setGoalCurrency] = useState("Gold");
  const [goalImage, setGoalImage] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const openGoalDialog = () => {
    setGoalName("");
    setGoalTarget("");
    setGoalCurrency("Gold");
    setGoalImage(null);
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const goalAmount = Number(goalTarget.replace(/[.,\s]/g, ""));
  const goalReady = goalName.trim().length > 0 && Number.isFinite(goalAmount) && goalAmount > 0;

  const handleAddGoal = async () => {
    if (!active || !goalReady) return;
    setSavingGoal(true);
    setGoalError(null);
    try {
      await addGoal({
        characterId: active.id,
        name: goalName.trim(),
        targetAmount: Math.round(goalAmount),
        currencyLabel: goalCurrency.trim() || "Gold",
        imageUrl: goalImage,
      });
      setGoalDialogOpen(false);
    } catch (e) {
      setGoalError(errorMessage(e));
    } finally {
      setSavingGoal(false);
    }
  };

  const handleRemoveGoal = async (id: string, name: string) => {
    const ok = await confirmDialog({ description: `Remover o objetivo "${name}"?`, tone: "danger" });
    if (!ok) return;
    try {
      await removeGoal(id);
    } catch (e) {
      toast.error("Falha ao remover", { description: errorMessage(e) });
    }
  };

  // --- Gastos ---
  const myExpenses = useMemo(
    () => (active ? expenses.filter((e) => e.characterId === active.id) : []),
    [expenses, active],
  );
  const totalExpenses = useMemo(() => myExpenses.reduce((a, e) => a + e.amount, 0), [myExpenses]);
  // Saldo estimado depois de imbuements e gastos — mesma conta do "Líquido" do Dashboard,
  // pra confirmar que o gasto registrado realmente corrige a divergência.
  const lifetimeAgg = useMemo(() => aggregateSessions(mySessions), [mySessions]);
  const imbAgg = useMemo(
    () => (active ? aggregateImbuements(imbuements, sessions, active.id) : null),
    [imbuements, sessions, active],
  );
  const netBalance = lifetimeAgg.balance - (imbAgg?.totalSpent ?? 0) - totalExpenses;

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  // Duas formas de preencher o mesmo campo — nunca as duas ao mesmo tempo, senão
  // fica ambíguo qual valer. "amount" = já sei quanto gastei; "balance" = não sei,
  // mas sei o balance atual do personagem no jogo, e o sistema calcula a diferença.
  const [expenseMode, setExpenseMode] = useState<"amount" | "balance">("amount");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseGameBalance, setExpenseGameBalance] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const openExpenseDialog = () => {
    setExpenseDesc("");
    setExpenseMode("amount");
    setExpenseAmount("");
    setExpenseGameBalance("");
    setExpenseError(null);
    setExpenseDialogOpen(true);
  };

  const switchExpenseMode = (mode: "amount" | "balance") => {
    setExpenseMode(mode);
    setExpenseAmount("");
    setExpenseGameBalance("");
    setExpenseError(null);
  };

  const expenseValue = Number(expenseAmount.replace(/[.,\s]/g, ""));
  const gameBalanceValue = Number(expenseGameBalance.replace(/[.,\s]/g, ""));
  // Quanto o sistema calcula de balance hoje pra esse personagem MENOS o que o jogo
  // realmente mostra = o gasto "escondido" que ainda não tinha sido registrado.
  const impliedFromBalance = netBalance - gameBalanceValue;
  const finalAmount = expenseMode === "amount" ? expenseValue : impliedFromBalance;
  const expenseReady =
    expenseDesc.trim().length > 0 &&
    (expenseMode === "amount"
      ? Number.isFinite(expenseValue) && expenseValue > 0
      : expenseGameBalance.trim().length > 0 && Number.isFinite(gameBalanceValue) && impliedFromBalance > 0);

  const handleAddExpense = async () => {
    if (!active || !expenseReady) return;
    setSavingExpense(true);
    setExpenseError(null);
    try {
      await addExpense({
        characterId: active.id,
        description: expenseDesc.trim(),
        amount: Math.round(finalAmount),
      });
      setExpenseDialogOpen(false);
    } catch (e) {
      setExpenseError(errorMessage(e));
    } finally {
      setSavingExpense(false);
    }
  };

  const handleRemoveExpense = async (id: string, description: string) => {
    const ok = await confirmDialog({ description: `Remover o gasto "${description}"?`, tone: "danger" });
    if (!ok) return;
    try {
      await removeExpense(id);
    } catch (e) {
      toast.error("Falha ao remover", { description: errorMessage(e) });
    }
  };

  // --- Mortes ---
  const myDeaths = useMemo(
    () => (active ? deaths.filter((d) => d.characterId === active.id) : []),
    [deaths, active],
  );
  const totalXpLostValue = useMemo(
    () => (active ? totalXpLost(deaths, active.id) : 0),
    [deaths, active],
  );
  // "Raw XP total" já existe (lifetimeAgg, calculado acima pros Gastos) — só falta descontar as mortes.
  const netRawXp = lifetimeAgg.totalRawXp - totalXpLostValue;

  const [deathDialogOpen, setDeathDialogOpen] = useState(false);
  const [deathMode, setDeathMode] = useState<"formula" | "amount">("formula");
  const [deathLevel, setDeathLevel] = useState("");
  const [deathXpToNext, setDeathXpToNext] = useState("");
  const [deathBlessings, setDeathBlessings] = useState(0);
  const [deathPromoted, setDeathPromoted] = useState(false);
  const [deathAmount, setDeathAmount] = useState("");
  const [deathNote, setDeathNote] = useState("");
  const [savingDeath, setSavingDeath] = useState(false);
  const [deathError, setDeathError] = useState<string | null>(null);

  const openDeathDialog = () => {
    setDeathMode("formula");
    setDeathLevel(currentLevel ? String(currentLevel.level) : "");
    setDeathXpToNext("");
    setDeathBlessings(0);
    setDeathPromoted(false);
    setDeathAmount("");
    setDeathNote("");
    setDeathError(null);
    setDeathDialogOpen(true);
  };

  const deathLevelNum = Number(deathLevel.trim().replace(",", "."));
  const deathXpToNextNum = deathXpToNext.trim() ? parseXpAmount(deathXpToNext) : null;
  const deathEffectiveLevel =
    Number.isFinite(deathLevelNum) && deathLevelNum > 0 ? fractionalLevel(deathLevelNum, deathXpToNextNum) : null;
  const formulaXpLoss =
    deathEffectiveLevel != null
      ? computeDeathXpLoss({ level: deathEffectiveLevel, blessings: deathBlessings, promoted: deathPromoted })
      : null;
  const amountXpLoss = deathAmount.trim() ? parseXpAmount(deathAmount) : null;
  const finalXpLoss = deathMode === "formula" ? formulaXpLoss : amountXpLoss;
  const deathReady =
    Number.isFinite(deathLevelNum) &&
    deathLevelNum > 0 &&
    finalXpLoss != null &&
    finalXpLoss > 0;

  const handleAddDeath = async () => {
    if (!active || !deathReady || finalXpLoss == null) return;
    setSavingDeath(true);
    setDeathError(null);
    try {
      await addDeath({
        characterId: active.id,
        level: Math.round(deathLevelNum * 100) / 100,
        blessings: deathMode === "formula" ? deathBlessings : 0,
        promoted: deathMode === "formula" ? deathPromoted : false,
        xpLost: Math.round(finalXpLoss),
        note: deathNote.trim() || null,
      });
      setDeathDialogOpen(false);
    } catch (e) {
      setDeathError(errorMessage(e));
    } finally {
      setSavingDeath(false);
    }
  };

  const handleRemoveDeath = async (id: string) => {
    const ok = await confirmDialog({ description: "Remover esse registro de morte?", tone: "danger" });
    if (!ok) return;
    try {
      await removeDeath(id);
    } catch (e) {
      toast.error("Falha ao remover", { description: errorMessage(e) });
    }
  };

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  if (characters.length === 0 || !active) {
    return (
      <AppShell>
        <EmptyState
          icon={Gauge}
          title="Crie um personagem primeiro"
          description="Meu rendimento acompanha o progresso de um personagem específico."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
          {active.name} · {active.vocation}
        </div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <Gauge className="h-7 w-7 text-rubi-blue" /> Meu <span className="text-gradient-brand">rendimento</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desempenho por período, evolução de nível e objetivos de gold — tudo específico de {active.name}.
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
        {(
          [
            { value: "overview", label: "Visão geral", icon: TrendingUp },
            { value: "level", label: "Nível", icon: Swords },
            { value: "goals", label: "Objetivos", icon: Target },
            { value: "expenses", label: "Gastos", icon: Receipt },
            { value: "deaths", label: "Mortes", icon: Skull },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors " +
              (tab === t.value ? "bg-rubi-blue-soft text-rubi-blue" : "text-muted-foreground hover:text-foreground")
            }
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setPeriod(p.value);
                  if (p.value === "custom" && !customStart && !customEnd) {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const toInput = (d: Date) =>
                      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    setCustomStart(toInput(weekAgo));
                    setCustomEnd(toInput(today));
                  }
                }}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                  (period === p.value
                    ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                    : "border-border/60 text-muted-foreground hover:border-rubi-blue/40")
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 text-muted-foreground">
                De
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-md border border-border/60 bg-background px-2 py-1 text-foreground"
                />
              </label>
              <label className="flex items-center gap-1.5 text-muted-foreground">
                até
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-md border border-border/60 bg-background px-2 py-1 text-foreground"
                />
              </label>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatRange(range.start, range.end)}
            </span>
            {isAllPeriod && patch && prePatchCount > 0 && (
              <label
                className="flex items-center gap-1.5"
                title={`Sessões de antes do ${patch.label} (${formatPatchDate(patch)})`}
              >
                <input
                  type="checkbox"
                  checked={includePrePatchOverview}
                  onChange={(e) => setIncludePrePatchOverview(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--rubi-gold)]"
                />
                <AlertTriangle className="h-3.5 w-3.5 text-rubi-gold" /> Incluir {prePatchCount} de antes do{" "}
                {patch.label}
              </label>
            )}
          </div>

          {periodSessions.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Sem sessões nesse período"
              description="Importe uma hunt ou escolha outro período pra ver seu rendimento."
              ctaLabel="Importar sessão"
              ctaTo="/import"
            />
          ) : visibleSessions.length === 0 ? (
            <div className="card-surface p-6 text-center text-sm text-muted-foreground">
              {periodSessions.length === 1 ? "A única sessão" : `As ${periodSessions.length} sessões`} desse
              período {periodSessions.length === 1 ? "é" : "são"} de antes do{" "}
              <strong className="text-rubi-gold">{patch?.label}</strong> —{" "}
              <button
                type="button"
                onClick={() => setIncludePrePatchOverview(true)}
                className="text-rubi-gold underline decoration-dotted hover:text-foreground"
              >
                incluir mesmo assim
              </button>
              .
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Raw XP / hora"
                  value={fmtNum(agg.rawXph)}
                  hint={agg.excludedBounty > 0 ? `${agg.excludedBounty} sessão(ões) de bounty fora da média` : "valor bruto"}
                  icon={Zap}
                  accent="blue"
                />
                <StatCard label="Lucro / hora" value={fmtGold(agg.gph)} hint="gold bruto por hora" icon={Coins} accent="gold" />
                <StatCard
                  label="Balance do período"
                  value={fmtGold(agg.balance)}
                  hint={`${agg.sessionCount} sessão(ões) · ${fmtDuration(agg.totalTime)}`}
                  icon={Wallet}
                  accent={agg.balance >= 0 ? "success" : "danger"}
                />
                <StatCard
                  label="Top spot do período"
                  value={agg.bestHunt ? agg.bestHunt.name : "—"}
                  hint={agg.bestHunt ? `${fmtGold(agg.bestHunt.gph)}/h` : "sem hunt com 30min+ ainda"}
                  icon={Trophy}
                  accent="gold"
                />
              </div>

              <div className="card-surface mt-6 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Evolução no período</h2>
                    <p className="text-xs text-muted-foreground">Raw XP/h e Lucro/h sessão a sessão</p>
                  </div>
                  <InfoHint title="Evolução no período" description="O que cada eixo representa.">
                    <p>Cada ponto é uma sessão dentro do período selecionado, da mais antiga pra mais recente.</p>
                    <p>Não é média acumulada — é o desempenho sessão a sessão, útil pra ver tendência dentro do recorte escolhido.</p>
                  </InfoHint>
                </div>
                <div className="h-72 w-full">
                  <Suspense fallback={<div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />}>
                    <EvolutionChart data={chartData} />
                  </Suspense>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "level" && (
        <>
          <div className="card-surface relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rubi-success/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Nível atual</div>
                <div className="mt-2 font-display text-5xl font-bold tracking-tight text-gradient-brand">
                  {currentLevel ? currentLevel.level : "—"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {currentLevel ? `Registrado em ${fmtDate(currentLevel.createdAt)}` : "Nenhum registro ainda"}
                </div>
              </div>
              <button
                type="button"
                onClick={openLevelDialog}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-rubi-success px-4 py-2.5 text-sm font-semibold text-background shadow-glow-gold hover:opacity-90 sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Marcar nível
              </button>
            </div>
          </div>

          {myLevels.length === 0 ? (
            <div className="card-surface mt-6 p-6 text-center text-sm text-muted-foreground">
              Marque seu nível pra começar a ver a evolução aqui.
            </div>
          ) : (
            <>
              <div className="card-surface mt-6 p-5">
                <h2 className="mb-4 text-base font-semibold">Evolução de nível</h2>
                <div className="h-64 w-full">
                  <Suspense fallback={<div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />}>
                    <LevelChart data={levelChartData} />
                  </Suspense>
                </div>
              </div>

              <div className="card-surface mt-6 p-5">
                <h2 className="mb-3 text-base font-semibold">Histórico</h2>
                <ul className="space-y-1.5">
                  {myLevels
                    .slice()
                    .reverse()
                    .map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                      >
                        <span className="font-mono font-semibold text-rubi-success">Level {l.level}</span>
                        <span className="text-xs text-muted-foreground">{fmtDate(l.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLevel(l.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                          aria-label="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}

          <Dialog open={levelDialogOpen} onOpenChange={(o) => !savingLevel && setLevelDialogOpen(o)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Marcar nível</DialogTitle>
                <DialogDescription>Salva um novo ponto na sua linha de evolução.</DialogDescription>
              </DialogHeader>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nível</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={levelInput}
                  onChange={(e) => setLevelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddLevel();
                  }}
                  placeholder="Ex: 250"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-success"
                />
              </label>
              {levelError && (
                <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                  {levelError}
                </p>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setLevelDialogOpen(false)}
                  disabled={savingLevel}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddLevel}
                  disabled={savingLevel || !levelInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-success px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {savingLevel ? "Salvando..." : "Salvar"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {tab === "goals" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              O progresso soma o lucro das suas hunts feitas depois que cada objetivo foi criado.
            </p>
            <button
              type="button"
              onClick={openGoalDialog}
              className="inline-flex flex-none items-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background shadow-glow-gold hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Novo objetivo
            </button>
          </div>

          {myGoals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhum objetivo ainda"
              description='Crie um objetivo (ex: "Boots of Haste — 2M gold") e acompanhe o progresso conforme suas hunts.'
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  progress={Math.max(0, balanceSince(mySessions, active.id, g.createdAt))}
                  onRemove={() => handleRemoveGoal(g.id, g.name)}
                />
              ))}
            </div>
          )}

          <Dialog open={goalDialogOpen} onOpenChange={(o) => !savingGoal && setGoalDialogOpen(o)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo objetivo</DialogTitle>
                <DialogDescription>O progresso é calculado automaticamente a partir das suas próximas hunts.</DialogDescription>
              </DialogHeader>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome do objetivo</span>
                <input
                  autoFocus
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Ex: Boots of Haste"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Valor alvo</span>
                  <input
                    inputMode="numeric"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="Ex: 2000000"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Moeda</span>
                  <input
                    value={goalCurrency}
                    onChange={(e) => setGoalCurrency(e.target.value)}
                    placeholder="Gold / Rubini Coins"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Imagem do item (opcional)
                </span>
                <PasteImageBox value={goalImage} onChange={setGoalImage} label="Cole a imagem/sprite (Ctrl+V)" className="mt-2" />
              </div>

              {goalError && (
                <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                  {goalError}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setGoalDialogOpen(false)}
                  disabled={savingGoal}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddGoal}
                  disabled={savingGoal || !goalReady}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {savingGoal ? "Salvando..." : "Criar objetivo"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {tab === "expenses" && (
        <>
          <div className="card-surface relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rubi-danger/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total gasto</div>
                <div className="mt-2 font-display text-5xl font-bold tracking-tight text-rubi-danger">
                  {fmtGold(totalExpenses)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {myExpenses.length === 0
                    ? "Nenhum gasto registrado ainda"
                    : `${myExpenses.length} registro${myExpenses.length === 1 ? "" : "s"}`}
                  {" · "}Saldo após imbuements e gastos:{" "}
                  <span className={"font-semibold " + (netBalance >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
                    {fmtGold(netBalance)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={openExpenseDialog}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-rubi-danger px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Registrar gasto
              </button>
            </div>
          </div>

          {myExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhum gasto registrado ainda"
              description='Comprou algo dentro do jogo com o gold acumulado? Registre aqui — descrição, valor e data ficam salvos, e o saldo mostrado no Dashboard passa a considerar isso.'
            />
          ) : (
            <div className="card-surface mt-6 p-5">
              <h2 className="mb-3 text-base font-semibold">Histórico de gastos</h2>
              <ul className="space-y-1.5">
                {myExpenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 basis-full truncate sm:basis-auto sm:flex-1" title={e.description}>
                      {e.description}
                    </span>
                    <span className="flex-none font-mono font-semibold text-rubi-danger">−{fmtGold(e.amount)}</span>
                    <span className="flex-none text-xs text-muted-foreground">{fmtDate(e.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(e.id, e.description)}
                      className="flex-none rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Dialog open={expenseDialogOpen} onOpenChange={(o) => !savingExpense && setExpenseDialogOpen(o)}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Registrar gasto</DialogTitle>
                <DialogDescription>
                  Uma compra paga com o gold acumulado, fora do fluxo de hunts — ex.: um item comprado no mercado.
                </DialogDescription>
              </DialogHeader>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">O que foi</span>
                <input
                  autoFocus
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ex: Falcon Mace comprada no mercado"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                />
              </label>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Como você quer informar
                </span>
                <div className="mt-1.5 flex rounded-lg border border-border p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => switchExpenseMode("amount")}
                    className={
                      "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors " +
                      (expenseMode === "amount"
                        ? "bg-rubi-danger/15 text-rubi-danger"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    Sei quanto gastei
                  </button>
                  <button
                    type="button"
                    onClick={() => switchExpenseMode("balance")}
                    className={
                      "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors " +
                      (expenseMode === "balance"
                        ? "bg-rubi-danger/15 text-rubi-danger"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    Só sei meu balance atual
                  </button>
                </div>
              </div>

              {expenseMode === "amount" ? (
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Valor gasto (gold)
                  </span>
                  <input
                    inputMode="numeric"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddExpense();
                    }}
                    placeholder="Ex: 15000000"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Balance atual no jogo (gold)
                  </span>
                  <input
                    inputMode="numeric"
                    value={expenseGameBalance}
                    onChange={(e) => setExpenseGameBalance(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddExpense();
                    }}
                    placeholder="Ex: 160000000"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Hoje o sistema calcula <strong className="text-foreground">{fmtGold(netBalance)}</strong> de
                    balance pra {active?.name} — a diferença pro que você digitar vira o gasto registrado.
                  </p>
                  {expenseGameBalance.trim().length > 0 && Number.isFinite(gameBalanceValue) && (
                    <p
                      className={
                        "mt-1.5 text-xs font-semibold " +
                        (impliedFromBalance > 0 ? "text-rubi-danger" : "text-muted-foreground")
                      }
                    >
                      {impliedFromBalance > 0
                        ? `Isso representa um gasto de ${fmtGold(impliedFromBalance)}.`
                        : "Esse balance é maior ou igual ao que o sistema já calcula — nada a registrar aqui."}
                    </p>
                  )}
                </label>
              )}
              {expenseError && (
                <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                  {expenseError}
                </p>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseDialogOpen(false)}
                  disabled={savingExpense}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  disabled={savingExpense || !expenseReady}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {savingExpense ? "Salvando..." : "Registrar"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {tab === "deaths" && (
        <>
          <div className="card-surface relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rubi-danger/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  <Skull className="h-3.5 w-3.5 text-rubi-danger" />
                  XP perdida em mortes
                  <InfoHint title="Perda de XP na morte" description="Como o Tibia calcula quanto de XP você perde ao morrer.">
                    <p>
                      Até o <strong>level 23</strong>: perde <strong>10%</strong> flat de todo o XP acumulado. Do{" "}
                      <strong>level 24</strong> em diante:{" "}
                      <code>((level+50)/100) × 50×(level²−5×level+8)</code> pontos de XP — fórmula oficial do Tibia.
                    </p>
                    <p>
                      Essa perda-base é reduzida por <strong>personagem promoted (−30%)</strong> e{" "}
                      <strong>cada bênção ativa (−8%, até 7)</strong>. Com tudo ativo o teto é <strong>−86%</strong> —
                      confirmado no próprio painel de Blessings do RubinOT.
                    </p>
                    <p>
                      Quanto mais preciso o level (com decimais), mais exata a conta. Se souber quanto de XP falta
                      pro próximo level (o jogo mostra esse valor), informe — o sistema deriva o decimal certinho
                      sozinho. Sem isso, só o level inteiro já funciona, só que um pouco menos preciso.
                    </p>
                    <p>Já sabe o valor exato que perdeu? Dá pra digitar direto, sem precisar de level/bênçãos.</p>
                    <p>
                      <strong>Raw XP líquida:</strong> <code>Raw XP total − XP perdida em mortes</code> — mesmo
                      espírito do Saldo atual do gold, só que pra experiência.
                    </p>
                  </InfoHint>
                </div>
                <div className="mt-2 font-display text-4xl font-bold tracking-tight text-rubi-danger sm:text-5xl">
                  {fmtNum(totalXpLostValue)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {myDeaths.length === 0
                    ? "Nenhuma morte registrada ainda"
                    : `${myDeaths.length} morte${myDeaths.length === 1 ? "" : "s"} registrada${myDeaths.length === 1 ? "" : "s"}`}
                  {" · "}Raw XP líquida: <span className="font-semibold text-foreground">{fmtNum(netRawXp)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={openDeathDialog}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-rubi-danger px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90 sm:self-auto"
              >
                <Plus className="h-4 w-4" /> Registrar morte
              </button>
            </div>
          </div>

          {myDeaths.length === 0 ? (
            <EmptyState
              icon={Skull}
              title="Nenhuma morte registrada ainda"
              description="Morreu numa hunt? Registre aqui pra ver a Raw XP líquida de verdade — o Raw XP total já descontando o que a morte tirou."
            />
          ) : (
            <div className="card-surface mt-6 p-5">
              <h2 className="mb-3 text-base font-semibold">Histórico de mortes</h2>
              <ul className="space-y-1.5">
                {myDeaths.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="flex-none font-mono font-semibold">Level {d.level}</span>
                    <span className="flex-none text-xs text-muted-foreground">
                      {d.promoted ? "promoted" : "não promoted"} · {d.blessings} bênção{d.blessings === 1 ? "" : "s"}
                    </span>
                    {d.note && (
                      <span
                        className="min-w-0 basis-full truncate text-xs text-muted-foreground sm:basis-auto sm:flex-1"
                        title={d.note}
                      >
                        {d.note}
                      </span>
                    )}
                    <span className="flex-none font-mono font-semibold text-rubi-danger">−{fmtNum(d.xpLost)} xp</span>
                    <span className="flex-none text-xs text-muted-foreground">{fmtDate(d.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeath(d.id)}
                      className="flex-none rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Dialog open={deathDialogOpen} onOpenChange={(o) => !savingDeath && setDeathDialogOpen(o)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar morte</DialogTitle>
                <DialogDescription>
                  Calcula a XP perdida pela fórmula oficial do Tibia, ou você informa o valor exato se já souber.
                </DialogDescription>
              </DialogHeader>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Level no momento da morte
                </span>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={deathLevel}
                  onChange={(e) => setDeathLevel(e.target.value)}
                  placeholder="Ex: 245"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                />
              </label>

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Como você quer informar a perda
                </span>
                <div className="mt-1.5 flex rounded-lg border border-border p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeathMode("formula")}
                    className={
                      "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors " +
                      (deathMode === "formula"
                        ? "bg-rubi-danger/15 text-rubi-danger"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    Calcular pela fórmula
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeathMode("amount")}
                    className={
                      "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors " +
                      (deathMode === "amount"
                        ? "bg-rubi-danger/15 text-rubi-danger"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    Sei quanto perdi
                  </button>
                </div>
              </div>

              {deathMode === "formula" ? (
                <>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      XP faltando pro próximo level <span className="opacity-60">(opcional, deixa mais preciso)</span>
                    </span>
                    <input
                      inputMode="numeric"
                      value={deathXpToNext}
                      onChange={(e) => setDeathXpToNext(e.target.value)}
                      placeholder="Ex: 1.2kk"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                    />
                  </label>

                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Bênçãos ativas
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Array.from({ length: MAX_BLESSINGS + 1 }, (_, n) => n).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setDeathBlessings(n)}
                          className={
                            "h-8 w-8 rounded-md border text-xs font-semibold transition-colors " +
                            (deathBlessings === n
                              ? "border-rubi-danger bg-rubi-danger/15 text-rubi-danger"
                              : "border-border/60 text-muted-foreground hover:border-rubi-danger/40")
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={deathPromoted}
                      onChange={(e) => setDeathPromoted(e.target.checked)}
                      className="h-4 w-4 accent-[var(--rubi-danger)]"
                    />
                    Personagem promoted
                  </label>

                  {deathEffectiveLevel != null && formulaXpLoss != null && (
                    <p className="rounded-lg border border-rubi-danger/30 bg-rubi-danger/5 p-2.5 text-xs text-muted-foreground">
                      Perda estimada: <strong className="text-rubi-danger">{fmtNum(formulaXpLoss)} XP</strong>
                      {" "}({Math.round(deathReduction(deathBlessings, deathPromoted) * 100)}% de redução sobre a
                      perda-base)
                    </p>
                  )}
                </>
              ) : (
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">XP perdida</span>
                  <input
                    inputMode="numeric"
                    value={deathAmount}
                    onChange={(e) => setDeathAmount(e.target.value)}
                    placeholder="Ex: 2.5kk"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Observação <span className="opacity-60">(opcional)</span>
                </span>
                <input
                  value={deathNote}
                  onChange={(e) => setDeathNote(e.target.value)}
                  placeholder="Ex: morri pra um boss no Rotten Blade"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                />
              </label>

              {deathError && (
                <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                  {deathError}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDeathDialogOpen(false)}
                  disabled={savingDeath}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddDeath}
                  disabled={savingDeath || !deathReady}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {savingDeath ? "Salvando..." : "Registrar"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AppShell>
  );
}

function GoalCard({
  goal,
  progress,
  onRemove,
}: {
  goal: { id: string; name: string; targetAmount: number; currencyLabel: string; imageUrl: string | null };
  progress: number;
  onRemove: () => void;
}) {
  const clamped = Math.min(progress, goal.targetAmount);
  const animated = useCountUp(clamped);
  const pct = (clamped / goal.targetAmount) * 100;
  const done = progress >= goal.targetAmount;

  return (
    <div
      className={
        "card-surface relative overflow-hidden p-4 transition-shadow " +
        (done ? "border-rubi-gold shadow-glow-gold" : "")
      }
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
        aria-label="Remover objetivo"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-lg border border-border bg-background/60">
          {goal.imageUrl ? (
            <img src={goal.imageUrl} alt={goal.name} className="h-full w-full object-contain" />
          ) : (
            <Target className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold">{goal.name}</div>
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
            {fmtGold(animated)} <span className="opacity-60">/ {fmtGold(goal.targetAmount)}</span> {goal.currencyLabel}
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-accent">
        <div
          className={"h-full rounded-full transition-all duration-1000 ease-out " + (done ? "bg-rubi-gold" : "bg-rubi-blue")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{Math.min(100, Math.round(pct))}% concluído</span>
        {done && (
          <span className="inline-flex items-center gap-1 font-semibold text-rubi-gold">
            <PartyPopper className="h-3 w-3" /> Objetivo alcançado!
          </span>
        )}
      </div>
    </div>
  );
}
