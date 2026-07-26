import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtDuration, fmtGold, fmtNum, fmtDate } from "@/lib/format";
import { ScrollText, Search, Filter, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Sessões — RubinOT Hunt Tracker" },
      { name: "description", content: "Histórico completo das suas hunts no RubinOT." },
      { property: "og:title", content: "Histórico de sessões" },
      { property: "og:description", content: "Todas as suas hunts no RubinOT em um só lugar." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SessionsLayout,
});

function SessionsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // If a nested route (/sessions/$id) is matched, only render its outlet.
  if (pathname !== "/sessions") return <Outlet />;
  return <SessionsList />;
}

function SessionsList() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const activeId = useAppStore((s) => s.activeCharacterId);

  const [q, setQ] = useState("");
  const [filterChar, setFilterChar] = useState<string>(activeId ?? "all");
  const [sort, setSort] = useState<"recent" | "gph" | "xph" | "duration">("recent");

  const visible = useMemo(() => {
    let list = sessions.slice();
    if (filterChar !== "all") list = list.filter((s) => s.characterId === filterChar);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((s) => s.huntName.toLowerCase().includes(needle));
    }
    list.sort((a, b) => {
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
      const dur = (s: typeof a) => s.hunting.durationSec / 3600 || 1;
      if (sort === "gph") return b.hunting.balance / dur(b) - a.hunting.balance / dur(a);
      if (sort === "xph") return (b.hunting.rawXp || b.hunting.xpGain) / dur(b) - (a.hunting.rawXp || a.hunting.xpGain) / dur(a);
      return b.hunting.durationSec - a.hunting.durationSec;
    });
    return list;
  }, [sessions, filterChar, q, sort]);

  const charName = (id: string) => characters.find((c) => c.id === id)?.name ?? "—";

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Histórico</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Sessões</h1>
        </div>
        <div className="text-sm text-muted-foreground">{visible.length} resultado(s)</div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma sessão registrada"
          description="Importe seu primeiro hunt analyser para começar o histórico."
          ctaLabel="Importar sessão"
          ctaTo="/import"
        />
      ) : (
        <>
          <div className="card-surface mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome da hunt..."
                className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterChar}
                onChange={(e) => setFilterChar(e.target.value)}
                className="rounded-lg border border-border bg-input px-2 py-1.5 text-sm"
              >
                <option value="all">Todos personagens</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="rounded-lg border border-border bg-input px-2 py-1.5 text-sm"
              >
                <option value="recent">Mais recentes</option>
                <option value="gph">Melhor Lucro/h</option>
                <option value="xph">Melhor Raw XP/h</option>
                <option value="duration">Maior duração</option>
              </select>
            </div>
          </div>

          <ul className="space-y-2">
            {visible.map((s) => {
              const gph = s.hunting.balance / (s.hunting.durationSec / 3600 || 1);
              return (
                <li key={s.id}>
                  <Link
                    to="/sessions/$id"
                    params={{ id: s.id }}
                    className="card-surface flex flex-col gap-3 px-4 py-3 transition-colors hover:border-rubi-blue/60 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-semibold">{s.huntName}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {charName(s.characterId)} · {fmtDate(s.createdAt)} · {fmtDuration(s.hunting.durationSec)}
                      </div>
                    </div>
                    <div className="grid flex-none grid-cols-3 gap-4 text-right text-sm sm:grid-cols-3">
                      <MiniStat label="Raw XP/h" value={fmtNum((s.hunting.rawXp || s.hunting.xpGain) / (s.hunting.durationSec / 3600 || 1))} tone="blue" />
                      <MiniStat label="Lucro/h" value={fmtGold(gph)} tone={gph >= 0 ? "success" : "danger"} />
                      <MiniStat label="Balance" value={fmtGold(s.hunting.balance)} tone="gold" />
                    </div>
                    <ChevronRight className="hidden h-4 w-4 flex-none text-muted-foreground sm:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AppShell>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "blue" | "gold" | "success" | "danger" }) {
  const c = {
    blue: "text-rubi-blue",
    gold: "text-rubi-gold",
    success: "text-rubi-success",
    danger: "text-rubi-danger",
  }[tone];
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"font-semibold " + c}>{value}</div>
    </div>
  );
}
