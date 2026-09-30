import { useState } from "react";
import { NotesEditor } from "@/components/notes/NotesEditor";

/**
 * Editor inline da observação de uma sessão — mesmo padrão do BountyEditor/
 * PreyEditor: estado local inicializado do valor salvo, "Salvar" só habilita
 * quando o texto muda. Sempre monte com `key={session.id}` no chamador, senão
 * trocar de sessão sem desmontar deixa o texto do registro anterior aqui.
 * Abre em "Visualizar" (texto formatado) quando já tem observação.
 */
export function SessionNotesEditor({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (next: string | null) => void | Promise<void>;
}) {
  const [text, setText] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = text.trim() !== (value ?? "").trim();

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(text.trim() || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <NotesEditor value={text} onChange={setText} initialTab="preview" />
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saving}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 px-3 py-1.5 text-xs font-semibold text-rubi-blue transition-opacity hover:bg-rubi-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Salvando..." : "Salvar observação"}
      </button>
    </div>
  );
}
