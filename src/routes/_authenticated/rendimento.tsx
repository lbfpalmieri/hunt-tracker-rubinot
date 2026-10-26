import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTabs } from "@/components/nav/PageTabs";
import { PageSkeleton } from "@/components/PageSkeleton";
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
import { aggregateSessions } from "@/lib/performance";
import { goalProgress, netGoldBalance, sumAdjustments } from "@/lib/gold-balance";
import { daysToComplete, goalFromForm, goalMissing, goalToForm, splitGoals } from "@/lib/goals";
import { BalanceAdjustDialog } from "@/components/BalanceAdjustDialog";
import { aggregateImbuements } from "@/lib/imbuements";
import { type Period, PERIODS, periodRange, formatRange, filterByPeriod, fmtDay } from "@/lib/period";
import { filterByLatestPatch, formatPatchDate, isPrePatch, latestPatch } from "@/lib/patches";
import { huntRawXp, parseXpAmount } from "@/lib/bounty";
import { detectDeathLoss, totalXpLost } from "@/lib/deaths";
import { parseHunting } from "@/lib/parser";
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
  ChevronsUp,
  Star,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { levelGainInRange } from "@/lib/level";

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
  const goldAdjustments = useAppStore((s) => s.goldAdjustments);
  const deaths = useAppStore((s) => s.deaths);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const addLevelSnapshot = useAppStore((s) => s.addLevelSnapshot);
  const removeLevelSnapshot = useAppStore((s) => s.removeLevelSnapshot);
  const addGoal = useAppStore((s) => s.addGoal);
  const removeGoal = useAppStore((s) => s.removeGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const setGoalCompleted = useAppStore((s) => s.setGoalCompleted);
  const setMainGoal = useAppStore((s) => s.setMainGoal);
  const removeGoldAdjustment = useAppStore((s) => s.removeGoldAdjustment);
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
        // Sessão sem XP conhecido (bounty sem valor, party só com o Party Hunt) fica de fora do
        // gráfico (null = sem ponto) em vez de aparecer como 0 e derrubar a linha.
        "Raw XP/h":
          huntRawXp(s) == null
            ? null
            : Math.round((huntRawXp(s) as number) / (s.hunting.durationSec / 3600 || 1)),
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
  const levelGain = useMemo(
    () => (active ? levelGainInRange(levelSnapshots, active.id, range) : null),
    [levelSnapshots, active, range],
  );
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

  const { active: activeGoals, completed: completedGoals } = useMemo(() => splitGoals(myGoals), [myGoals]);

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  // Objetivo sendo editado (null = criando um novo) — o mesmo formulário serve pros dois.
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrency, setGoalCurrency] = useState("Gold");
  const [goalImage, setGoalImage] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const openGoalDialog = () => {
    setEditingGoalId(null);
    setGoalName("");
    setGoalTarget("");
    setGoalCurrency("Gold");
    setGoalImage(null);
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const openEditGoal = (g: (typeof myGoals)[number]) => {
    const form = goalToForm(g);
    setEditingGoalId(g.id);
    setGoalName(form.name);
    setGoalTarget(form.target);
    setGoalCurrency(form.currency);
    setGoalImage(form.imageUrl);
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const goalFields = goalFromForm({ name: goalName, target: goalTarget, currency: goalCurrency, imageUrl: goalImage });
  const goalReady = goalFields != null;

  const handleSaveGoal = async () => {
    if (!active || !goalFields) return;
    setSavingGoal(true);
    setGoalError(null);
    try {
      if (editingGoalId) {
        await updateGoal(editingGoalId, goalFields);
        toast.success(`Objetivo "${goalFields.name}" atualizado`);
      } else {
        await addGoal({ characterId: active.id, ...goalFields });
      }
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

  // Conquistado: sai da lista de andamento e vai pros Conquistados (dá pra reabrir).
  const handleCompleteGoal = async (g: (typeof myGoals)[number], progress: number) => {
    const missing = goalMissing(g.targetAmount, progress);
    if (missing > 0) {
      const ok = await confirmDialog({
        title: "Marcar como conquistado?",
        description: `Ainda faltam ${fmtGold(missing)} ${g.currencyLabel} pra "${g.name}" pelo progresso do app. Marcar como conquistado mesmo assim?`,
        confirmLabel: "Marcar conquistado",
      });
      if (!ok) return;
    }
    try {
      await setGoalCompleted(g.id, true);
      toast.success(`"${g.name}" conquistado!`, {
        description: g.isMain ? "Ele deixou de ser o principal: escolha outro pra contar o seu saldo." : undefined,
      });
    } catch (e) {
      toast.error("Não consegui salvar", { description: errorMessage(e) });
    }
  };

  const handleReopenGoal = async (g: (typeof myGoals)[number]) => {
    try {
      await setGoalCompleted(g.id, false);
      toast.success(`"${g.name}" voltou pra Em andamento`);
    } catch (e) {
      toast.error("Não consegui salvar", { description: errorMessage(e) });
    }
  };

  // Objetivo principal: conta o saldo atual inteiro (1 por personagem; clicar de novo desmarca).
  const [savingMain, setSavingMain] = useState(false);
  const handleToggleMain = async (id: string, name: string, isMain: boolean) => {
    if (!active || savingMain) return;
    setSavingMain(true);
    try {
      await setMainGoal(active.id, isMain ? null : id);
      toast.success(isMain ? `"${name}" deixou de ser o objetivo principal` : `"${name}" agora é o objetivo principal`);
    } catch (e) {
      toast.error("Não consegui salvar", { description: errorMessage(e) });
    } finally {
      setSavingMain(false);
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
  const myAdjustments = useMemo(
    () => (active ? goldAdjustments.filter((a) => a.characterId === active.id) : []),
    [goldAdjustments, active],
  );
  const totalAdjustments = active ? sumAdjustments(goldAdjustments, active.id) : 0;
  const netBalance = netGoldBalance({
    sessionsBalance: lifetimeAgg.balance,
    imbuementsSpent: imbAgg?.totalSpent ?? 0,
    expensesSpent: totalExpenses,
    adjustments: totalAdjustments,
  });
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);

  const handleRemoveAdjustment = async (id: string, description: string) => {
    const ok = await confirmDialog({ description: `Remover o ajuste de saldo "${description}"?`, tone: "danger" });
    if (!ok) return;
    try {
      await removeGoldAdjustment(id);
    } catch (e) {
      toast.error("Falha ao remover", { description: errorMessage(e) });
    }
  };

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

  // O próprio Tibia já desconta bênçãos/promotion na hora de calcular a perda —
  // não precisamos recalcular nada. Padrão é colar o Hunting Analyser (a mesma
  // detecção usada na importação); "sei o valor" fica de reserva pra quem não
  // tem o texto à mão (ex.: uma morte antiga, sem print salvo).
  const [deathDialogOpen, setDeathDialogOpen] = useState(false);
  const [deathMode, setDeathMode] = useState<"paste" | "amount">("paste");
  const [deathPasteText, setDeathPasteText] = useState("");
  const [deathAmount, setDeathAmount] = useState("");
  const [deathNote, setDeathNote] = useState("");
  const [savingDeath, setSavingDeath] = useState(false);
  const [deathError, setDeathError] = useState<string | null>(null);

  const openDeathDialog = () => {
    setDeathMode("paste");
    setDeathPasteText("");
    setDeathAmount("");
    setDeathNote("");
    setDeathError(null);
    setDeathDialogOpen(true);
  };

  const detectedFromPaste = useMemo(() => {
    if (!deathPasteText.trim()) return null;
    try {
      return detectDeathLoss(parseHunting(deathPasteText));
    } catch {
      return null;
    }
  }, [deathPasteText]);
  const amountXpLoss = deathAmount.trim() ? parseXpAmount(deathAmount) : null;
  const finalXpLoss = deathMode === "paste" ? detectedFromPaste : amountXpLoss;
  const deathReady = finalXpLoss != null && finalXpLoss > 0;

  const handleAddDeath = async () => {
    if (!active || !deathReady || finalXpLoss == null) return;
    setSavingDeath(true);
    setDeathError(null);
    try {
      await addDeath({
        characterId: active.id,
        sessionId: null,
        level: currentLevel?.level ?? null,
        blessings: 0,
        promoted: false,
        xpLost: Math.round(finalXpLoss),
        note: deathNote.trim() || (deathMode === "paste" ? "Detectada a partir do Hunting Analyser colado" : null),
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
        <PageSkeleton />
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
      <PageTabs itemId="rendimento" />
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
          {active.name} · {active.vocation}
        </div>
        <h1 className="mt-1 flex items-center gap-2 font-brand text-3xl font-bold tracking-tight sm:text-4xl">
          <Gauge className="h-7 w-7 text-rubi-blue" /> Meu <span className="text-gradient-brand">rendimento</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desempenho por período, evolução de nível e objetivos de gold — tudo específico de {active.name}.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1 text-sm sm:inline-flex sm:grid-cols-none">
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
              "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm " +
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard
                  label="Níveis no período"
                  value={levelGain ? `${levelGain.gained >= 0 ? "+" : ""}${levelGain.gained}` : "—"}
                  hint={
                    levelGain ? (
                      `de ${levelGain.from} para ${levelGain.to}` +
                      (levelGain.fromBeforeRange
                        ? ` · contando desde o registro de ${fmtDay(new Date(levelGain.fromAt))}`
                        : "")
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTab("level")}
                        className="text-left underline decoration-dotted hover:text-foreground"
                      >
                        marque seu nível pra ver aqui
                      </button>
                    )
                  }
                  icon={ChevronsUp}
                  accent={levelGain && levelGain.gained > 0 ? "success" : "muted"}
                />
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
              O progresso soma o lucro das hunts feitas depois que cada objetivo foi criado. Quer contar o
              gold que você já tem? Marque um objetivo como <strong className="text-rubi-gold">principal</strong>:
              ele usa o seu saldo atual inteiro ({fmtGold(netBalance)}).
            </p>
            <button
              type="button"
              onClick={openGoalDialog}
              className="inline-flex flex-none items-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background shadow-glow-gold hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Novo objetivo
            </button>
          </div>

          {activeGoals.length === 0 ? (
            <EmptyState
              icon={Target}
              title={completedGoals.length ? "Nenhum objetivo em andamento" : "Nenhum objetivo ainda"}
              description={
                completedGoals.length
                  ? "Todos os seus objetivos foram conquistados. Crie o próximo e acompanhe o progresso conforme suas hunts."
                  : 'Crie um objetivo (ex: "Boots of Haste — 2M gold") e acompanhe o progresso conforme suas hunts.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((g) => {
                const progress = goalProgress(g, { sessions: mySessions, netBalance });
                return (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    progress={progress}
                    onRemove={() => handleRemoveGoal(g.id, g.name)}
                    onEdit={() => openEditGoal(g)}
                    onComplete={() => handleCompleteGoal(g, progress)}
                    onToggleMain={() => handleToggleMain(g.id, g.name, g.isMain)}
                    busy={savingMain}
                  />
                );
              })}
            </div>
          )}

          {completedGoals.length > 0 && (
            <section className="mt-8" aria-labelledby="goals-completed-title">
              <h2 id="goals-completed-title" className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
                <Trophy className="h-4 w-4 text-rubi-gold" /> Conquistados
                <span className="rounded-full border border-rubi-gold/40 bg-rubi-gold/10 px-2 py-0.5 text-2xs font-semibold text-rubi-gold">
                  {completedGoals.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((g) => (
                  <CompletedGoalCard
                    key={g.id}
                    goal={g}
                    onEdit={() => openEditGoal(g)}
                    onReopen={() => handleReopenGoal(g)}
                    onRemove={() => handleRemoveGoal(g.id, g.name)}
                  />
                ))}
              </div>
            </section>
          )}

          <Dialog open={goalDialogOpen} onOpenChange={(o) => !savingGoal && setGoalDialogOpen(o)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGoalId ? "Editar objetivo" : "Novo objetivo"}</DialogTitle>
                <DialogDescription>
                  {editingGoalId
                    ? "Mudou o preço ou faltou a imagem? Ajuste aqui — o progresso continua contando do mesmo jeito."
                    : "O progresso é calculado automaticamente a partir das suas próximas hunts."}
                </DialogDescription>
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
                  onClick={handleSaveGoal}
                  disabled={savingGoal || !goalReady}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {savingGoal ? "Salvando..." : editingGoalId ? "Salvar alterações" : "Criar objetivo"}
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
                  {" · "}Saldo atual (com imbuements, gastos e ajustes):{" "}
                  <span className={"font-semibold " + (netBalance >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
                    {fmtGold(netBalance)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBalanceDialogOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rubi-gold/50 bg-rubi-gold/10 px-4 py-2.5 text-sm font-semibold text-rubi-gold hover:bg-rubi-gold/20"
                >
                  <Wallet className="h-4 w-4" /> Atualizar saldo
                </button>
                <button
                  type="button"
                  onClick={openExpenseDialog}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rubi-danger px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Registrar gasto
                </button>
              </div>
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

          {myAdjustments.length > 0 && (
            <div className="card-surface mt-6 p-5">
              <h2 className="mb-1 text-base font-semibold">Ajustes de saldo</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Gold de fora das hunts, registrado por Atualizar saldo. Total:{" "}
                <span className={"font-semibold " + (totalAdjustments >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
                  {totalAdjustments >= 0 ? "+" : "−"}
                  {fmtGold(Math.abs(totalAdjustments))}
                </span>
              </p>
              <ul className="space-y-1.5">
                {myAdjustments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 basis-full truncate sm:basis-auto sm:flex-1" title={a.description}>
                      {a.description}
                    </span>
                    <span
                      className={
                        "flex-none font-mono font-semibold " + (a.amount >= 0 ? "text-rubi-success" : "text-rubi-danger")
                      }
                    >
                      {a.amount >= 0 ? "+" : "−"}
                      {fmtGold(Math.abs(a.amount))}
                    </span>
                    <span className="flex-none text-xs text-muted-foreground">{fmtDate(a.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdjustment(a.id, a.description)}
                      className="flex-none rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                      aria-label="Remover ajuste"
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
                  <p className="mt-1.5 text-2xs text-muted-foreground">
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
                        : "Esse balance é maior ou igual ao que o sistema já calcula — não é gasto. Pra gold que entrou (ex.: itens vendidos), use Atualizar saldo."}
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
                  <InfoHint title="Perda de XP na morte" description="Como o sistema descobre quanto de XP você perdeu.">
                    <p>
                      O próprio Tibia já calcula sua perda de XP na morte considerando <strong>bênçãos</strong> e{" "}
                      <strong>promotion</strong> — a gente não precisa saber mais nada sobre isso, só ler esse número
                      direto do <strong>Hunting Analyser</strong> (quando você morre, ele fecha negativo).
                    </p>
                    <p>
                      <strong>Importante:</strong> cole o Hunting Analyser logo depois de morrer, antes de caçar
                      mais. Se você continuar a sessão e recuperar XP, o Raw XP pode voltar a ficar positivo — e aí
                      não tem como o sistema saber que houve uma morte no meio do caminho.
                    </p>
                    <p>
                      Ao importar uma sessão inteira (em <strong>Nova sessão</strong>), isso já é detectado
                      automaticamente. Aqui você pode colar o mesmo texto separadamente, sem precisar importar a
                      sessão — por exemplo, se morreu num boss e quer registrar só isso.
                    </p>
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
                    {d.level != null && (
                      <span className="flex-none font-mono font-semibold">Level {d.level}</span>
                    )}
                    {d.note && (
                      <span
                        className="min-w-0 basis-full truncate text-xs text-muted-foreground sm:basis-auto sm:flex-1"
                        title={d.note}
                      >
                        {d.note}
                      </span>
                    )}
                    {d.sessionId && (
                      <Link
                        to="/sessions/$id"
                        params={{ id: d.sessionId }}
                        className="flex-none text-xs text-rubi-blue underline decoration-dotted hover:text-foreground"
                      >
                        ver sessão
                      </Link>
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
                  {deathMode === "paste"
                    ? "Cole o Hunting Analyser de logo depois que você morreu — o jogo já calcula sua perda de XP, a gente só lê esse número."
                    : "Já sabe o valor exato que perdeu? Digite direto."}
                </DialogDescription>
              </DialogHeader>

              {deathMode === "paste" ? (
                <>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Hunting Analyser
                    </span>
                    <textarea
                      autoFocus
                      value={deathPasteText}
                      onChange={(e) => setDeathPasteText(e.target.value)}
                      placeholder="Cole aqui o texto do Hunting Analyser"
                      rows={5}
                      className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-rubi-danger"
                    />
                  </label>

                  {deathPasteText.trim().length === 0 ? null : detectedFromPaste != null ? (
                    <p className="rounded-lg border border-rubi-danger/30 bg-rubi-danger/5 p-2.5 text-xs text-muted-foreground">
                      Detectamos <strong className="text-rubi-danger">{fmtNum(detectedFromPaste)} XP</strong> perdida
                      nesse texto.
                    </p>
                  ) : (
                    <p className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-xs text-muted-foreground">
                      Não encontramos XP negativa nesse texto. Confira se colou o Hunting Analyser certo, e se colou
                      logo após a morte — antes de caçar mais e a XP voltar a ficar positiva.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeathMode("amount")}
                    className="text-left text-xs text-rubi-blue underline decoration-dotted hover:text-foreground"
                  >
                    Não tem o Hunting Analyser? Informar o valor manualmente
                  </button>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      XP perdida
                    </span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      value={deathAmount}
                      onChange={(e) => setDeathAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddDeath();
                      }}
                      placeholder="Ex: 2.5kk"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setDeathMode("paste")}
                    className="text-left text-xs text-rubi-blue underline decoration-dotted hover:text-foreground"
                  >
                    ← Colar o Hunting Analyser
                  </button>
                </>
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
      <BalanceAdjustDialog
        open={balanceDialogOpen}
        onOpenChange={setBalanceDialogOpen}
        characterId={active.id}
        characterName={active.name}
        appBalance={netBalance}
      />
    </AppShell>
  );
}

function GoalCard({
  goal,
  progress,
  onRemove,
  onEdit,
  onComplete,
  onToggleMain,
  busy = false,
}: {
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currencyLabel: string;
    imageUrl: string | null;
    isMain: boolean;
  };
  progress: number;
  onRemove: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onToggleMain: () => void;
  /** Salvando a troca do principal: botões travados (evita clique duplo no meio). */
  busy?: boolean;
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
      <div className="absolute right-2 top-2 flex gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Editar o objetivo ${goal.name}`}
          title="Editar (nome, valor, moeda ou imagem)"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
          aria-label={`Remover o objetivo ${goal.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-lg border border-border bg-background/60">
          {goal.imageUrl ? (
            <img src={goal.imageUrl} alt={goal.name} className="h-full w-full object-contain" />
          ) : (
            <Target className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-12">
          {goal.isMain && (
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-full border border-rubi-gold/50 bg-rubi-gold/10 px-2 py-0.5 text-2xs font-semibold text-rubi-gold">
              <Star className="h-3 w-3 fill-current" /> Principal · conta todo o saldo
            </span>
          )}
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

      <div className="mt-2 flex items-center justify-between text-2xs">
        <span className="text-muted-foreground">{Math.min(100, Math.round(pct))}% concluído</span>
        {done && (
          <span className="inline-flex items-center gap-1 font-semibold text-rubi-gold">
            <PartyPopper className="h-3 w-3" /> Objetivo alcançado!
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleMain}
        disabled={busy}
        aria-pressed={goal.isMain}
        title={
          goal.isMain
            ? "Voltar a contar só as hunts feitas depois de criar o objetivo"
            : "Contar o saldo atual inteiro neste objetivo (só um objetivo pode ser o principal)"
        }
        className={
          "mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 " +
          (goal.isMain
            ? "border-border/60 text-muted-foreground hover:text-foreground"
            : "border-rubi-gold/50 text-rubi-gold hover:bg-rubi-gold/10")
        }
      >
        <Star className={"h-3.5 w-3.5 " + (goal.isMain ? "" : "fill-current")} />
        {goal.isMain ? "Deixar de ser principal" : "Tornar principal (contar meu saldo)"}
      </button>

      <button
        type="button"
        onClick={onComplete}
        title="Comprou o item ou chegou no objetivo? Ele vai pra lista de Conquistados."
        className={
          "mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
          (done
            ? "bg-rubi-gold text-background hover:opacity-90"
            : "border border-border/60 text-muted-foreground hover:border-rubi-gold/50 hover:text-rubi-gold")
        }
      >
        <Trophy className="h-3.5 w-3.5" /> Marcar como conquistado
      </button>
    </div>
  );
}

/** Objetivo conquistado: imagem, valor, quando e em quantos dias. */
function CompletedGoalCard({
  goal,
  onEdit,
  onReopen,
  onRemove,
}: {
  goal: {
    name: string;
    targetAmount: number;
    currencyLabel: string;
    imageUrl: string | null;
    createdAt: string;
    completedAt: string | null;
  };
  onEdit: () => void;
  onReopen: () => void;
  onRemove: () => void;
}) {
  const days = daysToComplete(goal);
  return (
    <div className="card-surface flex items-center gap-3 border-rubi-gold/40 p-3">
      <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg border border-rubi-gold/40 bg-background/60">
        {goal.imageUrl ? (
          <img src={goal.imageUrl} alt={goal.name} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <Trophy className="h-5 w-5 text-rubi-gold" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-semibold">{goal.name}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {fmtGold(goal.targetAmount)} {goal.currencyLabel}
        </div>
        {goal.completedAt && (
          <div className="text-2xs text-rubi-gold">
            Conquistado em {fmtDay(new Date(goal.completedAt))}
            {days != null && ` · em ${days} dia${days === 1 ? "" : "s"}`}
          </div>
        )}
      </div>
      <div className="flex flex-none gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Editar o objetivo ${goal.name}`}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onReopen}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Reabrir o objetivo ${goal.name}`}
          title="Voltar pra Em andamento"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
          aria-label={`Remover o objetivo ${goal.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
