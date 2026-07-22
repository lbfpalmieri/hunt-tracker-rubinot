import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtNum, fmtDuration } from "@/lib/format";
import { useMemo, useState } from "react";
import { Calculator, Swords, Target, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/monster-calculator")({
  head: () => ({
    meta: [
      { title: "Calculadora de Bounty Task — RubinOT Hunt Tracker" },
      { name: "description", content: "Descubra em qual hunt você finaliza a bounty task mais rápido, baseado no histórico das suas sessões." },
      { property: "og:title", content: "Calculadora de Bounty Task" },
      { property: "og:description", content: "Estime o tempo para completar bounty tasks em cada hunt." },
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
  const [monster, setMonster] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(400);

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

  // Group sessions by hunt name and compute kills/h of the target monster
  const results = useMemo(() => {
    const needle = monster.trim().toLowerCase();
    if (!needle) return [];
    const byHunt = new Map<string, { totalSec: number; totalKills: number; sessionCount: number }>();
    for (const s of charSessions) {
      const monsterKills = s.hunting.kills
        .filter((k) => k.name.toLowerCase() === needle)
        .reduce((acc, k) => acc + k.count, 0);
      if (monsterKills <= 0) continue;
      const key = s.huntName;
      const cur = byHunt.get(key) ?? { totalSec: 0, totalKills: 0, sessionCount: 0 };
      cur.totalSec += s.hunting.durationSec;
      cur.totalKills += monsterKills;
      cur.sessionCount += 1;
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
        };
      })
      .sort((a, b) => a.estSec - b.estSec);
  }, [charSessions, monster, quantity]);

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
        <h1 className="mt-1 font-display text-3xl font-bold">Calculadora de Bounty Task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe o monstro da bounty e a quantidade a derrotar — mostramos em qual hunt você finaliza mais rápido, com base no seu histórico.
        </p>
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
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monstro</label>
          <input
            list="monster-options"
            value={monster}
            onChange={(e) => setMonster(e.target.value)}
            placeholder="Ex: Dragon Lord"
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          />
          <datalist id="monster-options">
            {monsterOptions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          {monsterOptions.length > 0 && !monster && (
            <div className="mt-2 flex flex-wrap gap-1">
              {monsterOptions.slice(0, 6).map((m) => (
                <button
                  key={m}
                  onClick={() => setMonster(m)}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quantidade a derrotar
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

      {!monster.trim() ? (
        <EmptyState
          icon={Target}
          title="Escolha um monstro"
          description="Digite o nome do monstro da bounty task para ver em quais hunts você o encontra."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Swords}
          title={`Nenhuma sessão com "${monster}"`}
          description="Importe pelo menos uma sessão em que esse monstro apareça para calcular a estimativa."
          ctaLabel="Nova sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          {best && (
            <div className="card-surface mb-4 flex items-start gap-4 border-rubi-gold/40 p-5">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-rubi-gold/15 text-rubi-gold">
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wider text-rubi-gold">Hunt recomendada</div>
                <div className="mt-1 font-display text-2xl font-bold">{best.huntName}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Estimativa para <span className="font-semibold text-foreground">{fmtNum(quantity)}× {monster}</span>:{" "}
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
              <div className="font-display text-sm font-semibold">Todas as hunts com "{monster}"</div>
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
                    <th className="px-5 py-2 text-right font-medium">Média /h</th>
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
