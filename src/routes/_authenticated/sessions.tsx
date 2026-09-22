import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { HuntDashboardDialog } from "@/components/HuntDashboardDialog";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtDuration, fmtGold, fmtNum, fmtDate } from "@/lib/format";
import { huntRawXp } from "@/lib/bounty";
import { aggregateByHunt, fromOwnSession, perHour } from "@/lib/compare";
import { BountyBadge } from "@/components/BountyBadge";
import { PreyBadge } from "@/components/PreyBadge";
import {
  ScrollText, Search, Filter, ChevronRight, GitCompareArrows, StickyNote, Layers, LayoutDashboard,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/Pagination";

const SESSIONS_PAGE_SIZE = 20;
const HUNTS_PAGE_SIZE = 12;

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
  // Trocar o personagem ativo (header) deve refletir aqui na hora, sem precisar
  // recarregar a página — sem isso o filtro fica travado no personagem de quando
  // a página abriu.
  useEffect(() => {
    setFilterChar(activeId ?? "all");
  }, [activeId]);
  const [sort, setSort] = useState<"recent" | "gph" | "xph" | "duration">("recent");
  const [view, setView] = useState<"sessions" | "hunts">("sessions");
  const [dashboardHuntName, setDashboardHuntName] = useState<string | null>(null);
  // Renderizar as centenas de sessões de uma vez travava a tela; paginamos o
  // que aparece (os filtros/ordenação continuam rodando sobre a lista toda).
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [q, filterChar, sort, view]);

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
      if (sort === "xph")
        return (huntRawXp(b) ?? 0) / dur(b) - (huntRawXp(a) ?? 0) / dur(a);
      return b.hunting.durationSec - a.hunting.durationSec;
    });
    return list;
  }, [sessions, filterChar, q, sort]);

  const charName = (id: string) => characters.find((c) => c.id === id)?.name ?? "—";

  /** Sessões cruas (respeitando o filtro de personagem) convertidas pra CompareHunt — base da aba Hunts. */
  const compareRows = useMemo(() => {
    let list = sessions;
    if (filterChar !== "all") list = list.filter((s) => s.characterId === filterChar);
    return list.map((s) => {
      const c = characters.find((x) => x.id === s.characterId);
      return fromOwnSession(s, c?.name ?? "—", c?.vocation ?? "—");
    });
  }, [sessions, filterChar, characters]);

  /** Uma hunt por card, com a MÉDIA de todas as sessões dela — o dashboard filtra/detalha depois. */
  const huntsList = useMemo(() => {
    const aggregated = aggregateByHunt(compareRows);
    const needle = q.trim().toLowerCase();
    const filtered = needle ? aggregated.filter((h) => h.huntName.toLowerCase().includes(needle)) : aggregated;
    return filtered.slice().sort((a, b) => (b.sessionCount ?? 1) - (a.sessionCount ?? 1));
  }, [compareRows, q]);

  const sessionsTotalPages = Math.max(1, Math.ceil(visible.length / SESSIONS_PAGE_SIZE));
  const pagedSessions = useMemo(
    () => visible.slice((page - 1) * SESSIONS_PAGE_SIZE, page * SESSIONS_PAGE_SIZE),
    [visible, page],
  );
  const huntsTotalPages = Math.max(1, Math.ceil(huntsList.length / HUNTS_PAGE_SIZE));
  const pagedHunts = useMemo(
    () => huntsList.slice((page - 1) * HUNTS_PAGE_SIZE, page * HUNTS_PAGE_SIZE),
    [huntsList, page],
  );


  /** Sessões cruas da hunt aberta no dashboard — o próprio dialog agrega e filtra por Bounty/Prey. */
  const dashboardSessions = useMemo(() => {
    if (!dashboardHuntName) return [];
    return compareRows.filter((s) => s.huntName.trim().toLowerCase() === dashboardHuntName.trim().toLowerCase());
  }, [dashboardHuntName, compareRows]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Histórico</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Sessões</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {view === "sessions" ? visible.length : huntsList.length} resultado(s)
          </span>
          {sessions.length > 0 && (
            <Link
              to="/sessions/compare"
              className="group inline-flex items-center gap-2 rounded-xl border border-rubi-gold/50 bg-gradient-to-r from-rubi-gold/10 to-rubi-blue/10 px-4 py-2 text-sm font-bold shadow-glow-gold transition-all hover:scale-[1.03] hover:border-rubi-blue/50 hover:shadow-glow-blue"
            >
              <GitCompareArrows className="h-4 w-4 flex-none text-rubi-gold transition-colors group-hover:text-rubi-blue" />
              <span className="text-gradient-brand">Comparar sessões</span>
            </Link>
          )}
        </div>
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
          <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
            <button
              type="button"
              onClick={() => setView("sessions")}
              className={
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors " +
                (view === "sessions" ? "bg-rubi-blue-soft text-rubi-blue" : "text-muted-foreground")
              }
            >
              <ScrollText className="h-3.5 w-3.5" /> Sessões
            </button>
            <button
              type="button"
              onClick={() => setView("hunts")}
              className={
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors " +
                (view === "hunts" ? "bg-rubi-blue-soft text-rubi-blue" : "text-muted-foreground")
              }
            >
              <Layers className="h-3.5 w-3.5" /> Hunts
            </button>
          </div>

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
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:flex sm:items-center">
              <Filter className="hidden h-4 w-4 text-muted-foreground min-[420px]:block" />
              <select
                value={filterChar}
                onChange={(e) => setFilterChar(e.target.value)}
                className="min-w-0 rounded-lg border border-border bg-input px-2 py-2 text-sm"
              >
                <option value="all">Todos personagens</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {view === "sessions" && (
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="min-w-0 rounded-lg border border-border bg-input px-2 py-2 text-sm"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="gph">Melhor Lucro/h</option>
                  <option value="xph">Melhor Raw XP/h</option>
                  <option value="duration">Maior duração</option>
                </select>
              )}
            </div>
          </div>

          {view === "hunts" ? (
            huntsList.length === 0 ? (
              <p className="card-surface p-6 text-center text-sm text-muted-foreground">
                Nenhuma hunt encontrada com esse filtro.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pagedHunts.map((h) => (
                  <div key={h.key} className="card-surface p-5 transition-colors hover:border-rubi-blue/50">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold leading-tight">{h.huntName}</h2>
                      <span className="flex-none rounded-full bg-rubi-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-blue">
                        {h.vocation}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {h.charName} · {(h.sessionCount ?? 1) === 1 ? "1 sessão" : `${h.sessionCount} sessões`} ·{" "}
                      {fmtDuration(h.totalDurationSec ?? h.durationSec)} registradas
                    </p>
                    <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <MiniStat
                        label="Raw XP/h"
                        value={fmtNum(perHour(h.rawXpHunt, h.durationSec) ?? 0)}
                        tone="blue"
                      />
                      <MiniStat
                        label="Lucro/h"
                        value={fmtGold(perHour(h.balance, h.durationSec) ?? 0)}
                        tone={(perHour(h.balance, h.durationSec) ?? 0) >= 0 ? "success" : "danger"}
                      />
                      <MiniStat
                        label="Kills/h"
                        value={fmtNum(perHour(h.killsTotal, h.durationSec) ?? 0)}
                        tone="gold"
                      />
                    </dl>
                    <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => { setQ(h.huntName); setView("sessions"); }}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border/60 py-1.5 text-muted-foreground transition-colors hover:border-rubi-blue/50 hover:text-rubi-blue"
                      >
                        Sessões <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashboardHuntName(h.huntName)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-rubi-gold/40 bg-rubi-gold-soft py-1.5 text-rubi-gold transition-colors hover:border-rubi-gold"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                      </button>
                    </div>
                  </div>
                ))}
                </div>
                <Pagination page={page} totalPages={huntsTotalPages} onPageChange={setPage} />
              </>
            )
          ) : (
          <ul className="space-y-2">
            {pagedSessions.map((s) => {
              const gph = s.hunting.balance / (s.hunting.durationSec / 3600 || 1);
              return (
                <li key={s.id}>
                  <Link
                    to="/sessions/$id"
                    params={{ id: s.id }}
                    className="card-surface flex flex-col gap-3 px-4 py-3 transition-colors hover:border-rubi-blue/60 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-display text-base font-semibold">{s.huntName}</span>
                        {s.bounty && <BountyBadge bounty={s.bounty} className="flex-none" />}
                        {s.prey && <PreyBadge prey={s.prey} className="flex-none" />}
                        {s.notes && (
                          <span title={s.notes} className="flex-none text-rubi-gold">
                            <StickyNote className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {charName(s.characterId)} · {fmtDate(s.createdAt)} · {fmtDuration(s.hunting.durationSec)}
                      </div>
                    </div>
                    <div className="grid flex-none grid-cols-3 gap-4 text-right text-sm sm:grid-cols-3">
                      <MiniStat
                        label="Raw XP/h"
                        value={
                          huntRawXp(s) == null
                            ? "—"
                            : fmtNum((huntRawXp(s) as number) / (s.hunting.durationSec / 3600 || 1))
                        }
                        tone="blue"
                      />

                      <MiniStat label="Lucro/h" value={fmtGold(gph)} tone={gph >= 0 ? "success" : "danger"} />
                      <MiniStat label="Balance" value={fmtGold(s.hunting.balance)} tone="gold" />
                    </div>
                    <ChevronRight className="hidden h-4 w-4 flex-none text-muted-foreground sm:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
          )}

          <HuntDashboardDialog
            sessions={dashboardSessions}
            open={!!dashboardHuntName}
            onOpenChange={(o) => { if (!o) setDashboardHuntName(null); }}
          />
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
