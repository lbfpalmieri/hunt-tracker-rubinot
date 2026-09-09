import { useState } from "react";
import { Check, Swords } from "lucide-react";
import { useAppStore } from "@/lib/store";

/**
 * Registro rápido de level, sem precisar ir até Meu rendimento — usado tanto
 * na importação de sessão (sugestão opcional, sempre visível) quanto no aviso
 * do Dashboard pra quem nunca registrou. Pré-preenche com o level atual
 * quando existe, então também serve pra atualizar rapidinho.
 */
export function LevelQuickAdd({
  characterId,
  currentLevel,
  onSaved,
}: {
  characterId: string;
  currentLevel: number | null;
  onSaved?: (level: number) => void;
}) {
  const addLevelSnapshot = useAppStore((s) => s.addLevelSnapshot);
  const [value, setValue] = useState(currentLevel != null ? String(currentLevel) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = Math.round(Number(value));
  const ready = value.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;

  const handleSave = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addLevelSnapshot(characterId, parsed);
      setSaved(true);
      onSaved?.(parsed);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        placeholder="Ex: 250"
        className="w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-rubi-success"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!ready || saving}
        className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-rubi-success px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saved ? <Check className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
        {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar level"}
      </button>
      {error && <span className="text-xs text-rubi-danger">{error}</span>}
    </div>
  );
}
