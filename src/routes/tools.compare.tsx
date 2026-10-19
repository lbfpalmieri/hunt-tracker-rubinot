import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GitCompareArrows,
  Search,
  X,
  ArrowDown,
  Clock,
  Trophy,
  Sparkles,
  AlertTriangle,
  BookmarkCheck,
  FlaskConical,
  Layers,
  ListOrdered,
} from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { EmptyState } from "@/components/EmptyState";
import { HuntPickerCard } from "@/components/compare/HuntPickerCard";
import { CompareTable } from "@/components/compare/CompareTable";
import { SaveComparisonPanel } from "@/components/compare/SaveComparisonPanel";
import { SessionMiscCompare } from "@/components/compare/SessionMiscCompare";
import { ExportPdfButton, ExportPdfHeader } from "@/components/compare/ExportPdfButton";
import { useAppStore, useHydrated } from "@/lib/store";
import { useModeSessions, usePlayMode } from "@/lib/play-mode";
import { useAuthState } from "@/lib/use-auth-state";
import { getCommunitySessions } from "@/lib/community.functions";
import { confirmDialog } from "@/lib/confirm-dialog";
import {
  MAX_COMPARE,
  MIN_HUNT_DURATION_SEC,
  aggregateByHunt,
  filterByBonusInclusion,
  fromCommunityRow,
  fromOwnSession,
  groupSessionsByHunt,
  isHuntAverage,
  isHuntValid,
  stillHasData,
  type CommunityRow,
  type CompareHunt,
} from "@/lib/compare";
import { filterByLatestPatch, formatPatchDate, isPrePatch, latestPatch } from "@/lib/patches";
import { fmtDate, fmtDuration } from "@/lib/format";

export const Route = createFileRoute("/tools/compare")({
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

/** "Hunt" = média de todas as sessões da hunt; "Sessão" = cada sessão sozinha (ex.: testes de set na mesma hunt). */
type CompareView = "hunts" | "sessions";
const VIEW_KEY = "rubinot:compare-view";
/** Quantos cards a lista mostra de uma vez (os mais recentes; a busca acha os outros). */
const LIST_CAP = 60;

function ComparePage() {
  const hydrated = useHydrated();
  const sessions = useModeSessions();
  const characters = useAppStore((s) => s.characters);
  // Página pública: visitante (sem conta) só compara hunts da Comunidade e não salva comparação.
  const visitor = useAuthState() === "out";
  const [ownTab, setTab] = useState<"own" | "community">("own");
  const tab = visitor ? "community" : ownTab;
  const [view, setViewState] = useState<CompareView>("hunts");
  // Lembra o modo de ver neste navegador (lido depois da hidratação pra não divergir do SSR).
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "sessions") setViewState("sessions");
    } catch {
      // sem storage: começa em "Hunt"
    }
  }, []);
  const setView = (v: CompareView) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // sem storage: só não lembra na próxima visita
    }
  };
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CompareHunt[]>([]);
  const [includeBounty, setIncludeBounty] = useState(true);
  const [includePrey, setIncludePrey] = useState(true);
  const [includePrePatch, setIncludePrePatch] = useState(false);
  const patch = latestPatch();
  const compareRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const scrollToCompare = () =>
    compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const fetchCommunity = useServerFn(getCommunitySessions);
  const mode = usePlayMode();
  const { data: communityData, isLoading: loadingCommunity } = useQuery({
    queryKey: ["community-sessions", "compare", mode],
    queryFn: () => fetchCommunity({ data: { limit: 200, mode } }),
    enabled: tab === "community",
  });

  const ownRaw = useMemo(
    () =>
      sessions.map((s) => {
        const c = characters.find((x) => x.id === s.characterId);
        return fromOwnSession(s, c?.name ?? "—", c?.vocation ?? "—");
      }),
    [sessions, characters],
  );
  const communityRaw = useMemo(
    () => ((communityData?.sessions ?? []) as CommunityRow[]).map(fromCommunityRow),
    [communityData],
  );

  const ownFilteredByBonus = useMemo(
    () => filterByBonusInclusion(ownRaw, includeBounty, includePrey),
    [ownRaw, includeBounty, includePrey],
  );
  const communityFilteredByBonus = useMemo(
    () => filterByBonusInclusion(communityRaw, includeBounty, includePrey),
    [communityRaw, includeBounty, includePrey],
  );
  // Sessões individuais já filtradas — base das médias e do "Ver por Sessão" (que não tem piso de duração).
  const ownSessions = useMemo(
    () => filterByLatestPatch(ownFilteredByBonus, (h) => h.createdAt, includePrePatch),
    [ownFilteredByBonus, includePrePatch],
  );
  const communitySessions = useMemo(
    () => filterByLatestPatch(communityFilteredByBonus, (h) => h.createdAt, includePrePatch),
    [communityFilteredByBonus, includePrePatch],
  );
  const ownHuntsAll = useMemo(() => aggregateByHunt(ownSessions), [ownSessions]);
  const communityHuntsAll = useMemo(() => aggregateByHunt(communitySessions), [communitySessions]);
  const ownHunts = useMemo(() => ownHuntsAll.filter(isHuntValid), [ownHuntsAll]);
  const communityHunts = useMemo(() => communityHuntsAll.filter(isHuntValid), [communityHuntsAll]);
  const hiddenCount =
    (tab === "own" ? ownHuntsAll.length - ownHunts.length : communityHuntsAll.length - communityHunts.length);
  const prePatchCount = useMemo(() => {
    const raw = tab === "own" ? ownFilteredByBonus : communityFilteredByBonus;
    return patch ? raw.filter((h) => isPrePatch(h.createdAt, patch)).length : 0;
  }, [tab, ownFilteredByBonus, communityFilteredByBonus, patch]);

  /** Selecionados (média da hunt ou sessão) que ficariam sem dados com a mudança de filtro. */
  const selectedThatWouldVanish = (nextIncludeBounty: boolean, nextIncludePrey: boolean, nextIncludePrePatch: boolean) =>
    selected.filter(
      (sel) =>
        !stillHasData(
          sel,
          sel.source === "own" ? ownRaw : communityRaw,
          (h) =>
            (nextIncludeBounty || !h.bounty) &&
            (nextIncludePrey || !(h.prey && h.prey.length)) &&
            (nextIncludePrePatch || !isPrePatch(h.createdAt)),
        ),
    );

  const applyBonusFilter = async (kind: "bounty" | "prey" | "prePatch", checked: boolean) => {
    const nextBounty = kind === "bounty" ? checked : includeBounty;
    const nextPrey = kind === "prey" ? checked : includePrey;
    const nextPrePatch = kind === "prePatch" ? checked : includePrePatch;
    if (!checked) {
      const vanishing = selectedThatWouldVanish(nextBounty, nextPrey, nextPrePatch);
      if (vanishing.length > 0) {
        const names = vanishing
          .map((h) => (isHuntAverage(h) ? h.huntName : `${h.huntName} (sessão de ${fmtDate(h.createdAt)})`))
          .join("\n");
        const many = vanishing.length > 1;
        const description =
          kind === "prePatch"
            ? `${many ? "Essas hunts só têm" : "Essa hunt só tem"} sessão(ões) de antes do ${patch?.label ?? "balanceamento"} — sem incluir esses dados, ${many ? "elas saem" : "ela sai"} da comparação:\n\n${names}\n\nRemover da comparação e voltar a esconder dados de antes do balanceamento?`
            : `${many ? "Essas hunts só têm" : "Essa hunt só tem"} sessão(ões) com ${kind === "bounty" ? "Bounty" : "Prey"} — sem esse filtro, ${many ? "elas saem" : "ela sai"} da comparação:\n\n${names}\n\nRemover da comparação e desativar o filtro de ${kind === "bounty" ? "Bounty" : "Prey"}?`;
        const ok = await confirmDialog({
          title: "Remover hunt da comparação?",
          description,
          confirmLabel: "Remover e desativar filtro",
          cancelLabel: "Manter filtro ligado",
        });
        if (!ok) return;
        setSelected((prev) => prev.filter((h) => !vanishing.includes(h)));
      }
    }
    if (kind === "bounty") setIncludeBounty(checked);
    else if (kind === "prey") setIncludePrey(checked);
    else setIncludePrePatch(checked);
  };


  const list =
    view === "sessions"
      ? (tab === "own" ? ownSessions : communitySessions)
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : tab === "own"
        ? ownHunts
        : communityHunts;
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

  const sessionGroups = useMemo(
    () => (view === "sessions" ? groupSessionsByHunt(visible.slice(0, LIST_CAP)) : null),
    [view, visible],
  );

  const selectedKeys = new Set(selected.map((h) => h.key));
  const full = selected.length >= MAX_COMPARE;

  // Misc Data (charm, imbuement, item upgrade) só existe nas suas sessões individuais.
  const [showMisc, setShowMisc] = useState(true);
  const [exporting, setExporting] = useState(false);
  const miscSessions = useMemo(
    () =>
      selected.map((h) =>
        h.source === "own" && !isHuntAverage(h) ? sessions.find((s) => s.id === h.id) : undefined,
      ),
    [selected, sessions],
  );
  const hasMisc = miscSessions.some(Boolean);
  const miscCols = useMemo(
    () =>
      selected.map((h) => ({
        key: h.key,
        label: h.huntName,
        sub: isHuntAverage(h) ? `Média de ${h.sessionCount} sessões` : fmtDate(h.createdAt),
      })),
    [selected],
  );
  const anyAverage = selected.some(isHuntAverage);

  const toggle = (h: CompareHunt) =>
    setSelected((prev) => {
      if (prev.some((x) => x.key === h.key)) return prev.filter((x) => x.key !== h.key);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, h];
    });

  const pickerCard = (h: CompareHunt) => (
    <HuntPickerCard
      key={h.key}
      hunt={h}
      selected={selectedKeys.has(h.key)}
      disabled={full}
      onToggle={() => toggle(h)}
    />
  );

  return (
    <SiteShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
          <h1 className="mt-1 flex items-center gap-2 font-brand text-3xl font-bold">
            <GitCompareArrows className="h-7 w-7 text-rubi-blue" /> Comparar hunts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "sessions"
              ? "Cada card é uma sessão (sem média), agrupada pela hunt — dá pra comparar testes de set, roda ou rotação feitos na mesma hunt."
              : "Cada card é uma hunt (média de todas as sessões dela)."}{" "}
            Clique para selecionar até {MAX_COMPARE} e o comparativo aparece automaticamente abaixo.
          </p>

        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!visitor && (
          <Link
            to="/tools/comparisons"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-rubi-blue/40 hover:text-foreground"
          >
            <BookmarkCheck className="h-4 w-4" /> Comparações salvas
          </Link>
          )}
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
      </div>

      <div className="card-surface mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        {!visitor && (
        <div className="grid flex-none grid-cols-2 gap-1 rounded-lg border border-border p-1">
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
        )}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por hunt, personagem ou vocação..."
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div
          role="group"
          aria-label="Ver por"
          className="grid flex-none grid-cols-2 gap-1 rounded-lg border border-border p-1"
        >
          {(
            [
              ["hunts", "Hunt (média)", Layers],
              ["sessions", "Sessão", ListOrdered],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={
                "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (view === v ? "bg-rubi-blue/20 text-rubi-blue" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4 flex-none" /> {label}
            </button>
          ))}
        </div>
        <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includeBounty}
              onChange={(e) => applyBonusFilter("bounty", e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--rubi-gold)]"
            />
            <Trophy className="h-3.5 w-3.5 text-rubi-gold" /> Bounty
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includePrey}
              onChange={(e) => applyBonusFilter("prey", e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--rubi-blue)]"
            />
            <Sparkles className="h-3.5 w-3.5 text-rubi-blue" /> Prey
          </label>
          {patch && (
            <label
              className="flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground"
              title={`Sessões de antes do ${patch.label} (${formatPatchDate(patch)})`}
            >
              <input
                type="checkbox"
                checked={includePrePatch}
                onChange={(e) => applyBonusFilter("prePatch", e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--rubi-gold)]"
              />
              <AlertTriangle className="h-3.5 w-3.5 text-rubi-gold" /> Antes do {patch.label}
            </label>
          )}
        </div>
      </div>
      <p className="-mt-2 mb-1 text-xs text-muted-foreground">
        {view === "sessions"
          ? 'Desmarque pra esconder as sessões com esse bônus — útil pra ver o rendimento "limpo", sem prey ou bounty.'
          : 'Desmarque pra tirar sessões com esse bônus da média das hunts — útil pra ver o rendimento "limpo", sem prey ou bounty.'}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {view === "sessions" ? (
          <>
            Sessão de qualquer duração entra: cada uma é projetada para 1h pela própria duração (sessão curta
            oscila mais).
            {visible.length > LIST_CAP &&
              ` Mostrando as ${LIST_CAP} mais recentes — busque pelo nome da hunt pra achar as outras.`}
          </>
        ) : (
          <>
            Só entram aqui hunts com pelo menos {fmtDuration(MIN_HUNT_DURATION_SEC)} somados de sessões — evita
            que uma sessão curta e isolada pareça um resultado absurdo quando projetada para 1h.
            {hiddenCount > 0 &&
              ` ${hiddenCount} hunt${hiddenCount > 1 ? "s" : ""} escondida${hiddenCount > 1 ? "s" : ""} por enquanto — continue registrando sessões nela${hiddenCount > 1 ? "s" : ""} ou use Ver por Sessão.`}
          </>
        )}
        {patch && prePatchCount > 0 && !includePrePatch &&
          ` ${prePatchCount} sessão(ões) de antes do ${patch.label} também ficam de fora por padrão.`}
      </p>

      {full && (
        <p className="mb-3 text-xs text-rubi-gold">
          Limite de {MAX_COMPARE} itens atingido — remova um para escolher outro.
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
      ) : sessionGroups ? (
        <div className="space-y-6">
          {sessionGroups.map((g) => (
            <div key={g.huntName}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Layers className="h-3.5 w-3.5 flex-none text-rubi-blue" />
                <span className="min-w-0 break-words">{g.huntName}</span>
                <span className="flex-none font-normal normal-case tracking-normal">
                  · {g.items.length} {g.items.length === 1 ? "sessão" : "sessões"}
                </span>
                <span className="h-px flex-1 bg-border/60" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.items.map(pickerCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.slice(0, LIST_CAP).map(pickerCard)}
        </div>
      )}

      <div
        ref={compareRef}
        className={"mt-8 scroll-mt-4 " + (selected.length >= 2 ? "pb-40 md:pb-24" : "")}
      >
        {selected.length < 2 ? (
          <div className="card-surface p-6 text-center text-sm text-muted-foreground">
            Selecione pelo menos 2 {view === "sessions" ? "sessões" : "hunts"} para gerar o comparativo.
          </div>
        ) : (
          <>
            <div ref={exportRef} className="bg-background p-1">
            <ExportPdfHeader title={`Comparativo: ${selected.map((h) => h.huntName).join(" vs ")}`} />
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-display text-xl font-bold">Comparativo ({selected.length})</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 flex-none text-rubi-blue" />
                {anyAverage ? "Ritmo médio projetado para 1 hora de caça" : "Cada sessão projetada para 1 hora de caça"}
              </span>
              <ExportPdfButton
                targetRef={exportRef}
                filename={`comparativo-${selected.map((h) => h.huntName).join("-vs-")}`}
                className="ml-auto"
                onExportingChange={setExporting}
              />
            </div>
            <CompareTable hunts={selected} detailed={exporting} />
            {hasMisc && (
              <>
                <button
                  type="button"
                  data-export-hide
                  onClick={() => setShowMisc((v) => !v)}
                  aria-pressed={showMisc}
                  className={
                    "mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all " +
                    (showMisc
                      ? "border-rubi-blue bg-rubi-blue text-primary-foreground shadow-glow-blue"
                      : "border-border bg-muted/40 text-foreground hover:border-rubi-blue/50 hover:bg-rubi-blue/10")
                  }
                >
                  <FlaskConical className="h-3.5 w-3.5 flex-none" />
                  {showMisc ? "Esconder Misc Data" : "Ver Misc Data (charm, imbuement, item upgrade)"}
                </button>
                {(showMisc || exporting) && (
                  <div className="mt-3">
                    <SessionMiscCompare sessions={miscSessions} cols={miscCols} />
                  </div>
                )}
              </>
            )}
            </div>
            {!visitor && (
              <SaveComparisonPanel
                hunts={selected}
                includeBounty={includeBounty}
                includePrey={includePrey}
              />
            )}
          </>

        )}
      </div>

      {selected.length >= 2 && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6">
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
    </SiteShell>
  );
}
