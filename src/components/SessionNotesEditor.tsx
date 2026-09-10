import { useState } from "react";

/**
 * Editor inline da observação de uma sessão — mesmo padrão do BountyEditor/
 * PreyEditor: estado local inicializado do valor salvo, "Salvar" só habilita
 * quando o texto muda. Sempre monte com `key={session.id}` no chamador, senão
 * trocar de sessão sem desmontar deixa o texto do registro anterior aqui.
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
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ex: testei essa build de runas, rendeu bem no prey de dano"
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-rubi-blue"
      />
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
