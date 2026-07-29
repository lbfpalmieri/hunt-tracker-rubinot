import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/lib/store";
import type { ImbuementTier } from "@/lib/store";
import {
  IMB_TIER_COST,
  IMB_TIER_LABEL,
  IMB_DURATION_HOURS,
  aggregateImbuements,
  type ImbuementBreakdown,
} from "@/lib/imbuements";
import { fmtGold, fmtDate, fmtHoursMin } from "@/lib/format";
import { Sparkles, Plus, Trash2, Coins, Timer, ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IMBUEMENT_TYPES,
  CATEGORY_LABEL,
  getImbuementType,
  type ImbuementCategory,
} from "@/lib/imbuement-types";
import { GEAR_SLOTS, MAX_IMBUEMENTS_PER_ITEM, type GearSlotId } from "@/lib/gear-slots";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/imbuements")({
  head: () => ({
    meta: [
      { title: "Imbuements — RubinOT Hunt Tracker" },
      { name: "description", content: "Controle os gastos com imbuements e veja quanto rende cada hora de hunt." },
      { property: "og:title", content: "Imbuements — RubinOT Hunt Tracker" },
      { property: "og:description", content: "Diluição do custo de imbuements no lucro das hunts." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ImbuementsPage,
});

const TIERS: ImbuementTier[] = ["basic", "intricate", "powerful"];

function parseHoursInput(value: string): number {
  const cleaned = value.trim().replace(",", ".");
  if (cleaned.includes(":")) {
    const [h, m] = cleaned.split(":");
    const hours = Math.max(0, Number(h || "0") || 0);
    const minutes = Math.max(0, Math.min(59, Number(m || "0") || 0));
    return hours + minutes / 60;
  }
  return Math.max(0, Number(cleaned) || 0);
}

function ImbuementsPage() {
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const sessions = useAppStore((s) => s.sessions);
  const imbuements = useAppStore((s) => s.imbuements);
  const addImbuement = useAppStore((s) => s.addImbuement);
  const renewImbuement = useAppStore((s) => s.renewImbuement);
  const removeImbuement = useAppStore((s) => s.removeImbuement);

  const active = characters.find((c) => c.id === activeId) ?? null;

  const [addSlot, setAddSlot] = useState<GearSlotId | null>(null);
  const [tier, setTier] = useState<ImbuementTier>("powerful");
  const [gold, setGold] = useState<string>("");
  const [hoursRemaining, setHoursRemaining] = useState<string>("20");

  const [busy, setBusy] = useState(false);
  const [renewTarget, setRenewTarget] = useState<{ id: string; currentGold: number; label: string } | null>(null);
  const [renewGold, setRenewGold] = useState<string>("");
  const [renewBusy, setRenewBusy] = useState(false);

  const [typeId, setTypeId] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectedType = getImbuementType(typeId);

  const grouped = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const filtered = q
      ? IMBUEMENT_TYPES.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q),
        )
      : IMBUEMENT_TYPES;
    const byCat: Record<ImbuementCategory, typeof IMBUEMENT_TYPES> = {
      skill: [],
      elemental_damage: [],
      elemental_protection: [],
      support: [],
    };
    for (const t of filtered) byCat[t.category].push(t);
    return byCat;
  }, [pickerQuery]);

  const agg = useMemo(() => {
    if (!active) return null;
    return aggregateImbuements(imbuements, sessions, active.id);
  }, [imbuements, sessions, active]);

  const bySlot = useMemo(() => {
    const map: Record<string, ImbuementBreakdown[]> = {};
    for (const r of agg?.rows ?? []) {
      const key = r.imb.gearSlot ?? "unassigned";
      (map[key] ??= []).push(r);
    }
    return map;
  }, [agg]);

  if (!active) {
    return (
      <AppShell>
        <EmptyState
          icon={Sparkles}
          title="Selecione um personagem"
          description="Vincule seus imbuements a um personagem para calcular o custo por hora."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  const goldNum = Number((gold || "0").replace(/[.,\s]/g, "")) || 0;
  const totalPreview = IMB_TIER_COST[tier] + goldNum;
  const hoursNum = Math.max(0, Math.min(IMB_DURATION_HOURS, parseHoursInput(hoursRemaining)));
  const remainingCostPreview = (totalPreview / IMB_DURATION_HOURS) * hoursNum;

  const openAdd = (slot: GearSlotId) => {
    setAddSlot(slot);
    setTier("powerful");
    setGold("");
    setTypeId("");
    setPickerQuery("");
    setHoursRemaining("20");
  };

  const closeAdd = () => {
    if (busy) return;
    setAddSlot(null);
    setPickerOpen(false);
  };

  const handleAdd = async () => {
    if (!typeId || !addSlot) return;
    setBusy(true);
    try {
      await addImbuement({
        characterId: active.id,
        tier,
        goldTokenCost: goldNum,
        label: typeId,
        gearSlot: addSlot,
        hoursRemaining: hoursNum,
      });
      setAddSlot(null);
      setGold("");
      setTypeId("");
      setPickerQuery("");
      setHoursRemaining("20");
    } catch (e) {
      toast.error("Falha ao adicionar", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const openRenew = (imbId: string, currentGold: number, label: string) => {
    setRenewTarget({ id: imbId, currentGold, label });
    setRenewGold(String(currentGold));
  };

  const closeRenew = () => {
    if (renewBusy) return;
    setRenewTarget(null);
    setRenewGold("");
  };

  const confirmRenew = async () => {
    if (!renewTarget) return;
    const parsed = Math.max(0, Number((renewGold || "0").replace(/[.,\s]/g, "")) || 0);
    setRenewBusy(true);
    try {
      await renewImbuement(renewTarget.id, parsed);
      toast.success("Imbuement renovado", { description: "Recarregado para 20h de hunt." });
      setRenewTarget(null);
      setRenewGold("");
    } catch (e) {
      toast.error("Falha ao renovar", { description: (e as Error).message });
    } finally {
      setRenewBusy(false);
    }
  };

  const renderRow = (r: ImbuementBreakdown) => {
    const t = getImbuementType(r.imb.label);
    const budget = Math.max(0.0001, Math.min(IMB_DURATION_HOURS, r.imb.hoursRemaining));
    const pct = Math.min(100, (r.hoursConsumed / budget) * 100);
    const low = r.active && r.hoursRemaining <= 1;
    return (
      <div
        key={r.imb.id}
        className={
          "rounded-lg border p-2.5 " +
          (!r.active
            ? "border-border/60 bg-surface/30 opacity-70"
            : low
              ? "border-rubi-danger/50 bg-rubi-danger/5"
              : "border-border bg-surface/60")
        }
      >
        <div className="flex items-start gap-2.5">
          {t ? <img src={t.icon} alt="" loading="lazy" className="mt-0.5 h-7 w-7 shrink-0" /> : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-rubi-gold">
                {t ? t.name : r.imb.label || "—"}
              </span>
              <span
                className={
                  "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider " +
                  (r.imb.tier === "powerful"
                    ? "bg-rubi-gold/20 text-rubi-gold"
                    : r.imb.tier === "intricate"
                      ? "bg-rubi-blue-soft text-rubi-blue"
                      : "bg-accent text-muted-foreground")
                }
              >
                {IMB_TIER_LABEL[r.imb.tier]}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {fmtDate(r.imb.createdAt)} · {fmtGold(r.costPerHour)}/h · gasto {fmtGold(r.amountSpent)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() =>
                openRenew(
                  r.imb.id,
                  r.imb.goldTokenCost,
                  `${IMB_TIER_LABEL[r.imb.tier]} · ${t ? t.name : r.imb.label || "Imbuement"}`,
                )
              }
              className="rounded-md border border-rubi-gold/40 bg-rubi-gold/10 p-1.5 text-rubi-gold hover:bg-rubi-gold/20"
              title="Renovar imbuement (recarrega para 20h)"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => removeImbuement(r.imb.id)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" />
              restam {fmtHoursMin(r.hoursRemaining)}
            </span>
            <span>{fmtHoursMin(r.hoursConsumed)} / {fmtHoursMin(budget)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
            <div
              className={
                "h-full " +
                (!r.active ? "bg-muted-foreground/50" : low ? "bg-rubi-danger" : "bg-rubi-blue")
              }
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const unassigned = bySlot["unassigned"] ?? [];

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
            RubinOT · Imbuements
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Imbuements por <span className="text-gradient-brand">item</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada imbuement dura {IMB_DURATION_HOURS}h de hunt · o custo é diluído nas sessões de {active.name}.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Voltar ao dashboard
        </Link>
      </div>

      <div className="card-surface mb-6 flex flex-wrap items-center gap-x-8 gap-y-2 p-4 text-sm">
        <span className="inline-flex items-center gap-2 text-rubi-gold">
          <Coins className="h-4 w-4" />
          <strong>{fmtGold(agg?.activeCostPerHour ?? 0)}/h</strong>
          <span className="text-xs text-muted-foreground">ativos</span>
        </span>
        <span className="text-muted-foreground">
          Total gasto: <strong className="text-foreground">{fmtGold(agg?.totalSpent ?? 0)}</strong>
        </span>
        <span className="text-muted-foreground">
          Registros: <strong className="text-foreground">{agg?.rows.length ?? 0}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GEAR_SLOTS.map((slot) => {
          const rows = bySlot[slot.id] ?? [];
          const activeRows = rows.filter((r) => r.active);
          const expired = rows.filter((r) => !r.active);
          const freeSlots = Math.max(0, MAX_IMBUEMENTS_PER_ITEM - activeRows.length);
          return (
            <div key={slot.id} className="card-surface flex flex-col p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg border border-border bg-background/60 p-1.5">
                  <img src={slot.icon} alt={slot.name} loading="lazy" width={512} height={512} className="h-11 w-11 object-contain [image-rendering:pixelated]" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold text-rubi-gold">{slot.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{slot.hint}</div>
                </div>
                <span className="ml-auto shrink-0 rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  {activeRows.length}/{MAX_IMBUEMENTS_PER_ITEM}
                </span>
              </div>

              <div className="space-y-2">
                {activeRows.map(renderRow)}

                {Array.from({ length: freeSlots }).map((_, i) => (
                  <button
                    key={`empty-${i}`}
                    type="button"
                    onClick={() => openAdd(slot.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-rubi-blue hover:text-rubi-blue"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Slot livre
                  </button>
                ))}

                {expired.length > 0 && (
                  <div className="pt-1">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Expirados ({expired.length})
                    </div>
                    <div className="space-y-2">{expired.map(renderRow)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <div className="card-surface mt-6 p-4">
          <div className="mb-1 text-base font-semibold">Sem item vinculado</div>
          <p className="mb-3 text-xs text-muted-foreground">
            Imbuements antigos registrados antes dos slots de item. Remova e recadastre no item correto quando quiser.
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unassigned.map(renderRow)}
          </div>
        </div>
      )}

      <Dialog open={!!addSlot} onOpenChange={(o) => { if (!o) closeAdd(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Adicionar imbuement · {GEAR_SLOTS.find((s) => s.id === addSlot)?.name ?? ""}
            </DialogTitle>
            <DialogDescription>
              O custo é diluído nas próximas horas de hunt de {active.name}.
            </DialogDescription>
          </DialogHeader>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tier
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors " +
                    (t === tier
                      ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground")
                  }
                >
                  <div>{IMB_TIER_LABEL[t]}</div>
                  <div className="mt-0.5 text-[10px] opacity-70">{fmtGold(IMB_TIER_COST[t])}</div>
                </button>
              ))}
            </div>
          </label>

          <div ref={pickerRef}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Imbuement
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-rubi-blue"
            >
              {selectedType ? (
                <span className="flex items-center gap-2">
                  <img src={selectedType.icon} alt="" className="h-6 w-6" />
                  <span className="text-left">
                    <span className="block font-medium">{selectedType.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {selectedType.description}
                    </span>
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Selecione um imbuement...</span>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {pickerOpen && (
              <div className="relative">
                <div className="absolute left-0 right-0 top-1 z-20 max-h-72 overflow-auto rounded-lg border border-border bg-popover p-2 shadow-xl">
                  <input
                    autoFocus
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Buscar (ex: sword, fire, life...)"
                    className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-rubi-blue"
                  />
                  {(Object.keys(grouped) as ImbuementCategory[]).map((cat) => {
                    const items = grouped[cat];
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} className="mb-2 last:mb-0">
                        <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-rubi-gold">
                          {CATEGORY_LABEL[cat]}
                        </div>
                        <ul>
                          {items.map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setTypeId(t.id);
                                  setPickerOpen(false);
                                  setPickerQuery("");
                                }}
                                className={
                                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent " +
                                  (t.id === typeId ? "bg-accent" : "")
                                }
                              >
                                <img src={t.icon} alt="" className="h-6 w-6 shrink-0" />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium">{t.name}</span>
                                  <span className="block text-[10px] text-muted-foreground">
                                    {t.description}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gasto com Gold Token
            </span>
            <input
              inputMode="numeric"
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              placeholder="Ex: 320000"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue"
            />
          </label>

          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Horas restantes</span>
              <span className="text-[10px] normal-case tracking-normal text-muted-foreground/70">
                máx {IMB_DURATION_HOURS}h
              </span>
            </span>
            <input
              inputMode="text"
              value={hoursRemaining}
              onChange={(e) => setHoursRemaining(e.target.value)}
              placeholder="Ex: 12:30 ou 12.5"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue"
            />
            <span className="mt-1 block text-[10px] text-muted-foreground">
              Pode digitar no formato <strong>HH:MM</strong> (ex: 12:30) ou em horas decimais (ex: 12,5).
            </span>
          </label>

          <div className="rounded-lg border border-border bg-accent/30 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo base ({IMB_TIER_LABEL[tier]})</span>
              <span>{fmtGold(IMB_TIER_COST[tier])}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gold Token</span>
              <span>{fmtGold(goldNum)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold">
              <span>Total</span>
              <span className="text-rubi-gold">{fmtGold(totalPreview)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Custo / hora</span>
              <span>{fmtGold(totalPreview / IMB_DURATION_HOURS)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">A amortizar em {fmtHoursMin(hoursNum)}</span>
              <span>{fmtGold(remainingCostPreview)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={closeAdd}
              disabled={busy}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy || !typeId}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-blue hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {busy ? "Adicionando..." : "Adicionar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renewTarget} onOpenChange={(o) => { if (!o) closeRenew(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renovar imbuement</DialogTitle>
            <DialogDescription>
              {renewTarget?.label} · recarrega para {IMB_DURATION_HOURS}h de hunt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gasto com Gold Token
            </label>
            <input
              autoFocus
              inputMode="numeric"
              value={renewGold}
              onChange={(e) => setRenewGold(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmRenew(); }}
              placeholder="Ex: 320000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue"
            />
            <p className="text-[11px] text-muted-foreground">
              Valor anterior: {renewTarget ? fmtGold(renewTarget.currentGold) : "—"}. Ajuste se o preço mudou.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={closeRenew}
              disabled={renewBusy}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRenew}
              disabled={renewBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {renewBusy ? "Renovando..." : "Renovar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
