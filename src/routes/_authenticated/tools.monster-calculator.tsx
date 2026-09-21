import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GameIcon } from "@/components/GameIcon";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtNum, fmtDuration } from "@/lib/format";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Swords, Target, Clock, Link2, X } from "lucide-react";

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
  component: MonsterCalculatorPage,
});

function MonsterCalculatorPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const activeId = useAppStore((s) => s.activeCharacterId);

  const [charId, setCharId] = useState<string>("");
  const [mode, setMode] = useState<"bounty" | "linked">("bounty");
  const [monster, setMonster] = useState<string>("");
  const [linked, setLinked] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(400);
  const [showSuggest, setShowSuggest] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!suggestRef.current?.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const effectiveCharId = charId || activeId || characters[0]?.id || "";

  const charSessions = useMemo(
    () => sessions.filter((s) => s.characterId === effectiveCharId),
    [sessions, effectiveCharId],
  );

  // All monster names ever killed by this character (for autocomplete)
  const monsterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of charSessions) {
      for (const k of s.hunting.kills) set.add(k.name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [charSessions]);

  // Monstros da task: 1 na bounty, vários na linked (kills de qualquer um deles contam juntas).
  const targets = useMemo(
    () => (mode === "bounty" ? (monster.trim() ? [monster.trim()] : []) : linked),
    [mode, monster, linked],
  );

  // Group sessions by hunt name and compute kills/h of the target monster(s)
  const results = useMemo(() => {
    if (targets.length === 0) return [];
    const needles = targets.map((t) => t.toLowerCase());
    const byHunt = new Map<
      string,
      { totalSec: number; totalKills: number; sessionCount: number; perMonster: Map<string, number> }
    >();
    for (const s of charSessions) {
      const sessionPer = new Map<string, number>();
      let sessionKills = 0;
      for (const k of s.hunting.kills) {
        const idx = needles.indexOf(k.name.toLowerCase());
        if (idx === -1) continue;
        sessionPer.set(targets[idx], (sessionPer.get(targets[idx]) ?? 0) + k.count);
        sessionKills += k.count;
      }
      if (sessionKills <= 0) continue;
      const key = s.huntName;
      const cur = byHunt.get(key) ?? { totalSec: 0, totalKills: 0, sessionCount: 0, perMonster: new Map() };
      cur.totalSec += s.hunting.durationSec;
      cur.totalKills += sessionKills;
      cur.sessionCount += 1;
      for (const [name, n] of sessionPer) cur.perMonster.set(name, (cur.perMonster.get(name) ?? 0) + n);
      byHunt.set(key, cur);
    }
    return Array.from(byHunt.entries())
      .map(([huntName, v]) => {
        const hours = v.totalSec / 3600;
        const perHour = hours > 0 ? v.totalKills / hours : 0;
        const estSec = perHour > 0 ? (quantity / perHour) * 3600 : Infinity;
        return {
          huntName,
          sessionCount: v.sessionCount,
          totalKills: v.totalKills,
          totalSec: v.totalSec,
          perHour,
          estSec,
          perMonsterPerHour: targets.map((t) => ({
            name: t,
            perHour: hours > 0 ? (v.perMonster.get(t) ?? 0) / hours : 0,
          })),
        };
      })
      .sort((a, b) => a.estSec - b.estSec);
  }, [charSessions, targets, quantity]);

  const pickMonster = (m: string) => {
    if (mode === "bounty") {
      setMonster(m);
    } else {
      setLinked((prev) => (prev.includes(m) ? prev : [...prev, m]));
      setMonster("");
    }
    setShowSuggest(false);
  };

  const monsterLabel = targets.join(" + ");

  const best = results[0];

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
          icon={Calculator}
          title="Cadastre um personagem primeiro"
          description="A calculadora usa as sessões salvas de cada personagem."
          ctaLabel="Ir para personagens"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Calculadora de Bounty / Linked Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "bounty"
            ? "Informe o monstro da bounty e a quantidade a derrotar — mostramos em qual hunt você finaliza mais rápido, com base no seu histórico."
            : "Escolha os monstros da linked task e o total de kills necessário — somamos as kills/h de todos eles em cada hunt e mostramos quantas horas você precisa."}
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
                setShowSuggest(false);
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

      <div className="card-surface mb-6 grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Personagem</label>
          <select
            value={effectiveCharId}
            onChange={(e) => setCharId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div ref={suggestRef} className="relative">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {mode === "bounty" ? "Monstro" : "Adicionar monstro"}
          </label>
          {(() => {
            const q = monster.trim().toLowerCase();
            const pool = mode === "linked" ? monsterOptions.filter((m) => !linked.includes(m)) : monsterOptions;
            const filtered = q
              ? pool.filter((m) => m.toLowerCase().includes(q)).slice(0, 8)
              : pool.slice(0, 8);
            const open = showSuggest && filtered.length > 0;
            return (
              <>
                <input
                  value={monster}
                  onChange={(e) => {
                    setMonster(e.target.value);
                    setShowSuggest(true);
                    setHighlight(0);
                  }}
                  onFocus={() => setShowSuggest(true)}
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
                      pickMonster(filtered[highlight]);
                    } else if (e.key === "Escape") {
                      setShowSuggest(false);
                    }
                  }}
                  placeholder={mode === "bounty" ? "Ex: Dragon Lord" : "Buscar e adicionar (ex: Dragon Lord)"}
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
                />
                {open && (
                  <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg">
                    {filtered.map((m, i) => (
                      <li
                        key={m}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickMonster(m);
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
              </>
            );
          })()}
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {mode === "bounty" ? "Quantidade a derrotar" : "Total de monstros a derrotar"}
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {[100, 250, 400, 800, 1500].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "linked" && linked.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {linked.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-2 rounded-full border border-rubi-gold/40 bg-rubi-gold/10 py-1 pl-2 pr-1 text-sm font-medium"
            >
              <GameIcon name={m} size={20} className="flex-none" />
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
          ))}
        </div>
      )}

      {targets.length === 0 ? (
        <EmptyState
          icon={mode === "bounty" ? Target : Link2}
          title={mode === "bounty" ? "Escolha um monstro" : "Escolha os monstros da linked task"}
          description={
            mode === "bounty"
              ? "Digite o nome do monstro da bounty task para ver em quais hunts você o encontra."
              : "Busque e adicione cada monstro da linked task para ver em quais hunts você os encontra."
          }
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Swords}
          title={`Nenhuma sessão com "${monsterLabel}"`}
          description="Importe pelo menos uma sessão em que esse monstro apareça para calcular a estimativa."
          ctaLabel="Nova sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          {best && (
            <div className="card-surface mb-4 flex items-start gap-4 border-rubi-gold/40 p-5">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-rubi-gold/15 text-rubi-gold">
                {mode === "bounty" ? (
                  <GameIcon name={monster} size={32} fallback={<Target className="h-6 w-6" />} />
                ) : (
                  <Link2 className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wider text-rubi-gold">Hunt recomendada</div>
                <div className="mt-1 font-display text-2xl font-bold">{best.huntName}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Estimativa para <span className="font-semibold text-foreground">{fmtNum(quantity)}× {monsterLabel}</span>:{" "}
                  <span className="font-semibold text-rubi-gold">
                    {isFinite(best.estSec) ? fmtDuration(best.estSec) : "—"}
                  </span>{" "}
                  · média de {fmtNum(best.perHour)} /h
                </div>
              </div>
            </div>
          )}

          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="font-display text-sm font-semibold">
                {mode === "bounty" ? `Todas as hunts com "${monsterLabel}"` : "Hunts com pelo menos um dos monstros"}
              </div>
              <div className="text-xs text-muted-foreground">
                {results.length} hunt(s) encontrada(s)
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="px-5 py-2 text-left font-medium">Hunt</th>
                    <th className="px-5 py-2 text-right font-medium">Sessões</th>
                    <th className="px-5 py-2 text-right font-medium">Kills totais</th>
                    {mode === "linked" && <th className="px-5 py-2 text-left font-medium">Por monstro (/h)</th>}
                    <th className="px-5 py-2 text-right font-medium">Média /h{mode === "linked" ? " (soma)" : ""}</th>
                    <th className="px-5 py-2 text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Tempo estimado
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
                          <span className="ml-2 rounded bg-rubi-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rubi-gold">
                            Mais rápida
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-right text-muted-foreground">{r.sessionCount}</td>
                      <td className="px-5 py-2 text-right text-muted-foreground">{fmtNum(r.totalKills)}</td>
                      {mode === "linked" && (
                        <td className="px-5 py-2 text-xs text-muted-foreground">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {r.perMonsterPerHour.map((m) => (
                              <span key={m.name} className={"inline-flex items-center gap-1 " + (m.perHour > 0 ? "" : "opacity-40")}>
                                <GameIcon name={m.name} size={16} className="flex-none" />
                                {m.perHour > 0 ? fmtNum(m.perHour) : "—"}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-2 text-right text-muted-foreground">{fmtNum(r.perHour)}</td>
                      <td className="px-5 py-2 text-right font-semibold text-rubi-gold">
                        {isFinite(r.estSec) ? fmtDuration(r.estSec) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/60 px-5 py-2 text-xs text-muted-foreground">
              Baseado no total de kills e duração acumulada por hunt.
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
