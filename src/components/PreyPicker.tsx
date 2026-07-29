import { useEffect, useRef, useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import { PREY_BONUSES, parsePct, type PreyBonus, type PreySlot } from "@/lib/prey";

interface Draft {
  bonus: PreyBonus;
  pctText: string;
  creature: string;
}

function toDrafts(value: PreySlot[] | null): Draft[] {
  return (value ?? []).map((s) => ({
    bonus: s.bonus,
    pctText: s.pct != null ? String(s.pct) : "",
    creature: s.creature ?? "",
  }));
}

/**
 * Editor for the Prey Creature bonuses active during a session.
 * Emits the normalized slot list (or null) plus a validity flag.
 */
export function PreyPicker({
  value,
  onChange,
}: {
  value: PreySlot[] | null;
  onChange: (prey: PreySlot[] | null, valid: boolean) => void;
}) {
  const [enabled, setEnabled] = useState((value?.length ?? 0) > 0);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    value?.length ? toDrafts(value) : [{ bonus: "xp", pctText: "", creature: "" }],
  );

  const emit = useRef(onChange);
  emit.current = onChange;

  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!enabled) return; // nothing to report on mount
    }
    if (!enabled) {
      emit.current(null, true);
      return;
    }
    const invalid = drafts.some((d) => d.pctText.trim() !== "" && parsePct(d.pctText) == null);
    const slots: PreySlot[] = drafts.map((d) => ({
      bonus: d.bonus,
      pct: parsePct(d.pctText),
      creature: d.creature.trim() || null,
    }));
    emit.current(slots.length ? slots : null, !invalid && slots.length > 0);
  }, [enabled, drafts]);

  const update = (i: number, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--rubi-blue)]"
        />
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-rubi-blue" />
          Esta sessão usou <b className="text-foreground">Prey Creatures</b> (mais XP, lucro, dano ou defesa)
        </span>
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Slot {i + 1}
                </span>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDrafts((ds) => ds.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground transition-colors hover:text-rubi-danger"
                    aria-label={`Remover slot ${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {PREY_BONUSES.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    title={b.hint}
                    onClick={() => update(i, { bonus: b.value })}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      d.bonus === b.value
                        ? "border-rubi-blue bg-rubi-blue/15 text-rubi-blue"
                        : "border-border/60 text-muted-foreground hover:border-rubi-blue/50"
                    }`}
                  >
                    <span className="mr-1">{b.emoji}</span>
                    {b.label}
                    <span className="mt-0.5 block text-[10px] font-normal opacity-70">{b.hint}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-muted-foreground">Bônus (%)</label>
                  <input
                    value={d.pctText}
                    onChange={(e) => update(i, { pctText: e.target.value })}
                    placeholder="ex: 40"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-rubi-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted-foreground">Criatura (opcional)</label>
                  <input
                    value={d.creature}
                    onChange={(e) => update(i, { creature: e.target.value })}
                    placeholder="ex: Ingol"
                    className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-rubi-blue"
                  />
                </div>
              </div>

              {d.pctText.trim() !== "" && parsePct(d.pctText) == null && (
                <p className="mt-1 text-[11px] text-rubi-danger">Use um número entre 0 e 100.</p>
              )}
            </div>
          ))}

          {drafts.length < 3 && (
            <button
              type="button"
              onClick={() => setDrafts((ds) => [...ds, { bonus: "loot", pctText: "", creature: "" }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rubi-blue/50 px-3 py-1.5 text-xs font-semibold text-rubi-blue transition-colors hover:bg-rubi-blue/10"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar slot de prey
            </button>
          )}
        </div>
      )}
    </div>
  );
}
