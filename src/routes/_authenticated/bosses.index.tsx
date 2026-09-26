import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Clock,
  Crown,
  Hourglass,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Skull,
  Swords,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GameIcon } from "@/components/GameIcon";
import { BossDialog } from "@/components/bosses/BossDialog";
import {
  BossHero,
  BossPortrait,
  BossTypeBadge,
  PartyBadge,
  SectionTitle,
} from "@/components/bosses/BossUi";
import {
  bestDropValue,
  fmtCooldown,
  syncBossCatalog,
  type Boss,
  type BossCatalog,
  type BossType,
  type PartyKind,
} from "@/lib/boss-catalog";
import {
  createRotation,
  fmtWait,
  lastKills,
  msUntilAvailable,
  runStats,
  updateRotation,
  type BossRotation,
  type BossRotationRun,
} from "@/lib/boss-rotations";
import { fmtDate, fmtGold, fmtNum } from "@/lib/format";
import { useNavPrefs } from "@/lib/nav-prefs";
import { useAppStore } from "@/lib/store";
import {
  bossKeys,
  useBossCatalog,
  useBossParty,
  useIsAdmin,
  useRotations,
  useRuns,
} from "@/lib/use-bosses";

export const Route = createFileRoute("/_authenticated/bosses/")({
  head: () => ({
    meta: [
      { title: "Rotação de Bosses — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Monte sua rotação de bosses, veja os melhores drops possíveis e acompanhe o lucro de cada rotação.",
      },
    ],
  }),
  component: BossesPage,
});

type Tab = "catalogo" | "rotacoes" | "cooldowns";
type Sort = "drop" | "hp" | "xp" | "name";
const PAGE = 48;

function BossesPage() {
  const { data: catalog, isLoading } = useBossCatalog();
  const { data: rotations = [] } = useRotations();
  const { data: runs = [] } = useRuns();
  const [tab, setTab] = useState<Tab | null>(null);
  const current: Tab = tab ?? (rotations.length > 0 ? "rotacoes" : "catalogo");

  return (
    <AppShell>
      <BossHero
        eyebrow="Covil dos Bosses"
        title={
          <>
            Rotação de <span className="text-rubi-danger">Bosses</span>
          </>
        }
        subtitle="Escolha os bosses, veja os drops que valem a luta e registre cada rotação com o Hunting Analyser — com o tempo você descobre qual rotação realmente dá lucro."
      />

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface/60 p-1">
        {(
          [
            ["catalogo", "Bosses", Skull],
            [
              "rotacoes",
              `Minhas rotações${rotations.length ? ` (${rotations.length})` : ""}`,
              Crown,
            ],
            ["cooldowns", "Cooldowns", Hourglass],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
              (current === id
                ? "bg-rubi-danger/15 text-foreground shadow-[inset_0_-2px_0_var(--rubi-danger)]"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <Icon className={"h-4 w-4 " + (current === id ? "text-rubi-danger" : "")} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : !catalog ? (
        <CatalogMissing />
      ) : current === "catalogo" ? (
        <CatalogView catalog={catalog} rotations={rotations} />
      ) : current === "rotacoes" ? (
        <RotationsView
          catalog={catalog}
          rotations={rotations}
          runs={runs}
          onBrowse={() => setTab("catalogo")}
        />
      ) : (
        <CooldownsView catalog={catalog} rotations={rotations} runs={runs} />
      )}

      {catalog && <AdminSync syncedAt={catalog.syncedAt} bossCount={catalog.bosses.length} />}
    </AppShell>
  );
}

// ---------------------------------------------------------------- sincronização

function useSync() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);
  const run = async () => {
    setProgress(0);
    try {
      const c = await syncBossCatalog(setProgress);
      qc.setQueryData(bossKeys.catalog, c);
      toast.success(`Catálogo atualizado: ${c.bosses.length} bosses`);
    } catch (e) {
      toast.error("Falha ao sincronizar com a TibiaWiki", { description: (e as Error).message });
    } finally {
      setProgress(null);
    }
  };
  return { progress, run };
}

function SyncButton({ label }: { label: string }) {
  const { progress, run } = useSync();
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={progress != null}
        className="inline-flex items-center gap-2 rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {progress != null ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {progress != null ? `Sincronizando… ${Math.round(progress * 100)}%` : label}
      </button>
      {progress != null && (
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-accent">
          <div
            className="h-full bg-rubi-danger transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

function CatalogMissing() {
  const { data: isAdmin } = useIsAdmin();
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
      <Skull className="h-10 w-10 text-rubi-danger" />
      <div className="font-display text-xl font-bold">O covil ainda está sendo preparado</div>
      <p className="max-w-md text-sm text-muted-foreground">
        {isAdmin
          ? "O catálogo de bosses ainda não foi baixado da TibiaWiki. Leva uns 20 segundos."
          : "Aguarde, em desenvolvimento — o catálogo de bosses ainda não foi carregado."}
      </p>
      {isAdmin && <SyncButton label="Baixar bosses da TibiaWiki" />}
    </div>
  );
}

function AdminSync({ syncedAt, bossCount }: { syncedAt: string; bossCount: number }) {
  const { data: isAdmin } = useIsAdmin();
  return (
    <div className="mt-10 flex flex-col items-center gap-2 text-center text-[11px] text-muted-foreground">
      <span>
        {bossCount} bosses · dados da TibiaWiki, atualizados em {fmtDate(syncedAt)}
      </span>
      {isAdmin && <SyncButton label="Atualizar catálogo (admin)" />}
    </div>
  );
}

// ---------------------------------------------------------------- catálogo

function CatalogView({ catalog, rotations }: { catalog: BossCatalog; rotations: BossRotation[] }) {
  const { partyOf, setParty } = useBossParty();
  const [q, setQ] = useState("");
  const [party, setPartyFilter] = useState<PartyKind | "all">("all");
  const [type, setType] = useState<BossType | "all">("all");
  const [sort, setSort] = useState<Sort>("drop");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Boss | null>(null);

  const bestDrop = useMemo(
    () => new Map(catalog.bosses.map((b) => [b.name, bestDropValue(b, catalog)])),
    [catalog],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = catalog.bosses.filter((b) => {
      if (
        term &&
        !b.name.toLowerCase().includes(term) &&
        !b.locations.some((l) => l.toLowerCase().includes(term))
      )
        return false;
      if (type !== "all" && b.type !== type) return false;
      if (party !== "all" && partyOf(b).party !== party) return false;
      return true;
    });
    const by: Record<Sort, (a: Boss, b: Boss) => number> = {
      drop: (a, b) => (bestDrop.get(b.name) ?? 0) - (bestDrop.get(a.name) ?? 0),
      hp: (a, b) => b.hp - a.hp,
      xp: (a, b) => b.xp - a.xp,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(by[sort]);
  }, [catalog, q, party, type, sort, bestDrop, partyOf]);

  const toggle = (name: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  const openParty = open ? partyOf(open) : null;

  return (
    <>
      <div className="card-surface mb-4 space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(PAGE);
              }}
              placeholder="Buscar boss ou local (ex: Oberon, Soul War)"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-rubi-danger"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
          >
            <option value="drop">Ordenar: melhor drop</option>
            <option value="hp">Ordenar: mais vida</option>
            <option value="xp">Ordenar: mais XP</option>
            <option value="name">Ordenar: nome</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chips
            value={party}
            onChange={(v) => {
              setPartyFilter(v);
              setLimit(PAGE);
            }}
            options={[
              ["all", "Todos", null],
              ["solo", "Solo", Swords],
              ["team", "Time", Users],
            ]}
          />
          <Chips
            value={type}
            onChange={(v) => {
              setType(v);
              setLimit(PAGE);
            }}
            options={[
              ["all", "Todo tipo", null],
              ["archfoe", "Archfoe", null],
              ["nemesis", "Nemesis", null],
              ["bane", "Bane", null],
            ]}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} bosses · Solo/Time com * é estimativa pela vida do boss — abra o boss
          pra corrigir. Toque no <Plus className="inline h-3 w-3" /> pra montar uma rotação.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.slice(0, limit).map((b) => (
          <BossCard
            key={b.name}
            boss={b}
            catalog={catalog}
            party={partyOf(b)}
            selected={selected.has(b.name)}
            onToggle={() => toggle(b.name)}
            onOpen={() => setOpen(b)}
          />
        ))}
      </div>
      {filtered.length > limit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Mostrar mais ({filtered.length - limit})
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <SelectionTray
          selected={selected}
          rotations={rotations}
          onClear={() => setSelected(new Set())}
        />
      )}

      {open && openParty && (
        <BossDialog
          boss={open}
          catalog={catalog}
          party={openParty.party}
          partyEstimated={openParty.estimated}
          onPartyChange={(p) => setParty(open.name, p)}
          onOpenChange={(o) => !o && setOpen(null)}
        />
      )}
    </>
  );
}

function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string, typeof Swords | null][];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
      {options.map(([v, label, Icon]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={
            "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
            (value === v
              ? "bg-rubi-danger/20 text-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </button>
      ))}
    </div>
  );
}

function BossCard({
  boss,
  catalog,
  party,
  selected,
  onToggle,
  onOpen,
}: {
  boss: Boss;
  catalog: BossCatalog;
  party: { party: PartyKind; estimated: boolean };
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const topDrops = useMemo(
    () =>
      [...boss.loot.v, ...boss.loot.r]
        .map((n) => ({ n, v: catalog.items.get(n) }))
        .sort((a, b) => (b.v?.marketMax ?? b.v?.npc ?? 0) - (a.v?.marketMax ?? a.v?.npc ?? 0))
        .slice(0, 4),
    [boss, catalog],
  );
  return (
    <div
      className={
        "group relative flex flex-col rounded-xl border bg-surface/80 p-3 transition-all " +
        (selected
          ? "border-rubi-danger shadow-[0_0_24px_-8px_var(--rubi-danger)]"
          : "border-border hover:border-rubi-danger/50")
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={selected ? `Tirar ${boss.name} da seleção` : `Selecionar ${boss.name}`}
        className={
          "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors " +
          (selected
            ? "border-rubi-danger bg-rubi-danger text-white"
            : "border-border bg-background/80 text-muted-foreground hover:border-rubi-danger hover:text-rubi-danger")
        }
      >
        {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div className="flex items-center gap-3 pr-8">
          <BossPortrait boss={boss} size={48} />
          <div className="min-w-0">
            <div className="line-clamp-2 font-display text-sm font-bold leading-tight group-hover:text-rubi-danger">
              {boss.name}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              <BossTypeBadge type={boss.type} />
              <PartyBadge party={party.party} estimated={party.estimated} />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[11px]">
          <Stat label="Vida" value={boss.hp ? fmtGold(boss.hp) : "—"} />
          <Stat label="XP" value={boss.xp ? fmtGold(boss.xp) : "—"} />
          <Stat label="Cooldown" value={fmtCooldown(boss.cooldownSec)} />
        </div>
        {topDrops.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Raros
            </span>
            {topDrops.map(({ n }) => (
              <span key={n} title={n} className="rounded-md bg-background/60 p-0.5">
                <GameIcon name={n} size={24} />
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/50 px-1 py-1">
      <div className="font-semibold">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function SelectionTray({
  selected,
  rotations,
  onClear,
}: {
  selected: Set<string>;
  rotations: BossRotation[];
  onClear: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const sidebarFixed = useNavPrefs((s) => s.expanded);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const r = await createRotation(name.trim() || `Rotação ${rotations.length + 1}`, [
        ...selected,
      ]);
      await qc.invalidateQueries({ queryKey: bossKeys.rotations });
      onClear();
      navigate({ to: "/bosses/$id", params: { id: r.id } });
    } catch (e) {
      toast.error("Não consegui criar a rotação", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const addTo = async () => {
    const r = rotations.find((x) => x.id === target);
    if (!r) return;
    setBusy(true);
    try {
      await updateRotation(r.id, { bosses: [...new Set([...r.bosses, ...selected])] });
      await qc.invalidateQueries({ queryKey: bossKeys.rotations });
      toast.success(`Adicionado em "${r.name}"`);
      onClear();
    } catch (e) {
      toast.error("Não consegui adicionar", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        "fixed inset-x-3 bottom-20 z-30 mx-auto max-w-3xl rounded-2xl border border-rubi-danger/60 bg-popover/95 p-3 shadow-[0_0_40px_-10px_var(--rubi-danger)] backdrop-blur-xl lg:bottom-6 " +
        // Não passa por baixo do menu lateral no desktop.
        (sidebarFixed ? "lg:left-[19rem]" : "lg:left-20")
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Crown className="h-4 w-4 text-rubi-danger" />
          {selected.size} {selected.size === 1 ? "boss" : "bosses"}
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar seleção"
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da nova rotação"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-danger"
          />
          <button
            type="button"
            disabled={busy}
            onClick={create}
            className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-rubi-danger px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>
        {rotations.length > 0 && (
          <div className="flex gap-2">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none"
            >
              <option value="">Adicionar em…</option>
              {rotations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!target || busy}
              onClick={addTo}
              className="flex-none rounded-lg border border-rubi-danger/50 px-3 py-2 text-sm font-medium text-rubi-danger hover:bg-rubi-danger/10 disabled:opacity-40"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- rotações

function RotationsView({
  catalog,
  rotations,
  runs,
  onBrowse,
}: {
  catalog: BossCatalog;
  rotations: BossRotation[];
  runs: BossRotationRun[];
  onBrowse: () => void;
}) {
  const byName = useMemo(() => new Map(catalog.bosses.map((b) => [b.name, b])), [catalog]);
  if (rotations.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
        <Crown className="h-10 w-10 text-rubi-danger" />
        <div className="font-display text-xl font-bold">Nenhuma rotação ainda</div>
        <p className="max-w-md text-sm text-muted-foreground">
          Escolha os bosses que você faz, crie a rotação e registre cada vez que fizer ela com o
          Hunting Analyser.
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex items-center gap-2 rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Skull className="h-4 w-4" /> Escolher bosses
        </button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rotations.map((r) => {
        const s = runStats(runs.filter((x) => x.rotationId === r.id));
        const last = runs.filter((x) => x.rotationId === r.id).at(-1);
        return (
          <Link
            key={r.id}
            to="/bosses/$id"
            params={{ id: r.id }}
            className="card-surface group block border-rubi-danger/20 p-4 transition-colors hover:border-rubi-danger/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-display text-lg font-bold group-hover:text-rubi-danger">
                  {r.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.bosses.length} bosses · {s.runs} {s.runs === 1 ? "execução" : "execuções"}
                  {last ? ` · última ${fmtDate(last.ranAt)}` : ""}
                </div>
              </div>
              <Crown className="h-5 w-5 flex-none text-rubi-danger/70" />
            </div>
            <div className="mt-3 flex -space-x-2">
              {r.bosses.slice(0, 7).map((n) => {
                const b = byName.get(n);
                return (
                  <div key={n} title={n} className="rounded-xl bg-background">
                    <BossPortrait boss={b ?? { name: n, type: "" }} size={28} />
                  </div>
                );
              })}
              {r.bosses.length > 7 && (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-xs text-muted-foreground">
                  +{r.bosses.length - 7}
                </span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-background/50 p-2">
                <div
                  className={
                    "font-bold " + (s.avgBalance >= 0 ? "text-rubi-success" : "text-rubi-danger")
                  }
                >
                  {s.runs ? fmtGold(s.avgBalance) : "—"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Lucro médio
                </div>
              </div>
              <div className="rounded-lg bg-background/50 p-2">
                <div className="font-bold text-rubi-gold">
                  {s.runs ? `${fmtGold(s.balancePerHour)}/h` : "—"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Lucro por hora
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- cooldowns

function CooldownsView({
  catalog,
  rotations,
  runs,
}: {
  catalog: BossCatalog;
  rotations: BossRotation[];
  runs: BossRotationRun[];
}) {
  const activeId = useAppStore((s) => s.activeCharacterId);
  const active = useAppStore((s) => s.characters.find((c) => c.id === s.activeCharacterId) ?? null);
  const kills = useMemo(() => lastKills(runs, activeId), [runs, activeId]);
  const rows = useMemo(() => {
    const byName = new Map(catalog.bosses.map((b) => [b.name, b]));
    const names = [...new Set(rotations.flatMap((r) => r.bosses))];
    return names
      .map((n) => {
        const boss = byName.get(n) ?? ({ name: n, type: "", cooldownSec: 0 } as Boss);
        const last = kills.get(n);
        return { boss, last, wait: msUntilAvailable(last, boss.cooldownSec) };
      })
      .sort(
        (a, b) =>
          (a.wait ?? Infinity) - (b.wait ?? Infinity) || a.boss.name.localeCompare(b.boss.name),
      );
  }, [catalog, rotations, kills]);

  if (rows.length === 0) {
    return (
      <div className="card-surface p-8 text-center text-sm text-muted-foreground">
        Os cooldowns aparecem aqui depois que você criar uma rotação e registrar as execuções.
      </div>
    );
  }

  return (
    <div>
      <SectionTitle icon={Clock}>
        Quando cada boss volta {active ? `· ${active.name}` : ""}
      </SectionTitle>
      <div className="card-surface divide-y divide-border/50">
        {rows.map(({ boss, last, wait }) => (
          <div key={boss.name} className="flex items-center gap-3 p-3">
            <BossPortrait boss={boss} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{boss.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {last ? `Última kill ${fmtDate(last)}` : "Sem kill registrada"}
                {boss.cooldownSec ? ` · cooldown ${fmtCooldown(boss.cooldownSec)}` : ""}
              </div>
              {wait != null && wait > 0 && boss.cooldownSec > 0 && (
                <div className="mt-1 h-1 w-full max-w-xs overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full bg-rubi-danger"
                    style={{ width: `${100 - (wait / (boss.cooldownSec * 1000)) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex-none text-right text-sm font-semibold">
              {wait === 0 ? (
                <span className="text-rubi-success">Disponível</span>
              ) : wait == null ? (
                <span className="text-xs font-normal text-muted-foreground">
                  cooldown não informado
                </span>
              ) : (
                <span className="text-rubi-gold">em {fmtWait(wait)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Baseado nas rotações registradas do personagem ativo e no cooldown da TibiaWiki (
        {fmtNum(catalog.bosses.filter((b) => b.cooldownSec > 0).length)} bosses têm esse dado). O
        RubinOT pode usar tempos diferentes.
      </p>
    </div>
  );
}
