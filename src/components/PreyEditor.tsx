import { useState } from "react";
import { PreyPicker } from "@/components/PreyPicker";
import type { PreySlot } from "@/lib/prey";

/** Inline editor to flag/unflag the Prey Creatures used in a saved session. */
export function PreyEditor({
  value,
  onSave,
}: {
  value: PreySlot[] | null;
  onSave: (next: PreySlot[] | null) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<PreySlot[] | null>(value);
  const [valid, setValid] = useState(true);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(draft ?? null) !== JSON.stringify(value ?? null);

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PreyPicker
        value={value}
        onChange={(next, isValid) => {
          setDraft(next);
          setValid(isValid);
        }}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!valid || !dirty || saving}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 px-3 py-1.5 text-xs font-semibold text-rubi-blue transition-opacity hover:bg-rubi-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Salvar prey"}
      </button>
    </div>
  );
}
