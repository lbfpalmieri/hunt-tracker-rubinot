import { useState } from "react";
import { Trophy } from "lucide-react";
import type { BountyInfo } from "@/lib/bounty";
import { BountyTaskPanel } from "@/components/BountyTaskPanel";
import { bountyDraftFrom, bountyDraftValid, bountyFromDraft } from "@/lib/bounty-draft";

/** Inline editor to flag/unflag a saved session's Bounty Task bonus. */
export function BountyEditor({
  value,
  creatures,
  onSave,
}: {
  value: BountyInfo | null;
  /** Criaturas mortas na sessão (pra escolher a criatura da task). */
  creatures: { name: string; count: number }[];
  onSave: (next: BountyInfo | null) => void | Promise<void>;
}) {
  const [enabled, setEnabled] = useState(Boolean(value));
  const [draft, setDraft] = useState(() => bountyDraftFrom(value));
  const [saving, setSaving] = useState(false);

  const next = enabled ? bountyFromDraft(draft) : null;
  const canSave = enabled ? bountyDraftValid(draft) : true;
  const dirty = JSON.stringify(next ?? null) !== JSON.stringify(value ?? null);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(next);
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
        <div className="mt-3">
          <BountyTaskPanel creatures={creatures} value={draft} onChange={setDraft} />
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
