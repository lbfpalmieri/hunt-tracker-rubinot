import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clock,
  Coins,
  Crown,
  Gem,
  Pencil,
  Plus,
  Scale,
  ScrollText,
  Search,
  Swords,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GameIcon } from "@/components/GameIcon";
import { StatCard } from "@/components/StatCard";
import { BossDialog } from "@/components/bosses/BossDialog";
import {
  BossHero,
  BossPortrait,
  BossTypeBadge,
  PartyBadge,
  SectionTitle,
} from "@/components/bosses/BossUi";
import { LootHighlightList } from "@/components/bosses/LootHighlightList";
import { RegisterRunDialog } from "@/components/bosses/RegisterRunDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lootHighlights, type Boss, type BossCatalog } from "@/lib/boss-catalog";
import {
  deleteRotation,
  deleteRun,
  fmtWait,
  lastKills,
  msUntilAvailable,
  runStats,
  updateRotation,
  type BossRotation,
} from "@/lib/boss-rotations";
import { damageElementInfo } from "@/lib/damage-elements";
import { fmtDate, fmtDuration, fmtGold } from "@/lib/format";
import { rankElementsAgainstHunt, type ElementMods } from "@/lib/monster-weakness";
import { useAppStore } from "@/lib/store";
import { bossKeys, useBossCatalog, useBossParty, useRotations, useRuns } from "@/lib/use-bosses";

const BossRunsChart = lazy(() => import("@/components/charts/BossRunsChart"));

export const Route = createFileRoute("/_authenticated/bosses/$id")({
  head: () => ({ meta: [{ title: "Rotação de Bosses — RubinOT Hunt Tracker" }] }),
  component: RotationPage,
});

function RotationPage() {
  const { id } = Route.useParams();
  const { data: catalog, isLoading: loadingCatalog } = useBossCatalog();
  const { data: rotations, isLoading: loadingRotations } = useRotations();
  const rotation = rotations?.find((r) => r.id === id) ?? null;

  if (loadingCatalog || loadingRotations) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-2xl bg-muted/30" />
      </AppShell>
    );
  }
  if (!rotation || !catalog) {
    return (
      <AppShell>
        <div className="card-surface p-10 text-center">
          <p className="text-muted-foreground">Rotação não encontrada.</p>
          <Link
            to="/bosses"
            className="mt-3 inline-block text-sm font-medium text-rubi-danger hover:underline"
          >
            Voltar pro Covil
          </Link>
        </div>
      </AppShell>
    );
  }
  return <RotationDetail rotation={rotation} catalog={catalog} />;
}

function RotationDetail({ rotation, catalog }: { rotation: BossRotation; catalog: BossCatalog }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: allRuns = [] } = useRuns();
  const { partyOf, setParty } = useBossParty();
  const activeId = useAppStore((s) => s.activeCharacterId);
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(rotation.name);
  const [openBoss, setOpenBoss] = useState<Boss | null>(null);

  const byName = useMemo(() => new Map(catalog.bosses.map((b) => [b.name, b])), [catalog]);
  const bosses = useMemo(
    () => rotation.bosses.map((n) => byName.get(n)).filter((b): b is Boss => !!b),
    [rotation, byName],
  );
  const runs = useMemo(
    () => allRuns.filter((r) => r.rotationId === rotation.id),
    [allRuns, rotation.id],
  );
  const stats = useMemo(() => runStats(runs), [runs]);
  const loot = useMemo(() => lootHighlights(bosses, catalog), [bosses, catalog]);
  const kills = useMemo(() => lastKills(allRuns, activeId), [allRuns, activeId]);

  const ranking = useMemo(() => {
    const mods: Record<string, ElementMods> = Object.fromEntries(
      bosses.map((b) => [b.name, b.mods]),
    );
    return rankElementsAgainstHunt(
      bosses.map((b) => ({ name: b.name, count: 1 })),
      mods,
    );
  }, [bosses]);

  // Referência pro "vale a pena?": lucro/h médio das hunts normais do personagem ativo.
  const huntPerHour = useMemo(() => {
    const mine = sessions.filter((s) => !activeId || s.characterId === activeId);
    const sec = mine.reduce((a, s) => a + (s.hunting.durationSec || 0), 0);
    if (sec < 1800) return null;
    return mine.reduce((a, s) => a + (s.hunting.balance || 0), 0) / (sec / 3600);
  }, [sessions, activeId]);

  const chartData = runs.map((r) => ({
    label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(
      new Date(r.ranAt),
    ),
    balance: r.balance,
    perHour: r.durationSec > 0 ? Math.round(r.balance / (r.durationSec / 3600)) : 0,
  }));

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: bossKeys.runs });
    void qc.invalidateQueries({ queryKey: bossKeys.rotations });
  };

  const rename = async () => {
    const name = newName.trim();
    if (!name || name === rotation.name) return setRenaming(false);
    try {
      await updateRotation(rotation.id, { name });
      refresh();
      setRenaming(false);
    } catch (e) {
      toast.error("Não consegui renomear", { description: (e as Error).message });
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Excluir a rotação "${rotation.name}" e as ${runs.length} execuções registradas?`,
      )
    )
      return;
    try {
      await deleteRotation(rotation.id);
      refresh();
      navigate({ to: "/bosses" });
    } catch (e) {
      toast.error("Não consegui excluir", { description: (e as Error).message });
    }
  };

  const removeRun = async (runId: string) => {
    if (!window.confirm("Apagar essa execução?")) return;
    try {
      await deleteRun(runId);
      refresh();
    } catch (e) {
      toast.error("Não consegui apagar", { description: (e as Error).message });
    }
  };

  const charName = (cid: string | null) => characters.find((c) => c.id === cid)?.name ?? "—";
  const openParty = openBoss ? partyOf(openBoss) : null;
  const verdict =
    stats.runs === 0 || huntPerHour == null
      ? null
      : stats.balancePerHour >= huntPerHour
        ? { good: true, diff: stats.balancePerHour - huntPerHour }
        : { good: false, diff: huntPerHour - stats.balancePerHour };

  return (
    <AppShell>
      <Link
        to="/bosses"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Covil dos Bosses
      </Link>

      <BossHero
        eyebrow="Rotação"
        title={
          renaming ? (
            <span className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && rename()}
                className="min-w-0 flex-1 rounded-lg border border-rubi-danger/60 bg-background px-3 py-1 text-2xl outline-none"
              />
              <button
                type="button"
                onClick={rename}
                aria-label="Salvar nome"
                className="rounded-lg bg-rubi-danger p-2 text-white"
              >
                <Check className="h-5 w-5" />
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              {rotation.name}
              <button
                type="button"
                onClick={() => setRenaming(true)}
                aria-label="Renomear"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </span>
          )
        }
        subtitle={`${bosses.length} bosses · ${stats.runs} ${stats.runs === 1 ? "execução registrada" : "execuções registradas"}`}
        actions={
          <>
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_var(--rubi-danger)] hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Registrar rotação
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" /> Bosses
            </button>
            <button
              type="button"
              onClick={remove}
              aria-label="Excluir rotação"
              className="rounded-lg border border-border bg-surface p-2 text-muted-foreground hover:text-rubi-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        }
      />

      {/* Bosses da rotação */}
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {bosses.map((b) => {
          const p = partyOf(b);
          const wait = msUntilAvailable(kills.get(b.name), b.cooldownSec);
          return (
            <button
              key={b.name}
              type="button"
              onClick={() => setOpenBoss(b)}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface/80 p-2.5 text-left transition-colors hover:border-rubi-danger/50"
            >
              <BossPortrait boss={b} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{b.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  <BossTypeBadge type={b.type} />
                  <PartyBadge party={p.party} estimated={p.estimated} />
                </div>
              </div>
              <span className="flex-none text-[11px] font-semibold">
                {wait === 0 ? (
                  <span className="text-rubi-success">Disponível</span>
                ) : wait == null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <span className="text-rubi-gold">em {fmtWait(wait)}</span>
                )}
              </span>
            </button>
          );
        })}
        {bosses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum boss nessa rotação. Use "Bosses" pra adicionar.
          </p>
        )}
      </div>

      {/* Números */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Lucro médio por rotação"
          value={stats.runs ? fmtGold(stats.avgBalance) : "—"}
          icon={Coins}
          accent={stats.avgBalance >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Lucro por hora"
          value={stats.runs ? fmtGold(stats.balancePerHour) : "—"}
          icon={TrendingUp}
          accent="gold"
        />
        <StatCard
          label="Tempo médio"
          value={stats.runs ? fmtDuration(stats.avgDurationSec) : "—"}
          icon={Clock}
          accent="blue"
        />
        <StatCard
          label="Lucro total"
          value={stats.runs ? fmtGold(stats.totalBalance) : "—"}
          hint={stats.best ? `Melhor: ${fmtGold(stats.best.balance)}` : undefined}
          icon={Trophy}
          accent="muted"
        />
      </div>

      {verdict && (
        <div
          className={
            "mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm " +
            (verdict.good
              ? "border-rubi-success/40 bg-rubi-success/10"
              : "border-rubi-danger/40 bg-rubi-danger/10")
          }
        >
          <Scale
            className={
              "mt-0.5 h-5 w-5 flex-none " +
              (verdict.good ? "text-rubi-success" : "text-rubi-danger")
            }
          />
          <div>
            <strong className="text-foreground">
              {verdict.good
                ? "Essa rotação vale a pena."
                : "Suas hunts estão rendendo mais que essa rotação."}
            </strong>{" "}
            A rotação dá {fmtGold(stats.balancePerHour)}/h e suas hunts ({charName(activeId)}) dão{" "}
            {fmtGold(huntPerHour ?? 0)}/h — {verdict.good ? "+" : "−"}
            {fmtGold(verdict.diff)}/h.{" "}
            {stats.runs < 3 && "Com poucas execuções a média ainda oscila bastante."}
          </div>
        </div>
      )}

      {runs.length > 0 && (
        <div className="card-surface mb-6 p-4">
          <SectionTitle icon={TrendingUp}>Lucro por execução</SectionTitle>
          <div className="h-64">
            <Suspense
              fallback={<div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />}
            >
              <BossRunsChart data={chartData} huntPerHour={huntPerHour} />
            </Suspense>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card-surface border-rubi-danger/25 p-4">
          <SectionTitle icon={Gem}>Melhores drops possíveis</SectionTitle>
          <p className="-mt-2 mb-2 text-[11px] text-muted-foreground">
            Raros e muito raros, do mais valioso pro menos.
          </p>
          <LootHighlightList items={loot.rare} empty="Nenhum drop raro nesses bosses." />
        </div>
        <div className="card-surface p-4">
          <SectionTitle icon={Coins}>Loot valioso que não é raro</SectionTitle>
          <p className="-mt-2 mb-2 text-[11px] text-muted-foreground">
            Comum a semi-raro, valendo 10k ou mais.
          </p>
          <LootHighlightList items={loot.valuable} empty="Nada acima de 10k fora dos raros." />
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="card-surface mb-6 p-4">
          <SectionTitle icon={Swords}>Elemento pra levar</SectionTitle>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {ranking.map((r, i) => {
              const info = damageElementInfo(r.element);
              return (
                <span
                  key={r.element}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 " +
                    (i === 0
                      ? "bg-rubi-success/15 font-semibold text-rubi-success"
                      : "bg-accent/70")
                  }
                >
                  {info.emoji} {info.label} · {Math.round(r.avgMod)}%
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Média de dano que os bosses da rotação tomam de cada elemento (100% = normal).
          </p>
        </div>
      )}

      <div className="card-surface p-4">
        <SectionTitle icon={ScrollText}>Execuções</SectionTitle>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Faça a rotação com o Hunting Analyser aberto e clique em "Registrar rotação" no fim.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {[...runs].reverse().map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold">{fmtDate(r.ranAt)}</span>
                    <span className="text-xs text-muted-foreground">
                      {charName(r.characterId)} · {fmtDuration(r.durationSec)} ·{" "}
                      {r.bossesKilled.length}/{bosses.length} bosses
                      {r.partySize > 1 ? ` · ${r.partySize} jogadores` : ""}
                    </span>
                  </div>
                  {r.drops.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {r.drops.map((d) => (
                        <span
                          key={d.name}
                          className="inline-flex items-center gap-1 rounded-md border border-rubi-gold/30 bg-rubi-gold/10 px-1.5 py-0.5 text-[11px]"
                        >
                          <GameIcon name={d.name} size={16} /> {d.count}x {d.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <div className="text-right">
                    <div
                      className={
                        "font-bold " + (r.balance >= 0 ? "text-rubi-success" : "text-rubi-danger")
                      }
                    >
                      {fmtGold(r.balance)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {r.durationSec > 0 ? `${fmtGold(r.balance / (r.durationSec / 3600))}/h` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRun(r.id)}
                    aria-label="Apagar execução"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RegisterRunDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        rotationId={rotation.id}
        bosses={bosses}
        catalog={catalog}
        characterId={activeId}
        onSaved={refresh}
      />
      <EditBossesDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        rotation={rotation}
        catalog={catalog}
        onSaved={refresh}
      />
      {openBoss && openParty && (
        <BossDialog
          boss={openBoss}
          catalog={catalog}
          party={openParty.party}
          partyEstimated={openParty.estimated}
          onPartyChange={(p) => setParty(openBoss.name, p)}
          onOpenChange={(o) => !o && setOpenBoss(null)}
        />
      )}
    </AppShell>
  );
}

const LIST_LIMIT = 80;

function EditBossesDialog({
  open,
  onOpenChange,
  rotation,
  catalog,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rotation: BossRotation;
  catalog: BossCatalog;
  onSaved: () => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set(rotation.bosses));
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  // Toda vez que abre, parte do que está salvo (cancelar descarta o que foi marcado).
  useEffect(() => {
    if (!open) return;
    setPicked(new Set(rotation.bosses));
    setQ("");
  }, [open, rotation.bosses]);

  // "Já na rotação" primeiro — pela versão salva, pra lista não pular de lugar ao marcar.
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    const saved = new Set(rotation.bosses);
    return catalog.bosses
      .filter((b) => !term || b.name.toLowerCase().includes(term))
      .sort(
        (a, b) =>
          Number(saved.has(b.name)) - Number(saved.has(a.name)) || a.name.localeCompare(b.name),
      );
  }, [catalog, q, rotation.bosses]);
  const list = matches.slice(0, LIST_LIMIT);

  const save = async () => {
    setSaving(true);
    try {
      await updateRotation(rotation.id, { bosses: [...picked] });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error("Não consegui salvar", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-rubi-danger/40 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Crown className="h-5 w-5 text-rubi-danger" /> Bosses da rotação
          </DialogTitle>
          <DialogDescription>{picked.size} selecionados</DialogDescription>
        </DialogHeader>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar boss"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-rubi-danger"
          />
        </label>
        <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
          {list.map((b) => {
            const on = picked.has(b.name);
            return (
              <li key={b.name}>
                <button
                  type="button"
                  onClick={() =>
                    setPicked((s) => {
                      const n = new Set(s);
                      if (on) n.delete(b.name);
                      else n.add(b.name);
                      return n;
                    })
                  }
                  className={
                    "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors " +
                    (on ? "bg-rubi-danger/15" : "hover:bg-accent")
                  }
                >
                  <GameIcon name={b.name} size={28} />
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  {on && <Check className="h-4 w-4 flex-none text-rubi-danger" />}
                </button>
              </li>
            );
          })}
        </ul>
        {matches.length > LIST_LIMIT && (
          <p className="text-center text-[11px] text-muted-foreground">
            Mostrando {LIST_LIMIT} de {matches.length} — busque pelo nome pra achar os outros.
          </p>
        )}
        {matches.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Nenhum boss com esse nome.</p>
        )}
        <DialogFooter>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
