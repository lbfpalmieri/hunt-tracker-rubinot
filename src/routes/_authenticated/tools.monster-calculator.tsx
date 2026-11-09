import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageTabs } from "@/components/nav/PageTabs";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GameIcon } from "@/components/GameIcon";
import { CreatureIcon, LinkedTaskPicker, type PickerTab } from "@/components/calculator/LinkedTaskPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore, useHydrated } from "@/lib/store";
import { finishDate, playDays, rankHuntsByTask, type HuntMonsters } from "@/lib/hunt-speed";
import { useModeSessions } from "@/lib/play-mode";
import { fmtNum, fmtDuration, fmtHoursMin } from "@/lib/format";
import { findLinkedTask, findLinkedTaskByCreatures, linkedTaskKey } from "@/lib/linked-task-rooms";
import { getLinkedTasks, type LinkedTaskEntry, type LinkedTaskRoom } from "@/lib/linked-tasks.functions";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Calculator,
  CalendarDays,
  ChevronDown,
  Clock,
  Flag,
  Link2,
  MapPin,
  Swords,
  Target,
  X,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const Route = createFileRoute("/_authenticated/tools/monster-calculator")({
  head: () => ({
    meta: [
      { title: "Calculadora de Bounty/Linked Task — RubinOT Hunt Tracker" },
      { name: "description", content: "Descubra em qual hunt você finaliza a bounty ou linked task mais rápido, baseado no histórico das suas sessões." },
      { property: "og:title", content: "Calculadora de Bounty/Linked Task" },
      { property: "og:description", content: "Estime o tempo para completar bounty e linked tasks em cada hunt." },
      { property: "og:type", content: "website" },
    ],
  }),
  // Vindo do conselho da Linked Task: ?task=4-1 (sala-task) e/ou ?linked=Dragon|Hydra&qty=400 já
  // abrem no modo Linked Task.
  validateSearch: (search: Record<string, unknown>): { linked?: string; qty?: number; task?: string } => {
    const qty = Number(search.qty);
    return {
      linked: typeof search.linked === "string" && search.linked ? search.linked : undefined,
      qty: Number.isFinite(qty) && qty > 0 ? Math.round(qty) : undefined,
      task: typeof search.task === "string" && /^\d+-\d+$/.test(search.task) ? search.task : undefined,
    };
  },
  component: MonsterCalculatorPage,
});

type TimeUnit = "hours" | "days";
const UNIT_KEY = "monster-calc-time-unit";
const HOURS_KEY = "monster-calc-hours-per-day";
const HOURS_PRESETS = [1, 2, 3, 4, 6, 8];

const readUnit = (): TimeUnit => {
  try {
    return localStorage.getItem(UNIT_KEY) === "days" ? "days" : "hours";
  } catch {
    return "hours";
  }
};
const readHours = (): number => {
  try {
    const n = Number(localStorage.getItem(HOURS_KEY));
    return n > 0 && n <= 24 ? n : 4;
  } catch {
    return 4;
  }
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // sem localStorage: vale só nesta tela.
  }
};

const fmtDays = (days: number) => (!Number.isFinite(days) ? "—" : days <= 1 ? "1 dia" : `${fmtNum(days)} dias`);
const fmtDayMonth = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(d);

function MonsterCalculatorPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useModeSessions();
  const activeId = useAppStore((s) => s.activeCharacterId);

  const [charId, setCharId] = useState<string>("");
  const search = Route.useSearch();
  const fromLink = !!(search.linked || search.task);
  const [mode, setMode] = useState<"bounty" | "linked">(fromLink ? "linked" : "bounty");
  const [monster, setMonster] = useState<string>("");
  const [linked, setLinked] = useState<string[]>(() =>
    search.linked ? search.linked.split("|").filter(Boolean).slice(0, 40) : [],
  );
  const [taskKey, setTaskKey] = useState<string | null>(search.task ?? null);
  const [quantity, setQuantity] = useState<number>(search.qty ?? 400);
  const [unit, setUnitState] = useState<TimeUnit>(readUnit);
  const [hoursPerDay, setHoursState] = useState<number>(readHours);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>("task");

  const setUnit = (u: TimeUnit) => {
    setUnitState(u);
    save(UNIT_KEY, u);
  };
  const setHoursPerDay = (h: number) => {
    const v = Math.min(24, Math.max(0.5, Math.round(h * 2) / 2));
    setHoursState(v);
    save(HOURS_KEY, String(v));
  };

  const effectiveCharId = charId || activeId || characters[0]?.id || "";

  const charSessions = useMemo(
    () => sessions.filter((s) => s.characterId === effectiveCharId),
    [sessions, effectiveCharId],
  );

  // Linked tasks do jogo (mesmo cache da página Linked Tasks).
  const fetchLinkedTasks = useServerFn(getLinkedTasks);
  const linkedQuery = useQuery({
    queryKey: ["linked-tasks"],
    queryFn: () => fetchLinkedTasks(),
    enabled: mode === "linked",
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
  const rooms = useMemo(() => linkedQuery.data?.rooms ?? [], [linkedQuery.data]);

  // Tasks concluídas do personagem (marcadas na página Linked Tasks).
  const { data: doneKeys } = useQuery({
    queryKey: ["linked-task-progress", effectiveCharId],
    enabled: mode === "linked" && !!effectiveCharId,
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await db.from("linked_task_progress").select("task_key").eq("character_id", effectiveCharId);
      return new Set(((data ?? []) as { task_key: string }[]).map((r) => r.task_key));
    },
  });
  const done = useMemo(() => doneKeys ?? new Set<string>(), [doneKeys]);

  // Link antigo (?linked=A|B sem ?task): acha a task com essas mesmas criaturas.
  const matchedLink = useRef(false);
  useEffect(() => {
    if (matchedLink.current || rooms.length === 0) return;
    matchedLink.current = true;
    if (taskKey || !search.linked) return;
    const hit = findLinkedTaskByCreatures(rooms, linked);
    if (hit) setTaskKey(linkedTaskKey(hit.room.id, hit.task.id));
  }, [rooms, taskKey, search.linked, linked]);

  const selected = useMemo(() => findLinkedTask(rooms, taskKey), [rooms, taskKey]);
  // Imagem da wiki do RubinOT de cada criatura da task (reserva quando a TibiaWiki não tem a sprite).
  const creatureImages = useMemo(
    () => new Map((selected?.task.creatures ?? []).map((c) => [c.name.toLowerCase(), c.image])),
    [selected],
  );

  // Todas as criaturas já mortas por esse personagem (autocomplete e "já caçou").
  const monsterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of charSessions) {
      for (const k of s.hunting.kills) set.add(k.name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [charSessions]);
  const hunted = useMemo(() => new Set(monsterOptions.map((m) => m.toLowerCase())), [monsterOptions]);

  // Monstros da task: 1 na bounty, vários na linked (kills de qualquer um deles contam juntas).
  const targets = useMemo(
    () => (mode === "bounty" ? (monster.trim() ? [monster.trim()] : []) : linked),
    [mode, monster, linked],
  );

  // Agrupa as sessões por hunt e calcula kills/h das criaturas alvo.
  const results = useMemo(
    () => rankHuntsByTask(charSessions, targets, quantity),
    [charSessions, targets, quantity],
  );

  const pickTask = (room: LinkedTaskRoom, task: LinkedTaskEntry) => {
    setTaskKey(linkedTaskKey(room.id, task.id));
    setLinked(task.creatures.map((c) => c.name));
    setQuantity(task.quantity);
    setPickerOpen(false);
  };
  const pickHuntMonsters = (hunt: HuntMonsters) => {
    setTaskKey(null);
    setLinked(hunt.monsters.map((m) => m.name).slice(0, 40));
    setPickerOpen(false);
  };
  const clearTask = () => {
    setTaskKey(null);
    setLinked([]);
  };
  const openPicker = (tab: PickerTab) => {
    setPickerTab(tab);
    setPickerOpen(true);
  };

  const addMonster = (m: string) => {
    if (mode === "bounty") setMonster(m);
    else {
      setLinked((prev) => (prev.includes(m) ? prev : [...prev, m]));
      setMonster("");
    }
  };

  const monsterLabel = targets.join(" + ");
  const best = results[0];

  const timeOf = (estSec: number) =>
    unit === "days" ? fmtDays(playDays(estSec, hoursPerDay)) : Number.isFinite(estSec) ? fmtDuration(estSec) : "—";

  if (!hydrated) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  if (characters.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={Calculator}
          title="Cadastre um personagem primeiro"
          description="A calculadora usa as sessões salvas de cada personagem."
          ctaLabel="Ir para personagens"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  const characterField = (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Personagem</label>
      <select
        aria-label="Personagem"
        value={effectiveCharId}
        onChange={(e) => setCharId(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
      >
        {characters.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );

  const quantityField = (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {mode === "bounty" ? "Quantidade a derrotar" : "Total de monstros a derrotar"}
      </label>
      <input
        aria-label={mode === "bounty" ? "Quantidade a derrotar" : "Total de monstros a derrotar"}
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {Array.from(new Set([...(selected ? [selected.task.quantity] : []), 100, 250, 400, 800, 1500])).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuantity(q)}
            className={
              "rounded-md border px-2 py-1 text-xs hover:bg-accent hover:text-foreground " +
              (q === quantity ? "border-rubi-gold/60 bg-rubi-gold/10 text-rubi-gold" : "border-border bg-surface text-muted-foreground")
            }
          >
            {fmtNum(q)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell>
      <PageTabs itemId="monster-calc" />
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
        <h1 className="mt-1 font-brand text-3xl font-bold">Calculadora de Bounty / Linked Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "bounty"
            ? "Informe o monstro da bounty e a quantidade a derrotar — mostramos em qual hunt você finaliza mais rápido, com base no seu histórico."
            : "Escolha a linked task (ou uma hunt sua): pegamos as criaturas da task, somamos as kills/h delas em cada hunt (as outras criaturas da hunt não contam) e mostramos quanto tempo falta, em horas ou em dias."}
        </p>
        <div className="mt-4 inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
          {([
            ["bounty", "Bounty Task", Target],
            ["linked", "Linked Task", Link2],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setMonster("");
              }}
              className={
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors " +
                (mode === value ? "bg-rubi-gold/15 text-rubi-gold" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "bounty" ? (
        <div className="card-surface mb-6 grid gap-4 p-5 sm:grid-cols-3">
          {characterField}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monstro</label>
            <MonsterSearch
              label="Monstro"
              value={monster}
              onChange={setMonster}
              onPick={addMonster}
              options={monsterOptions}
              placeholder="Ex: Dragon Lord"
            />
          </div>
          {quantityField}
        </div>
      ) : (
        <>
          <div className="card-surface mb-4 grid gap-4 p-5 sm:grid-cols-3">
            {characterField}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Linked task</label>
              <button
                type="button"
                onClick={() => openPicker("task")}
                aria-haspopup="dialog"
                className={
                  "mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors " +
                  (selected
                    ? "border-rubi-gold/50 bg-rubi-gold/10 hover:border-rubi-gold"
                    : "border-border bg-input text-muted-foreground hover:border-rubi-blue/50")
                }
              >
                {selected ? (
                  <>
                    <img
                      src={selected.task.image}
                      alt=""
                      className="h-8 w-8 flex-none"
                      style={{ objectFit: "contain", imageRendering: "pixelated" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{selected.task.name}</span>
                      <span className="block truncate text-2xs text-muted-foreground">
                        {selected.room.name} · {fmtNum(selected.task.quantity)}×
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="flex-1">{linkedQuery.isLoading ? "Carregando as tasks…" : "Escolher a linked task"}</span>
                )}
                <ChevronDown className="h-4 w-4 flex-none text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => openPicker("hunt")}
                className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-rubi-blue hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" /> ou escolher pela sua hunt
              </button>
            </div>
            {quantityField}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {linked.map((m) => {
              const never = !hunted.has(m.toLowerCase());
              return (
                <span
                  key={m}
                  title={never ? "Você ainda não tem sessão com essa criatura" : undefined}
                  className={
                    "inline-flex items-center gap-2 rounded-full border py-1 pl-2 pr-1 text-sm font-medium " +
                    (never ? "border-border/60 bg-surface text-muted-foreground" : "border-rubi-gold/40 bg-rubi-gold/10")
                  }
                >
                  <CreatureIcon name={m} image={creatureImages.get(m.toLowerCase())} />
                  {m}
                  <button
                    type="button"
                    aria-label={`Remover ${m}`}
                    onClick={() => setLinked((prev) => prev.filter((x) => x !== m))}
                    className="rounded-full p-1 text-muted-foreground hover:bg-rubi-danger/15 hover:text-rubi-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
            <div className="w-full sm:w-60">
              <MonsterSearch
                label="Adicionar criatura"
                value={monster}
                onChange={setMonster}
                onPick={addMonster}
                options={monsterOptions.filter((m) => !linked.includes(m))}
                placeholder="+ Adicionar criatura"
                compact
              />
            </div>
            {(selected || linked.length > 0) && (
              <button
                type="button"
                onClick={clearTask}
                className="min-h-11 px-1 text-xs font-medium text-muted-foreground hover:text-rubi-danger"
              >
                Limpar
              </button>
            )}
          </div>

          <LinkedTaskPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            tab={pickerTab}
            onTabChange={setPickerTab}
            rooms={rooms}
            loading={linkedQuery.isLoading}
            error={linkedQuery.data?.error ?? undefined}
            selectedKey={taskKey}
            done={done}
            sessions={charSessions}
            onPickTask={pickTask}
            onUseHuntMonsters={pickHuntMonsters}
          />
        </>
      )}

      {targets.length === 0 ? (
        mode === "bounty" ? (
          <EmptyState
            icon={Target}
            title="Escolha um monstro"
            description="Digite o nome do monstro da bounty task para ver em quais hunts você o encontra."
          />
        ) : (
          <EmptyState
            icon={Link2}
            title="Escolha a linked task"
            description="Escolha a task da lista do jogo ou uma hunt sua: a calculadora pega as criaturas e a quantidade sozinha."
            ctaLabel="Escolher a linked task"
            onCta={() => openPicker("task")}
          />
        )
      ) : results.length === 0 ? (
        <EmptyState
          icon={Swords}
          title={mode === "linked" ? "Nenhuma hunt sua com essas criaturas" : `Nenhuma sessão com "${monsterLabel}"`}
          description="Importe pelo menos uma sessão em que essas criaturas apareçam para calcular a estimativa."
          ctaLabel="Nova sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          <div className="card-surface mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mostrar tempo em</span>
              <div className="inline-flex rounded-lg border border-border bg-surface p-1 text-sm" role="group" aria-label="Unidade do tempo">
                {([
                  ["hours", "Horas", Clock],
                  ["days", "Dias", CalendarDays],
                ] as const).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={unit === value}
                    onClick={() => setUnit(value)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors " +
                      (unit === value ? "bg-rubi-gold/15 text-rubi-gold" : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="hours-per-day" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Jogo por dia
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="hours-per-day"
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={hoursPerDay}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (n > 0) setHoursPerDay(n);
                  }}
                  className="w-20 rounded-lg border border-border bg-input px-2 py-1.5 text-sm"
                />
                <span className="text-sm text-muted-foreground">h</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {HOURS_PRESETS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHoursPerDay(h)}
                    aria-pressed={hoursPerDay === h}
                    className={
                      "rounded-md border px-2 py-1 text-xs hover:bg-accent hover:text-foreground " +
                      (hoursPerDay === h ? "border-rubi-gold/60 bg-rubi-gold/10 text-rubi-gold" : "border-border bg-surface text-muted-foreground")
                    }
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {best && (
            <RecommendedCard
              mode={mode}
              huntName={best.huntName}
              estSec={best.estSec}
              perHour={best.perHour}
              label={`${fmtNum(quantity)}× ${selected ? selected.task.name : monsterLabel}`}
              icon={
                mode === "bounty" ? (
                  <GameIcon name={monster} size={32} fallback={<Target className="h-6 w-6" />} />
                ) : selected ? (
                  <img src={selected.task.image} alt="" className="h-9 w-9" style={{ objectFit: "contain", imageRendering: "pixelated" }} />
                ) : (
                  <Link2 className="h-6 w-6" />
                )
              }
              unit={unit}
              hoursPerDay={hoursPerDay}
            />
          )}

          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="font-display text-sm font-semibold">
                {mode === "bounty" ? `Todas as hunts com "${monsterLabel}"` : "Hunts com pelo menos uma criatura da task"}
              </div>
              <div className="text-xs text-muted-foreground">
                {results.length} hunt(s) encontrada(s)
              </div>
            </div>
            <div className="divide-y divide-border/50 sm:hidden">
              {results.map((r, i) => (
                <article key={r.huntName} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 break-words font-display text-sm font-semibold">{r.huntName}</h3>
                    {i === 0 && <span className="flex-none rounded bg-rubi-gold/15 px-1.5 py-0.5 text-2xs font-semibold uppercase text-rubi-gold">Mais rápida</span>}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><dt className="text-muted-foreground">Sessões</dt><dd className="mt-0.5 font-mono font-semibold">{r.sessionCount}</dd></div>
                    <div><dt className="text-muted-foreground">Kills totais</dt><dd className="mt-0.5 font-mono font-semibold">{fmtNum(r.totalKills)}</dd></div>
                    <div><dt className="text-muted-foreground">Média /h</dt><dd className="mt-0.5 font-mono font-semibold">{fmtNum(r.perHour)}</dd></div>
                    <div>
                      <dt className="text-muted-foreground">Tempo estimado{unit === "days" ? ` (${fmtHoursMin(hoursPerDay)}/dia)` : ""}</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-rubi-gold">{timeOf(r.estSec)}</dd>
                    </div>
                  </dl>
                  {mode === "linked" && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {r.perMonsterPerHour.map((m) => (
                        <span key={m.name} className={"inline-flex items-center gap-1 " + (m.perHour > 0 ? "" : "opacity-40")}>
                          <CreatureIcon name={m.name} image={creatureImages.get(m.name.toLowerCase())} size={16} />{" "}
                          {m.perHour > 0 ? fmtNum(m.perHour) : "—"}/h
                        </span>
                      ))}
                    </div>
                  )}
                  {mode === "linked" && <IgnoredLine kills={r.ignoredKills} />}
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="px-5 py-2 text-left font-medium">Hunt</th>
                    <th className="px-5 py-2 text-right font-medium">Sessões</th>
                    <th className="px-5 py-2 text-right font-medium">Kills totais</th>
                    {mode === "linked" && <th className="px-5 py-2 text-left font-medium">Por criatura (/h)</th>}
                    <th className="px-5 py-2 text-right font-medium">Média /h{mode === "linked" ? " (soma)" : ""}</th>
                    <th className="px-5 py-2 text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        {unit === "days" ? <CalendarDays className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />} Tempo estimado
                        {unit === "days" && <span className="normal-case tracking-normal">({fmtHoursMin(hoursPerDay)}/dia)</span>}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.huntName} className="border-b border-border/40 last:border-0">
                      <td className="px-5 py-2 font-medium">
                        {r.huntName}
                        {i === 0 && (
                          <span className="ml-2 rounded bg-rubi-gold/15 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-rubi-gold">
                            Mais rápida
                          </span>
                        )}
                        {mode === "linked" && <IgnoredLine kills={r.ignoredKills} />}
                      </td>
                      <td className="px-5 py-2 text-right text-muted-foreground">{r.sessionCount}</td>
                      <td className="px-5 py-2 text-right text-muted-foreground">{fmtNum(r.totalKills)}</td>
                      {mode === "linked" && (
                        <td className="px-5 py-2 text-xs text-muted-foreground">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {r.perMonsterPerHour.map((m) => (
                              <span key={m.name} title={m.name} className={"inline-flex items-center gap-1 " + (m.perHour > 0 ? "" : "opacity-40")}>
                                <CreatureIcon name={m.name} image={creatureImages.get(m.name.toLowerCase())} size={16} />
                                {m.perHour > 0 ? fmtNum(m.perHour) : "—"}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-2 text-right text-muted-foreground">{fmtNum(r.perHour)}</td>
                      <td className="px-5 py-2 text-right font-semibold text-rubi-gold">{timeOf(r.estSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/60 px-5 py-2 text-xs text-muted-foreground">
              Baseado no total de kills e duração acumulada por hunt.
              {unit === "days" && ` Dias jogando ${fmtHoursMin(hoursPerDay)} por dia (arredondado pra cima).`}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

/** "Não contam: Bonebeast, Ghoul +2" — criaturas da hunt que não são da task. */
function IgnoredLine({ kills }: { kills: { name: string; count: number }[] }) {
  if (kills.length === 0) return null;
  const shown = kills.slice(0, 3).map((k) => k.name).join(", ");
  return (
    <div
      className="mt-1 text-2xs font-normal text-muted-foreground"
      title={kills.map((k) => `${k.name}: ${fmtNum(k.count)}`).join("\n")}
    >
      Não contam: {shown}
      {kills.length > 3 ? ` +${kills.length - 3}` : ""}
    </div>
  );
}

function RecommendedCard({
  mode,
  huntName,
  estSec,
  perHour,
  label,
  icon,
  unit,
  hoursPerDay,
}: {
  mode: "bounty" | "linked";
  huntName: string;
  estSec: number;
  perHour: number;
  label: string;
  icon: ReactNode;
  unit: TimeUnit;
  hoursPerDay: number;
}) {
  const days = playDays(estSec, hoursPerDay);
  const end = finishDate(estSec, hoursPerDay, new Date());
  const hoursTile = (
    <Tile
      key="hours"
      icon={Clock}
      label="Em horas de hunt"
      value={Number.isFinite(estSec) ? fmtDuration(estSec) : "—"}
      strong={unit === "hours"}
    />
  );
  const daysTile = (
    <Tile
      key="days"
      icon={CalendarDays}
      label={`Em dias (${fmtHoursMin(hoursPerDay)} por dia)`}
      value={fmtDays(days)}
      strong={unit === "days"}
    />
  );
  return (
    <div className="card-surface mb-4 border-rubi-gold/40 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-rubi-gold/15 text-rubi-gold">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-rubi-gold">Hunt recomendada</div>
          <div className="mt-1 font-display text-2xl font-bold">{huntName}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Estimativa para <span className="font-semibold text-foreground">{label}</span> · média de{" "}
            {fmtNum(perHour)} {mode === "linked" ? "kills" : ""}/h
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {unit === "days" ? [daysTile, hoursTile] : [hoursTile, daysTile]}
        <Tile
          icon={Flag}
          label="Começando hoje, termina em"
          value={end ? fmtDayMonth(end) : "—"}
          strong={false}
        />
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  strong: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border px-3 py-2 " +
        (strong ? "border-rubi-gold/50 bg-rubi-gold/10" : "border-border/60 bg-background/30")
      }
    >
      <div className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={"mt-0.5 font-display text-xl font-bold " + (strong ? "text-rubi-gold" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

/** Campo com autocomplete das criaturas já mortas pelo personagem. */
function MonsterSearch({
  label,
  value,
  onChange,
  onPick,
  options,
  placeholder,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (v: string) => void;
  options: string[];
  placeholder: string;
  compact?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const q = value.trim().toLowerCase();
  const filtered = (q ? options.filter((m) => m.toLowerCase().includes(q)) : options).slice(0, 8);
  const open = show && filtered.length > 0;
  const pick = (m: string) => {
    onPick(m);
    setShow(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        aria-label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
          setHighlight(0);
        }}
        onFocus={() => setShow(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % filtered.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(filtered[highlight]);
          } else if (e.key === "Escape") {
            setShow(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={
          "w-full rounded-lg border border-border bg-input px-3 text-sm " +
          (compact ? "rounded-full py-1.5" : "mt-1 py-2")
        }
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full min-w-56 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          {filtered.map((m, i) => (
            <li
              key={m}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm " +
                (i === highlight ? "bg-accent text-foreground" : "text-muted-foreground")
              }
            >
              <GameIcon name={m} size={20} className="flex-none" />
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
