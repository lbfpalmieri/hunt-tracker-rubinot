import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { GitCompareArrows, Search, X, ArrowDown, ArrowLeft, Clock, Filter } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { HuntPickerCard } from "@/components/compare/HuntPickerCard";
import { CompareTable } from "@/components/compare/CompareTable";
import { SessionMiscCompare } from "@/components/compare/SessionMiscCompare";
import { useAppStore, useHydrated } from "@/lib/store";
import { MAX_COMPARE, fromOwnSession, type CompareHunt } from "@/lib/compare";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sessions/compare")({
  head: () => ({
    meta: [
      { title: "Comparar sessões — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Compare até 4 sessões específicas lado a lado — ideal pra testar runas, magias e rotações diferentes na mesma spot.",
      },
      { property: "og:title", content: "Comparar sessões do RubinOT" },
      {
        property: "og:description",
        content: "Selecione sessões individuais (sem médias) e veja qual rendeu mais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SessionsComparePage,
});

function SessionsComparePage() {
  const hydrated = useHydrated();
  const sessions = useAppStore((s) => s.sessions);
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);

  const [filterChar, setFilterChar] = useState<string>(activeId ?? "all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CompareHunt[]>([]);
  const compareRef = useRef<HTMLDivElement>(null);
  const scrollToCompare = () =>
    compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const all = useMemo(
    () =>
      sessions.map((s) => {
        const c = characters.find((x) => x.id === s.characterId);
        return { characterId: s.characterId, hunt: fromOwnSession(s, c?.name ?? "—", c?.vocation ?? "—") };
      }),
    [sessions, characters],
  );

  const visible = useMemo(() => {
    let list = all;
    if (filterChar !== "all") list = list.filter((x) => x.characterId === filterChar);
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (x) =>
          x.hunt.huntName.toLowerCase().includes(needle) || x.hunt.charName.toLowerCase().includes(needle),
      );
    }
    return list.map((x) => x.hunt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [all, filterChar, q]);

  const selectedKeys = new Set(selected.map((h) => h.key));
  const full = selected.length >= MAX_COMPARE;

  const selectedSessions = useMemo(
    () => selected.map((h) => sessions.find((s) => s.id === h.id)),
    [selected, sessions],
  );
  const miscCols = useMemo(
    () => selected.map((h) => ({ key: h.key, label: h.huntName, sub: fmtDate(h.createdAt) })),
    [selected],
  );

  const toggle = (h: CompareHunt) =>
    setSelected((prev) => {
      if (prev.some((x) => x.key === h.key)) return prev.filter((x) => x.key !== h.key);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, h];
    });

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/sessions"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Histórico</div>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
            <GitCompareArrows className="h-7 w-7 text-rubi-blue" /> Comparar sessões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada card é uma sessão individual, sem médias — ótimo pra testar runas, magias ou rotações
            diferentes na mesma spot. Selecione até {MAX_COMPARE} para comparar.
          </p>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" /> Limpar seleção ({selected.length})
          </button>
        )}
      </div>

      <div className="card-surface mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por hunt ou personagem..."
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
        </div>
      </div>

      {full && (
        <p className="mb-3 text-xs text-rubi-gold">
          Limite de {MAX_COMPARE} sessões atingido — remova uma para escolher outra.
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Nenhuma sessão para comparar"
          description="Importe suas hunts para poder compará-las entre si, sessão a sessão."
          ctaLabel="Importar sessão"
          ctaTo="/import"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.slice(0, 60).map((h) => (
            <HuntPickerCard
              key={h.key}
              hunt={h}
              selected={selectedKeys.has(h.key)}
              disabled={full}
              onToggle={() => toggle(h)}
            />
          ))}
        </div>
      )}

      <div ref={compareRef} className="mt-8 scroll-mt-4">
        {selected.length < 2 ? (
          <div className="card-surface p-6 text-center text-sm text-muted-foreground">
            Selecione pelo menos 2 sessões para gerar o comparativo.
          </div>
        ) : (
          <>
            <h2 className="mb-3 font-display text-xl font-bold">Comparativo ({selected.length})</h2>
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-rubi-blue/40 bg-rubi-blue/10 px-4 py-3 text-sm text-rubi-blue">
              <Clock className="h-4 w-4 flex-none translate-y-0.5" />
              <span>
                <strong>Projeção para 1 hora de caça</strong>, calculada a partir dos números de cada sessão —
                útil pra comparar sessões de durações diferentes de forma justa.
              </span>
            </div>
            <CompareTable hunts={selected} />
            <SessionMiscCompare sessions={selectedSessions} cols={miscCols} />
          </>
        )}
      </div>

      {selected.length >= 2 && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6">
          <button
            type="button"
            onClick={scrollToCompare}
            className="flex items-center gap-3 rounded-full border border-rubi-gold/60 bg-background/95 px-5 py-3 text-sm font-semibold text-rubi-gold shadow-glow-gold backdrop-blur-md transition-transform hover:scale-[1.02]"
          >
            <GitCompareArrows className="h-4 w-4 flex-none" />
            Ver comparativo ({selected.length})
            <ArrowDown className="h-4 w-4 flex-none animate-bounce" />
          </button>
        </div>
      )}
    </AppShell>
  );
}
