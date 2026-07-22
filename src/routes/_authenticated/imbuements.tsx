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
} from "@/lib/imbuements";
import { fmtGold, fmtDate } from "@/lib/format";
import { Sparkles, Plus, Trash2, Coins, Timer, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IMBUEMENT_TYPES,
  CATEGORY_LABEL,
  getImbuementType,
  type ImbuementCategory,
} from "@/lib/imbuement-types";

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

function ImbuementsPage() {
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const sessions = useAppStore((s) => s.sessions);
  const imbuements = useAppStore((s) => s.imbuements);
  const addImbuement = useAppStore((s) => s.addImbuement);
  const removeImbuement = useAppStore((s) => s.removeImbuement);

  const active = characters.find((c) => c.id === activeId) ?? null;

  const [tier, setTier] = useState<ImbuementTier>("powerful");
  const [gold, setGold] = useState<string>("");
  const [busyRemove, setBusyRemove] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const handleAdd = async () => {
    if (!typeId) return;
    setBusy(true);
    try {
      await addImbuement({
        characterId: active.id,
        tier,
        goldTokenCost: goldNum,
        label: typeId,
      });
      setGold("");
      setTypeId("");
      setPickerQuery("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
            RubinOT · Imbuements
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Custo de <span className="text-gradient-brand">imbuements</span>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-rubi-blue" />
            <h2 className="text-base font-semibold">Adicionar imbuement</h2>
          </div>

          <label className="mb-3 block">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tipo
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

          <label className="mb-3 block">
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

          <label className="mb-4 block">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rótulo (opcional)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Sword Skill, Life Leech..."
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue"
            />
          </label>

          <div className="mb-4 rounded-lg border border-border bg-accent/30 p-3 text-xs">
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
          </div>

          <button
            onClick={handleAdd}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rubi-blue px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-blue hover:opacity-90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Adicionar imbuement
          </button>
        </div>

        <div className="card-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Imbuements de {active.name}</h2>
              <p className="text-xs text-muted-foreground">
                {agg?.rows.length ?? 0} registrados · {fmtGold(agg?.activeCostPerHour ?? 0)}/h ativos · Total gasto: {fmtGold(agg?.totalSpent ?? 0)}
              </p>
            </div>
            <Coins className="h-4 w-4 text-rubi-gold" />
          </div>

          {(!agg || agg.rows.length === 0) ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum imbuement registrado ainda. Adicione um ao lado para começar.
            </div>
          ) : (
            <ul className="space-y-2">
              {agg.rows.map((r) => {
                const pct = Math.min(100, (r.hoursConsumed / IMB_DURATION_HOURS) * 100);
                return (
                  <li
                    key={r.imb.id}
                    className="rounded-lg border border-border bg-surface/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                              (r.imb.tier === "powerful"
                                ? "bg-rubi-gold/20 text-rubi-gold"
                                : r.imb.tier === "intricate"
                                  ? "bg-rubi-blue-soft text-rubi-blue"
                                  : "bg-accent text-muted-foreground")
                            }
                          >
                            {IMB_TIER_LABEL[r.imb.tier]}
                          </span>
                          {r.imb.label && (
                            <span className="text-sm font-medium">{r.imb.label}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(r.imb.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Total {fmtGold(r.totalCost)} · {fmtGold(r.costPerHour)}/h · Gold Token {fmtGold(r.imb.goldTokenCost)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeImbuement(r.imb.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {r.hoursConsumed.toFixed(1)}h / {IMB_DURATION_HOURS}h
                        </span>
                        <span>Gasto: {fmtGold(r.amountSpent)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                        <div
                          className={
                            "h-full " + (r.active ? "bg-rubi-blue" : "bg-muted-foreground/50")
                          }
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
