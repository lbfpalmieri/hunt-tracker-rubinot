import { useState } from "react";
import { Trophy } from "lucide-react";
import { fmtNum } from "@/lib/format";
import {
  BOUNTY_DIFFICULTIES,
  BOUNTY_TIERS,
  parseXpAmount,
  type BountyDifficulty,
  type BountyInfo,
  type BountyTier,
} from "@/lib/bounty";

/** Inline editor to flag/unflag a saved session's Bounty Task bonus. */
export function BountyEditor({
  value,
  onSave,
}: {
  value: BountyInfo | null;
  onSave: (next: BountyInfo | null) => void | Promise<void>;
}) {
  const [enabled, setEnabled] = useState(Boolean(value));
  const [difficulty, setDifficulty] = useState<BountyDifficulty | "">(value?.difficulty ?? "");
  const [tier, setTier] = useState<BountyTier | "">(value?.tier ?? "");
  const [xpText, setXpText] = useState(value?.xp != null ? String(value.xp) : "");
  const [saving, setSaving] = useState(false);

  const xp = parseXpAmount(xpText);
  const xpInvalid = xpText.trim().length > 0 && xp == null;
  const canSave = enabled ? Boolean(difficulty && tier && !xpInvalid) : true;

  const dirty =
    enabled !== Boolean(value) ||
    (enabled &&
      (difficulty !== value?.difficulty || tier !== value?.tier || (xp ?? null) !== (value?.xp ?? null)));

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(enabled && difficulty && tier ? { difficulty, tier, xp } : null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--rubi-gold)]"
        />
        <span className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-rubi-gold" />
          Esta sessão incluiu <b className="text-foreground">bônus de Bounty Task</b>
        </span>
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Dificuldade
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {BOUNTY_DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  title={d.hint}
                  onClick={() => setDifficulty(d.value)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    difficulty === d.value
                      ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                      : "border-border/60 text-muted-foreground hover:border-rubi-gold/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Tipo da task
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {BOUNTY_TIERS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTier(t.value)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    tier === t.value
                      ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                      : "border-border/60 text-muted-foreground hover:border-rubi-gold/50"
                  }`}
                >
                  {t.label}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              XP de bônus (opcional)
            </label>
            <input
              value={xpText}
              onChange={(e) => setXpText(e.target.value)}
              placeholder="ex: 8kk ou 8000000"
              className="w-full max-w-xs rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-rubi-gold"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {xpInvalid
                ? "Valor inválido — use 8kk, 8m ou 8000000."
                : xp != null
                  ? `Será descontado da Raw XP: ${fmtNum(xp)}`
                  : "Sem valor informado, a sessão fica marcada como Bounty e sai das médias de Raw XP/h."}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || !dirty || saving}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rubi-gold/50 px-3 py-1.5 text-xs font-semibold text-rubi-gold transition-opacity hover:bg-rubi-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Salvar bounty"}
      </button>
    </div>
  );
}
