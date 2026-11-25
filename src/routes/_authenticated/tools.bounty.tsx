import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GameIcon } from "@/components/GameIcon";
import { useAppStore, useHydrated } from "@/lib/store";
import { useModeSessions } from "@/lib/play-mode";
import { BOUNTY_DIFFICULTIES } from "@/lib/bounty";
import { buildBountyPanel, bountyCreatureOf, type BountyCreatureRow } from "@/lib/bounty-panel";
import { fmtDuration, fmtGold, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tools/bounty")({
  head: () => ({
    meta: [
      { title: "Painel de Bounty — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Quais criaturas de Bounty você fecha mais rápido: abates/h, tempo da task, XP/h e lucro/h.",
      },
    ],
  }),
  component: BountyPanelPage,
});

const fmtRate = (v: number | null) => (v == null ? "—" : fmtNum(v));

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-semibold">{value}</div>
      {hint && <div className="text-2xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function CreatureCard({ row, rank }: { row: BountyCreatureRow; rank: number }) {
  const semRitmo = row.measuredTasks === 0;
  return (
    <li className="card-surface p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent text-xs font-bold text-muted-foreground">
          {rank}
        </span>
        <GameIcon name={row.creature} size={40} className="flex-none" fallback={<Target className="h-8 w-8 flex-none text-muted-foreground" />} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold">{row.creature}</div>
          <div className="text-xs text-muted-foreground">
            {row.tasks === 1 ? "1 task" : `${row.tasks} tasks`}
            {row.measuredTasks < row.tasks && row.measuredTasks > 0 && ` · ${row.measuredTasks} com abates registrados`}
          </div>
        </div>
        <div className="flex-none text-right">
          <div className="font-mono text-base font-semibold text-rubi-gold">{fmtRate(row.avgKillsPerHour)}</div>
          <div className="text-2xs text-muted-foreground">abates/h (média)</div>
        </div>
      </div>
      {semRitmo ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Os abates dessa criatura não aparecem no Hunting Analyser dessas sessões, então não dá pra calcular o ritmo.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 sm:grid-cols-4">
          <Stat label="Melhor abates/h" value={fmtRate(row.bestKillsPerHour)} />
          <Stat label="Tempo médio da task" value={row.avgTaskSec == null ? "—" : fmtDuration(row.avgTaskSec)} />
          <Stat label="Raw XP/h" value={fmtRate(row.xpPerHour)} hint="sem o prêmio da Bounty" />
          <Stat label="Lucro/h" value={row.profitPerHour == null ? "—" : fmtGold(row.profitPerHour)} />
        </div>
      )}
    </li>
  );
}

function BountyPanelPage() {
  const hydrated = useHydrated();
  const sessions = useModeSessions();
  const characters = useAppStore((s) => s.characters);
  const [characterId, setCharacterId] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const withBounty = useMemo(() => sessions.filter((s) => bountyCreatureOf(s)), [sessions]);
  const rows = useMemo(
    () => buildBountyPanel(sessions, { characterId: characterId || null, difficulty: difficulty || null }),
    [sessions, characterId, difficulty],
  );
  // Só oferece personagem que tem Bounty registrada.
  const charOptions = useMemo(() => {
    const ids = new Set(withBounty.map((s) => s.characterId));
    return characters.filter((c) => ids.has(c.id));
  }, [withBounty, characters]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
        <h1 className="mt-1 flex items-center gap-2 font-brand text-3xl font-bold">
          <Target className="h-7 w-7 text-rubi-gold" /> Painel de Bounty
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As criaturas de Bounty que você já fez, das que caem mais rápido pras mais lentas. O ritmo é o das
          suas próprias sessões: abates da criatura da task ÷ tempo da sessão.
        </p>
      </div>

      {!hydrated ? (
        <div className="space-y-2" role="status" aria-label="Carregando o painel de Bounty">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : withBounty.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma Bounty registrada ainda"
          description="Ao salvar uma sessão, no passo Bounty do assistente, escolha a dificuldade, o escudo e a criatura da task. Quando a sessão fechar uma task, ela aparece aqui."
          ctaLabel="Registrar uma sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          <div className="card-surface mb-4 grid gap-3 p-3 sm:grid-cols-2">
            <label className="block text-xs text-muted-foreground">
              Personagem
              <select
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-2 py-2 text-sm text-foreground"
              >
                <option value="">Todos os personagens</option>
                {charOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted-foreground">
              Dificuldade
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-2 py-2 text-sm text-foreground"
              >
                <option value="">Todas as dificuldades</option>
                {BOUNTY_DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nada com esse filtro"
              description="Nenhuma Bounty desse personagem e dificuldade. Troque o filtro pra ver as outras."
              ctaLabel="Limpar filtros"
              onCta={() => {
                setCharacterId("");
                setDifficulty("");
              }}
            />
          ) : (
            <ol className="space-y-2">
              {rows.map((r, i) => (
                <CreatureCard key={r.creature.toLowerCase()} row={r} rank={i + 1} />
              ))}
            </ol>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Sessões de Bounty antigas, sem a criatura registrada, não entram. Dá pra completar a criatura em
            cada sessão.
          </p>
        </>
      )}
    </AppShell>
  );
}
