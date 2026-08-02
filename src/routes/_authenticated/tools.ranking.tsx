import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Trophy, Search, User, Globe2, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { BountyBadge } from "@/components/BountyBadge";
import { PreyBadge } from "@/components/PreyBadge";
import { useAppStore, useHydrated } from "@/lib/store";
import { getCommunitySessions } from "@/lib/community.functions";
import { fmtGold, fmtNum } from "@/lib/format";
import {
  aggregateByHunt,
  fromCommunityRow,
  fromOwnSession,
  perHour,
  type CommunityRow,
  type CompareHunt,
} from "@/lib/compare";

export const Route = createFileRoute("/_authenticated/tools/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking de hunts — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Ranking das melhores hunts por Lucro/h, Raw XP/h e Kills/h — suas sessões ou da comunidade.",
      },
      { property: "og:title", content: "Ranking de hunts do RubinOT" },
      { property: "og:description", content: "Veja quais hunts rendem mais, no seu histórico ou na comunidade." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RankingPage,
});

const VOCATIONS = ["Elite Knight", "Royal Paladin", "Master Sorcerer", "Elder Druid", "Exalted Monk"];

type Metric = "gph" | "xph" | "killsh";

const METRICS: { value: Metric; label: string }[] = [
  { value: "gph", label: "Lucro/h" },
  { value: "xph", label: "Raw XP/h" },
  { value: "killsh", label: "Kills/h" },
];

function metricValue(h: CompareHunt, m: Metric): number | null {
  if (m === "gph") return perHour(h.balance, h.durationSec);
  if (m === "xph") return perHour(h.rawXpHunt, h.durationSec);
  return perHour(h.killsTotal, h.durationSec);
}

function metricFormat(v: number | null, m: Metric): string {
  if (v == null) return "—";
  return m === "gph" ? fmtGold(v) : fmtNum(v);
}

const MEDAL = ["🥇", "🥈", "🥉"];

function RankingPage() {
  const hydrated = useHydrated();
  const sessions = useAppStore((s) => s.sessions);
  const characters = useAppStore((s) => s.characters);
  const [tab, setTab] = useState<"own" | "community">("own");
  const [metric, setMetric] = useState<Metric>("gph");
  const [q, setQ] = useState("");
  const [vocation, setVocation] = useState("");

  const fetchCommunity = useServerFn(getCommunitySessions);
  const { data: communityData, isLoading: loadingCommunity } = useQuery({
    queryKey: ["community-sessions", "ranking", vocation],
    queryFn: () => fetchCommunity({ data: { limit: 200, vocation: vocation || undefined } }),
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

  const ranked = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? list.filter((h) => h.huntName.toLowerCase().includes(needle) || h.charName.toLowerCase().includes(needle))
      : list;
    return filtered
      .map((h) => ({ hunt: h, value: metricValue(h, metric) }))
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  }, [list, q, metric]);

  const loading = tab === "own" ? !hydrated : loadingCommunity;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <Trophy className="h-7 w-7 text-rubi-gold" /> Ranking de hunts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas hunts (média de todas as sessões) ordenadas por rendimento — ou o mesmo ranking com dados
          públicos da comunidade.
        </p>
      </div>

      <div className="card-surface mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-none gap-1 rounded-lg border border-border p-1">
          {(["own", "community"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (tab === t ? "bg-rubi-blue/20 text-rubi-blue" : "text-muted-foreground hover:text-foreground")
              }
            >
              {t === "own" ? <User className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
              {t === "own" ? "Pessoal" : "Comunidade"}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por hunt ou personagem..."
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm"
          />
        </div>

        {tab === "community" && (
          <select
            value={vocation}
            onChange={(e) => setVocation(e.target.value)}
            className="rounded-lg border border-border bg-input px-2 py-2 text-sm"
          >
            <option value="">Todas as vocações</option>
            {VOCATIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}

        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          className="rounded-lg border border-border bg-input px-2 py-2 text-sm"
        >
          {METRICS.map((m) => (
            <option key={m.value} value={m.value}>
              Ordenar por {m.label}
            </option>
          ))}
        </select>
      </div>

      {!loading && ranked.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-rubi-blue/40 bg-rubi-blue/10 px-4 py-3 text-sm text-rubi-blue">
          <Clock className="h-4 w-4 flex-none translate-y-0.5" />
          <span>
            <strong>Projeção para 1 hora de caça</strong>, calculada a partir da média de todas as sessões de
            cada hunt — os números abaixo não são o total acumulado, e sim o ritmo médio por hora. Use isso
            pra saber qual é a top 1 na hora, tanto na Comunidade quanto nas suas sessões.
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={tab === "own" ? "Nenhuma hunt para rankear" : "Nenhuma hunt pública encontrada"}
          description={
            tab === "own"
              ? "Importe suas hunts para ver o ranking pessoal."
              : "Ajuste os filtros ou volte mais tarde — a comunidade está sempre publicando novas hunts."
          }
          ctaLabel={tab === "own" ? "Importar sessão" : undefined}
          ctaTo={tab === "own" ? "/import" : undefined}
        />
      ) : (
        <ol className="space-y-2">
          {ranked.map((r, i) => {
            const h = r.hunt;
            const agg = (h.sessionCount ?? 1) > 1;
            const content = (
              <>
                <span
                  className={
                    "flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold " +
                    (i < 3 ? "text-lg" : "bg-accent text-muted-foreground")
                  }
                >
                  {i < 3 ? MEDAL[i] : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-display text-sm font-semibold">{h.huntName}</span>
                    {!agg && h.bounty && <BountyBadge bounty={h.bounty} className="flex-none" />}
                    {!agg && h.prey && <PreyBadge prey={h.prey} className="flex-none" />}
                    <span className="flex-none rounded-full border border-rubi-blue/50 bg-rubi-blue/10 px-2 py-0.5 text-[10px] font-semibold text-rubi-blue">
                      {(h.sessionCount ?? 1) === 1 ? "1 sessão" : `Média de ${h.sessionCount} sessões`}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {h.charName} · {h.vocation}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="font-mono text-base font-semibold text-rubi-gold">
                    {metricFormat(r.value, metric)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {METRICS.find((m) => m.value === metric)?.label}
                  </div>
                </div>
              </>
            );
            const className =
              "card-surface flex items-center gap-3 p-3 transition-colors " +
              (agg ? "" : "hover:border-rubi-blue/60");
            return (
              <li key={h.key}>
                {agg ? (
                  <div className={className}>{content}</div>
                ) : (
                  <Link
                    to={h.source === "own" ? "/sessions/$id" : "/community/$id"}
                    params={{ id: h.id }}
                    className={className}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </AppShell>
  );
}
