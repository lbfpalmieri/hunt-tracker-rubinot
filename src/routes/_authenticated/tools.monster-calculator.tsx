import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtNum, fmtDuration } from "@/lib/format";
import { useMemo, useState } from "react";
import { Calculator, Swords, Clock, Sigma } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tools/monster-calculator")({
  head: () => ({
    meta: [
      { title: "Calculadora de monstros/h — RubinOT Hunt Tracker" },
      { name: "description", content: "Estime quantos monstros você vai matar em uma hunt com base no seu histórico." },
      { property: "og:title", content: "Calculadora de monstros por hora" },
      { property: "og:description", content: "Projete kills futuros com base nas médias das suas sessões." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MonsterCalculatorPage,
});

function MonsterCalculatorPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const hunts = useAppStore((s) => s.hunts);
  const sessions = useAppStore((s) => s.sessions);
  const activeId = useAppStore((s) => s.activeCharacterId);

  const [charId, setCharId] = useState<string>("");
  const [huntId, setHuntId] = useState<string>("");
  const [minutes, setMinutes] = useState<number>(60);

  const effectiveCharId = charId || activeId || characters[0]?.id || "";
  const charHunts = useMemo(
    () => hunts.filter((h) => h.characterId === effectiveCharId),
    [hunts, effectiveCharId],
  );

  const effectiveHuntId = huntId || charHunts[0]?.id || "";
  const activeHunt = hunts.find((h) => h.id === effectiveHuntId);

  const matchingSessions = useMemo(() => {
    if (!activeHunt) return [];
    const needle = activeHunt.name.toLowerCase();
    return sessions.filter(
      (s) => s.characterId === effectiveCharId && s.huntName.toLowerCase() === needle,
    );
  }, [sessions, activeHunt, effectiveCharId]);

  const stats = useMemo(() => {
    let totalSec = 0;
    const perMonster = new Map<string, number>();
    for (const s of matchingSessions) {
      totalSec += s.hunting.durationSec;
      for (const k of s.hunting.kills) {
        perMonster.set(k.name, (perMonster.get(k.name) ?? 0) + k.count);
      }
    }
    const hours = totalSec / 3600 || 0;
    const rows = Array.from(perMonster.entries())
      .map(([name, total]) => ({
        name,
        total,
        perHour: hours > 0 ? total / hours : 0,
      }))
      .sort((a, b) => b.perHour - a.perHour);
    return { totalSec, hours, rows };
  }, [matchingSessions]);

  const projected = useMemo(() => {
    const factor = minutes / 60;
    return stats.rows.map((r) => ({
      ...r,
      estimated: r.perHour * factor,
    }));
  }, [stats.rows, minutes]);

  const totalProjected = projected.reduce((acc, r) => acc + r.estimated, 0);
  const totalKillsHistoric = stats.rows.reduce((acc, r) => acc + r.total, 0);

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
        <h1 className="mt-1 font-display text-3xl font-bold">Calculadora de monstros/h</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma hunt já registrada e uma duração — a estimativa usa a média de todas as suas sessões nessa hunt.
        </p>
      </div>

      <div className="card-surface mb-6 grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Personagem</label>
          <select
            value={effectiveCharId}
            onChange={(e) => {
              setCharId(e.target.value);
              setHuntId("");
            }}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hunt / spot</label>
          <select
            value={effectiveHuntId}
            onChange={(e) => setHuntId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
            disabled={charHunts.length === 0}
          >
            {charHunts.length === 0 && <option value="">Nenhuma hunt salva</option>}
            {charHunts.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Duração (minutos)
          </label>
          <input
            type="number"
            min={1}
            max={24 * 60}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 0))}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {[30, 60, 120, 240, 480].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {m >= 60 ? `${m / 60}h` : `${m}min`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {matchingSessions.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="Sem sessões para essa hunt ainda"
          description="Importe pelo menos uma sessão dessa hunt para calcular a média."
          ctaLabel="Nova sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <SummaryCard icon={Clock} label="Base amostral" value={`${matchingSessions.length} sessão(ões)`} hint={`${fmtDuration(stats.totalSec)} totais`} />
            <SummaryCard icon={Sigma} label="Kills históricos" value={fmtNum(totalKillsHistoric)} hint={`${fmtNum(totalKillsHistoric / (stats.hours || 1))} /h em média`} />
            <SummaryCard
              icon={Swords}
              label={`Estimativa em ${minutes} min`}
              value={fmtNum(totalProjected)}
              hint="Soma projetada de todos os monstros"
              accent="gold"
            />
          </div>

          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="font-display text-sm font-semibold">Estimativa por monstro</div>
              <div className="text-xs text-muted-foreground">
                Baseado em {fmtDuration(stats.totalSec)} de hunt em "{activeHunt?.name}"
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="px-5 py-2 text-left font-medium">Monstro</th>
                    <th className="px-5 py-2 text-right font-medium">Média /h</th>
                    <th className="px-5 py-2 text-right font-medium">Total histórico</th>
                    <th className="px-5 py-2 text-right font-medium">
                      Estimado em {minutes}min
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projected.map((r) => (
                    <tr key={r.name} className="border-b border-border/40 last:border-0">
                      <td className="px-5 py-2 font-medium">{r.name}</td>
                      <td className="px-5 py-2 text-right text-muted-foreground">{fmtNum(r.perHour)}</td>
                      <td className="px-5 py-2 text-right text-muted-foreground">{fmtNum(r.total)}</td>
                      <td className="px-5 py-2 text-right font-semibold text-rubi-gold">
                        {fmtNum(r.estimated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "blue",
}: {
  icon: typeof Calculator;
  label: string;
  value: string;
  hint?: string;
  accent?: "blue" | "gold";
}) {
  const color = accent === "gold" ? "text-rubi-gold" : "text-rubi-blue";
  return (
    <div className="card-surface flex items-start gap-3 p-4">
      <div className={"flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent/60 " + color}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-display text-xl font-semibold">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
