import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Compass,
  Minus,
  Plus,
  Search,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { GameIcon } from "@/components/GameIcon";
import { AdvisorCard, Segmented } from "@/components/advisor/advisor-ui";
import { AdvisorResults } from "@/components/advisor/AdvisorResults";
import { getCommunitySessions } from "@/lib/community.functions";
import {
  MODE_LABEL,
  communityIncoming,
  estimateIncoming,
  type AdvisorInput,
  type AdvisorMode,
  type HuntMonster,
} from "@/lib/hunt-advisor";
import {
  communityUsage,
  huntCatalog,
  huntMonsters,
  recommendedHunts,
  rowsOfHunt,
  vocationStats,
  type AdvisorRow,
} from "@/lib/hunt-advisor-community";
import { findMonster, searchMonsters } from "@/lib/monsters";
import { setupVocation, type SetupVocation } from "@/lib/session-setup";
import type { WeaponKind } from "@/lib/weapons";
import { useAppStore } from "@/lib/store";
import { currentLevel } from "@/lib/level";
import { useAuthState } from "@/lib/use-auth-state";
import { fmtGold, fmtNum } from "@/lib/format";

/**
 * HUNT ADVISOR (página pública, também pra visitante): escolhe a hunt (da comunidade, recomendada
 * pro seu level ou montada à mão), vocação, level e modo (defensivo/equilibrado/ofensivo) e recebe
 * o set recomendado, imbuements, charms, itens de emergência e o que a comunidade usa.
 * Lógica em src/lib/hunt-advisor.ts (+ hunt-advisor-community.ts); criaturas em src/data/monsters-data.ts.
 * Tudo fica na URL (?hunt=&voc=&lvl=&mode=&kind=&hands=&m=) — dá pra compartilhar o link.
 */

interface AdvisorSearch {
  hunt?: string;
  /** Hunt montada à mão: "Vexclaw:3,Hellflayer:2". */
  m?: string;
  voc?: SetupVocation;
  lvl?: number;
  mode?: AdvisorMode;
  kind?: WeaponKind;
  hands?: 1 | 2;
}

const VOCS: SetupVocation[] = ["knight", "paladin", "sorcerer", "druid", "monk"];
const VOC_LABEL: Record<SetupVocation, string> = {
  knight: "Knight",
  paladin: "Paladin",
  sorcerer: "Sorcerer",
  druid: "Druid",
  monk: "Monk",
};
const MODES: AdvisorMode[] = ["defensive", "balanced", "offensive"];

export const Route = createFileRoute("/tools/hunt-advisor")({
  validateSearch: (s: Record<string, unknown>): AdvisorSearch => {
    const str = (v: unknown, max = 200) =>
      typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;
    const lvl = Number(s.lvl);
    return {
      hunt: str(s.hunt, 120),
      m: str(s.m, 600),
      voc: VOCS.includes(s.voc as SetupVocation) ? (s.voc as SetupVocation) : undefined,
      lvl: Number.isFinite(lvl) && lvl > 0 && lvl < 5000 ? Math.round(lvl) : undefined,
      mode: MODES.includes(s.mode as AdvisorMode) ? (s.mode as AdvisorMode) : undefined,
      kind: ["s", "a", "c", "b", "x", "t"].includes(s.kind as string)
        ? (s.kind as WeaponKind)
        : undefined,
      hands:
        s.hands === 1 || s.hands === "1" ? 1 : s.hands === 2 || s.hands === "2" ? 2 : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Hunt Advisor — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Escolha a hunt e veja o set recomendado (defensivo, equilibrado ou ofensivo), imbuements, charms e o dano real que a comunidade toma no RubinOT.",
      },
      { property: "og:title", content: "Hunt Advisor do RubinOT" },
      {
        property: "og:description",
        content:
          "Set recomendado, fraquezas, imbuements e charms pra cada hunt — com dados reais da comunidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HuntAdvisorPage,
});

const parseCustom = (m: string | undefined): HuntMonster[] =>
  (m ?? "")
    .split(",")
    .map((p) => {
      const [name, c] = p.split(":");
      return { name: (name ?? "").trim(), count: Math.max(1, Math.min(99, Number(c) || 1)) };
    })
    .filter((x) => x.name && findMonster(x.name))
    .slice(0, 12);

const encodeCustom = (list: HuntMonster[]) =>
  list.length ? list.map((x) => `${x.name}:${x.count}`).join(",") : undefined;

function HuntAdvisorPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/tools/hunt-advisor" });
  const set = (patch: Partial<AdvisorSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  const auth = useAuthState();
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const active = auth === "in" ? (characters.find((c) => c.id === activeId) ?? null) : null;
  const charLevel = active ? currentLevel(levelSnapshots, active.id) : null;

  const vocation: SetupVocation = search.voc ?? setupVocation(active?.vocation) ?? "knight";
  const level = search.lvl ?? charLevel ?? null;
  const mode: AdvisorMode = search.mode ?? "balanced";
  const kindOk =
    search.kind &&
    ((vocation === "knight" && ["s", "a", "c"].includes(search.kind)) ||
      (vocation === "paladin" && ["b", "x", "t"].includes(search.kind)));
  const kind = kindOk ? search.kind! : null;
  const hands = vocation === "knight" ? (search.hands ?? null) : null;

  const fetchSessions = useServerFn(getCommunitySessions);
  const { data, isLoading } = useQuery({
    queryKey: ["community-sessions", "advisor"],
    queryFn: () => fetchSessions({ data: { limit: 400 } }),
    staleTime: 5 * 60_000,
  });
  const rows = useMemo(() => (data?.sessions ?? []) as AdvisorRow[], [data]);
  const catalog = useMemo(() => huntCatalog(rows), [rows]);
  const recommended = useMemo(
    () => recommendedHunts(rows, vocation, level),
    [rows, vocation, level],
  );

  const custom = useMemo(() => parseCustom(search.m), [search.m]);
  const usingCustom = !search.hunt && custom.length > 0;
  const huntRows = useMemo(
    () => (search.hunt ? rowsOfHunt(rows, search.hunt) : []),
    [rows, search.hunt],
  );

  const monsters = useMemo<HuntMonster[]>(
    () => (usingCustom ? custom : huntMonsters(huntRows)),
    [usingCustom, custom, huntRows],
  );
  const community = useMemo(() => communityIncoming(huntRows), [huntRows]);
  const incoming = useMemo(
    () => (community.sessions > 0 ? community.mix : estimateIncoming(monsters)),
    [community, monsters],
  );

  const input = useMemo<AdvisorInput>(
    () => ({ vocation, level, mode, monsters, incoming, weaponKind: kind, hands }),
    [vocation, level, mode, monsters, incoming, kind, hands],
  );
  const ready = monsters.length > 0;
  const huntName = search.hunt
    ? (catalog.find((h) => h.key === search.hunt!.trim().toLowerCase())?.name ?? search.hunt)
    : "Hunt personalizada";

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rubi-gold">
            Ferramenta
          </div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
            <Compass className="h-7 w-7 text-rubi-gold" /> Hunt Advisor
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Escolha a hunt e receba o set recomendado pra sua vocação e level — defensivo,
            equilibrado ou ofensivo —, os imbuements, os charms e o dano que você vai tomar, com
            dados reais do Input Analyser da comunidade.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* ------------------------------------------------ configuração */}
          <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <AdvisorCard icon={Users} title="Personagem">
              <div className="space-y-3">
                <Segmented
                  size="sm"
                  value={vocation}
                  onChange={(v) => set({ voc: v, kind: undefined, hands: undefined })}
                  options={VOCS.map((v) => ({ value: v, label: VOC_LABEL[v] }))}
                />
                <label className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Level</span>
                  <input
                    inputMode="numeric"
                    value={level ?? ""}
                    placeholder="qualquer"
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/\D/g, ""));
                      set({ lvl: n > 0 ? n : undefined });
                    }}
                    className="w-28 rounded-lg border border-border bg-background px-2.5 py-1.5 text-right font-display text-base font-semibold tabular-nums text-rubi-gold outline-none focus:border-rubi-gold"
                  />
                </label>
                {active && (search.voc || search.lvl) && (
                  <button
                    type="button"
                    onClick={() => set({ voc: undefined, lvl: undefined })}
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Usar {active.name} ({active.vocation}
                    {charLevel ? `, ${charLevel}` : ""})
                  </button>
                )}
                {vocation === "knight" && (
                  <div className="space-y-1.5">
                    <Segmented
                      size="sm"
                      value={kind ?? "any"}
                      onChange={(v) => set({ kind: v === "any" ? undefined : (v as WeaponKind) })}
                      options={[
                        { value: "any", label: "Qualquer" },
                        { value: "s", label: "Espada" },
                        { value: "a", label: "Machado" },
                        { value: "c", label: "Clava" },
                      ]}
                    />
                    <Segmented
                      size="sm"
                      value={hands ?? 0}
                      onChange={(v) => set({ hands: v === 0 ? undefined : (v as 1 | 2) })}
                      options={[
                        { value: 0, label: "1 ou 2 mãos" },
                        { value: 1, label: "1 mão + escudo" },
                        { value: 2, label: "2 mãos" },
                      ]}
                    />
                  </div>
                )}
                {vocation === "paladin" && (
                  <Segmented
                    size="sm"
                    value={kind ?? "any"}
                    onChange={(v) => set({ kind: v === "any" ? undefined : (v as WeaponKind) })}
                    options={[
                      { value: "any", label: "Qualquer" },
                      { value: "b", label: "Arco" },
                      { value: "x", label: "Besta" },
                      { value: "t", label: "Arremesso" },
                    ]}
                  />
                )}
              </div>
            </AdvisorCard>

            <AdvisorCard icon={Swords} title="Estilo do set">
              <Segmented
                value={mode}
                onChange={(v) => set({ mode: v })}
                options={MODES.map((m) => ({
                  value: m,
                  label: MODE_LABEL[m],
                  title:
                    m === "defensive"
                      ? "Prioriza resistência contra o dano da hunt"
                      : m === "offensive"
                        ? "Prioriza skill e dano"
                        : "Meio a meio",
                }))}
              />
            </AdvisorCard>

            <HuntPicker
              catalog={catalog}
              recommended={recommended}
              loading={isLoading}
              selected={search.hunt ?? null}
              custom={custom}
              vocationLabel={VOC_LABEL[vocation]}
              level={level}
              onPickHunt={(name) => set({ hunt: name, m: undefined })}
              onCustom={(list) => set({ hunt: undefined, m: encodeCustom(list) })}
            />
          </div>

          {/* ------------------------------------------------ resultado */}
          <div className="min-w-0">
            {ready ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold">{huntName}</h2>
                  <span className="rounded-full border border-rubi-gold/40 bg-rubi-gold/10 px-2 py-0.5 text-xs font-semibold text-rubi-gold">
                    {VOC_LABEL[vocation]}
                    {level ? ` ${level}` : ""} · {MODE_LABEL[mode]}
                  </span>
                </div>
                <AdvisorResults
                  key={`${search.hunt ?? search.m}|${vocation}|${level}|${mode}|${kind}|${hands}`}
                  input={input}
                  huntName={huntName}
                  incomingSource={
                    community.sessions > 0
                      ? { kind: "community", sessions: community.sessions }
                      : { kind: "wiki" }
                  }
                  stats={search.hunt ? vocationStats(huntRows, vocation) : null}
                  usage={search.hunt ? communityUsage(huntRows, vocation) : null}
                  characterId={active?.id ?? null}
                />
              </>
            ) : (
              <div className="card-surface flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                <Wand2 className="h-10 w-10 text-rubi-gold" />
                <h2 className="font-display text-xl font-bold">Escolha uma hunt</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Pegue uma das hunts recomendadas pro seu level, uma hunt da comunidade, ou monte a
                  sua com as criaturas — o set, os imbuements e os charms aparecem aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function HuntPicker({
  catalog,
  recommended,
  loading,
  selected,
  custom,
  vocationLabel,
  level,
  onPickHunt,
  onCustom,
}: {
  catalog: ReturnType<typeof huntCatalog>;
  recommended: ReturnType<typeof recommendedHunts>;
  loading: boolean;
  selected: string | null;
  custom: HuntMonster[];
  vocationLabel: string;
  level: number | null;
  onPickHunt: (name: string) => void;
  onCustom: (list: HuntMonster[]) => void;
}) {
  const [tab, setTab] = useState<"rec" | "all" | "custom">(
    custom.length && !selected ? "custom" : "rec",
  );
  const [q, setQ] = useState("");
  const [mq, setMq] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (
      n
        ? catalog.filter(
            (h) => h.key.includes(n) || h.topMonsters.some((m) => m.toLowerCase().includes(n)),
          )
        : catalog
    ).slice(0, 40);
  }, [catalog, q]);
  const found = useMemo(() => searchMonsters(mq), [mq]);
  const isSel = (name: string) => selected?.trim().toLowerCase() === name.trim().toLowerCase();

  return (
    <AdvisorCard icon={Trophy} title="Hunt">
      <Segmented
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: "rec", label: "Pra você" },
          { value: "all", label: "Comunidade" },
          { value: "custom", label: "Montar" },
        ]}
      />

      {tab === "rec" && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] text-muted-foreground">
            Hunts que {vocationLabel}s{level ? ` de level parecido (~${level})` : ""} fazem, por Raw
            XP/h.
          </p>
          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted/30" />
          ) : recommended.length ? (
            <ul className="space-y-1.5">
              {recommended.map((h) => (
                <li key={h.name}>
                  <button
                    type="button"
                    onClick={() => onPickHunt(h.name)}
                    className={
                      "w-full rounded-lg border px-2.5 py-2 text-left transition-colors " +
                      (isSel(h.name)
                        ? "border-rubi-gold bg-rubi-gold/10"
                        : "border-border/60 hover:border-rubi-gold/50")
                    }
                  >
                    <div className="truncate text-sm font-semibold">{h.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                      <span>Lvl ~{h.avgLevel}</span>
                      {h.rawXpH != null && (
                        <span className="text-rubi-blue">{fmtNum(Math.round(h.rawXpH))} XP/h</span>
                      )}
                      {h.profitH != null && (
                        <span className="text-rubi-gold">{fmtGold(Math.round(h.profitH))}/h</span>
                      )}
                      <span>{h.sessions} sess.</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ainda não tem sessão pública de {vocationLabel} nesse level. Veja a aba Comunidade ou
              monte a hunt.
            </p>
          )}
        </div>
      )}

      {tab === "all" && (
        <div className="mt-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar hunt ou criatura..."
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-sm outline-none focus:border-rubi-gold"
            />
          </label>
          <ul className="mt-2 max-h-[420px] space-y-1 overflow-y-auto pr-1">
            {loading && <li className="h-40 animate-pulse rounded-lg bg-muted/30" />}
            {filtered.map((h) => (
              <li key={h.key}>
                <button
                  type="button"
                  onClick={() => onPickHunt(h.name)}
                  className={
                    "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors " +
                    (isSel(h.name)
                      ? "border-rubi-gold bg-rubi-gold/10"
                      : "border-transparent hover:border-border")
                  }
                >
                  <span className="flex flex-none -space-x-2">
                    {h.topMonsters.map((m) => (
                      <GameIcon key={m} name={m} size={22} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{h.name}</span>
                  <span className="flex-none text-[10px] tabular-nums text-muted-foreground">
                    {h.sessions}
                  </span>
                </button>
              </li>
            ))}
            {!loading && !filtered.length && (
              <li className="text-xs text-muted-foreground">Nada encontrado.</li>
            )}
          </ul>
        </div>
      )}

      {tab === "custom" && (
        <div className="mt-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={mq}
              onChange={(e) => setMq(e.target.value)}
              placeholder="Adicionar criatura (ex.: Vexclaw)"
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-sm outline-none focus:border-rubi-gold"
            />
          </label>
          {found.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-background/80">
              {found.map((m) => (
                <li key={m.name}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!custom.some((c) => c.name === m.name))
                        onCustom([...custom, { name: m.name, count: 1 }].slice(0, 12));
                      setMq("");
                    }}
                    className="flex w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-accent"
                  >
                    <GameIcon name={m.name} size={22} />
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">{fmtNum(m.exp)} XP</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {custom.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {custom.map((c, i) => (
                <li
                  key={c.name}
                  className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1"
                >
                  <GameIcon name={c.name} size={22} />
                  <span className="min-w-0 flex-1 truncate text-xs">{c.name}</span>
                  <span className="inline-flex items-center">
                    <button
                      type="button"
                      aria-label="Menos"
                      onClick={() =>
                        onCustom(
                          custom.map((x, j) =>
                            j === i ? { ...x, count: Math.max(1, x.count - 1) } : x,
                          ),
                        )
                      }
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs tabular-nums">{c.count}</span>
                    <button
                      type="button"
                      aria-label="Mais"
                      onClick={() =>
                        onCustom(
                          custom.map((x, j) =>
                            j === i ? { ...x, count: Math.min(99, x.count + 1) } : x,
                          ),
                        )
                      }
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                  <button
                    type="button"
                    aria-label="Remover"
                    onClick={() => onCustom(custom.filter((_, j) => j !== i))}
                    className="rounded p-0.5 text-muted-foreground hover:text-rubi-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              <li className="pt-1 text-[10px] text-muted-foreground">
                O número é o peso (quantas aparecem) de cada criatura no respawn.
              </li>
            </ul>
          ) : (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="mt-px h-3.5 w-3.5 flex-none text-rubi-gold" />
              Monte o respawn com as criaturas da TibiaWiki — o dano é estimado pelos ataques delas.
            </p>
          )}
        </div>
      )}
    </AdvisorCard>
  );
}
