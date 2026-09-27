import { useState } from "react";
import { Pencil } from "lucide-react";
import { SessionSetupPanel } from "@/components/setup/SessionSetupPanel";
import { SetupCard } from "@/components/setup/SetupCard";
import {
  EMPTY_SETUP,
  charmsFromMisc,
  normalizeSetup,
  setupVocation,
  type SessionSetup,
} from "@/lib/session-setup";

/** Setup de uma sessão salva: mostra o card e deixa editar. */
export function SetupEditor({
  value,
  vocation,
  creatures,
  misc,
  onSave,
}: {
  value: SessionSetup | null;
  vocation: string | null | undefined;
  creatures: string[];
  misc: { charm?: Record<string, number> } | null;
  onSave: (next: SessionSetup | null) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SessionSetup>(value ?? EMPTY_SETUP);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(normalizeSetup(draft));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div>
        {value ? (
          <SetupCard setup={value} vocation={vocation} />
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum setup registrado nesta sessão.</p>
        )}
        <button
          type="button"
          onClick={() => {
            setDraft(value ?? EMPTY_SETUP);
            setEditing(true);
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 px-3 py-1.5 text-xs font-semibold text-rubi-blue hover:bg-rubi-blue/10"
        >
          <Pencil className="h-3.5 w-3.5" /> {value ? "Editar setup" : "Adicionar setup"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <SessionSetupPanel
        value={draft}
        onChange={setDraft}
        vocation={setupVocation(vocation)}
        creatures={creatures}
        suggestedCharms={charmsFromMisc(misc)}
      />
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar setup"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
