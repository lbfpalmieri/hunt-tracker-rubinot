import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { GitCompareArrows, Search, X, ArrowDown, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { HuntPickerCard } from "@/components/compare/HuntPickerCard";
import { CompareTable } from "@/components/compare/CompareTable";
import { useAppStore, useHydrated } from "@/lib/store";
import { getCommunitySessions } from "@/lib/community.functions";
import {
  MAX_COMPARE,
  aggregateByHunt,
  fromCommunityRow,
  fromOwnSession,
  type CommunityRow,
  type CompareHunt,
} from "@/lib/compare";

export const Route = createFileRoute("/_authenticated/tools/compare")({
  head: () => ({
    meta: [
      { title: "Comparar hunts — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Compare até 4 hunts lado a lado: Raw XP/h, lucro/h, loot, supplies, kills e dano — suas sessões ou da comunidade.",
      },
      { property: "og:title", content: "Comparar hunts do RubinOT" },
      {
        property: "og:description",
        content: "Selecione até 4 sessões e veja a tabela comparativa automática.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const hydrated = useHydrated();
  const sessions = useAppStore((s) => s.sessions);
  const characters = useAppStore((s) => s.characters);
  const [tab, setTab] = useState<"own" | "community">("own");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CompareHunt[]>([]);
  const compareRef = useRef<HTMLDivElement>(null);
  const scrollToCompare = () =>
    compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const fetchCommunity = useServerFn(getCommunitySessions);
  const { data: communityData, isLoading: loadingCommunity } = useQuery({
    queryKey: ["community-sessions", "compare"],
    queryFn: () => fetchCommunity({ data: { limit: 200 } }),
    enabled: tab === "community",
  });

  const ownHunts = useMemo(
    () =>
      aggregateByHunt(
        sessions.map((s) => {
          const c = characters.find((x) => x.id === s.characterId);
          return fromOwnSession(s, c?.name ?? "—", c?.vocation ?? "—");
        }),
      ),
    [sessions, characters],
  );

  const communityHunts = useMemo(
    () => aggregateByHunt(((communityData?.sessions ?? []) as CommunityRow[]).map(fromCommunityRow)),
    [communityData],
  );


  const list = tab === "own" ? ownHunts : communityHunts;
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (h) =>
        h.huntName.toLowerCase().includes(needle) ||
        h.charName.toLowerCase().includes(needle) ||
        h.vocation.toLowerCase().includes(needle),
    );
  }, [list, q]);

  const selectedKeys = new Set(selected.map((h) => h.key));
  const full = selected.length >= MAX_COMPARE;

  const toggle = (h: CompareHunt) =>
    setSelected((prev) => {
      if (prev.some((x) => x.key === h.key)) return prev.filter((x) => x.key !== h.key);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, h];
    });

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
            <GitCompareArrows className="h-7 w-7 text-rubi-blue" /> Comparar hunts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada card é uma hunt (média de todas as sessões dela). Clique para selecionar até {MAX_COMPARE} e o
            comparativo aparece automaticamente abaixo.
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
        <div className="flex flex-none gap-1 rounded-lg border border-border p-1">
          {(["own", "community"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (tab === t ? "bg-rubi-blue/20 text-rubi-blue" : "text-muted-foreground hover:text-foreground")
              }
            >
              {t === "own" ? "Minhas sessões" : "Comunidade"}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por hunt, personagem ou vocação..."
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {full && (
        <p className="mb-3 text-xs text-rubi-gold">
          Limite de {MAX_COMPARE} hunts atingido — remova uma para escolher outra.
        </p>
      )}

      {tab === "own" && !hydrated ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
      ) : tab === "community" && loadingCommunity ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title={tab === "own" ? "Nenhuma sessão para comparar" : "Nenhuma hunt pública encontrada"}
          description={
            tab === "own"
              ? "Importe suas hunts para poder compará-las entre si ou com a comunidade."
              : "Ajuste a busca ou volte mais tarde — a comunidade está sempre publicando novas hunts."
          }
          ctaLabel={tab === "own" ? "Importar sessão" : undefined}
          ctaTo={tab === "own" ? "/import" : undefined}
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
            Selecione pelo menos 2 hunts para gerar o comparativo.
          </div>
        ) : (
          <>
            <h2 className="mb-3 font-display text-xl font-bold">Comparativo ({selected.length})</h2>
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-rubi-blue/40 bg-rubi-blue/10 px-4 py-3 text-sm text-rubi-blue">
              <Clock className="h-4 w-4 flex-none translate-y-0.5" />
              <span>
                <strong>Projeção para 1 hora de caça</strong>, calculada a partir da média de todas as sessões de
                cada hunt — os números abaixo não são o total acumulado, e sim o ritmo médio por hora.
              </span>
            </div>
            <CompareTable hunts={selected} />
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
