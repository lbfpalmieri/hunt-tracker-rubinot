import { useState } from "react";
import { Check, Minus, Plus, Swords } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { errorMessage } from "@/lib/errors";

/**
 * Registro rápido de level, sem precisar ir até Meu rendimento — usado tanto
 * na importação de sessão (sugestão opcional, sempre visível) quanto no aviso
 * do Dashboard pra quem nunca registrou. Pré-preenche com o level atual
 * quando existe, então também serve pra atualizar rapidinho.
 * `size="lg"`: campo grande com −/+ (passo Finalizar da Nova sessão).
 */
export function LevelQuickAdd({
  characterId,
  currentLevel,
  onSaved,
  size = "sm",
}: {
  characterId: string;
  currentLevel: number | null;
  onSaved?: (level: number) => void;
  size?: "sm" | "lg";
}) {
  const addLevelSnapshot = useAppStore((s) => s.addLevelSnapshot);
  const [value, setValue] = useState(currentLevel != null ? String(currentLevel) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = Math.round(Number(value));
  const ready = value.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;
  const lg = size === "lg";
  const unchanged = ready && currentLevel != null && parsed === currentLevel;

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
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const step = (d: number) => {
    const base = ready ? parsed : (currentLevel ?? 0);
    setValue(String(Math.max(1, base + d)));
    setSaved(false);
  };

  const input = (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        setValue(e.target.value.replace(/\D/g, ""));
        setSaved(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (lg && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          e.preventDefault();
          step(e.key === "ArrowUp" ? 1 : -1);
        }
      }}
      placeholder={lg ? "Level" : "Ex: 250"}
      aria-label="Level"
      className={
        lg
          ? "w-20 bg-transparent text-center font-display text-xl font-bold tabular-nums text-rubi-gold outline-none placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground/60"
          : "w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-rubi-success"
      }
    />
  );

  const stepBtn = (d: number) => (
    <button
      type="button"
      onClick={() => step(d)}
      aria-label={d > 0 ? "Subir 1 level" : "Descer 1 level"}
      className="flex h-9 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-rubi-gold/15 hover:text-rubi-gold"
    >
      {d > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {lg ? (
        <div className="flex items-center overflow-hidden rounded-lg border border-rubi-gold/40 bg-background/70 focus-within:border-rubi-gold">
          {stepBtn(-1)}
          {input}
          {stepBtn(1)}
        </div>
      ) : (
        input
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={!ready || saving}
        className={
          "inline-flex flex-none items-center gap-1.5 rounded-lg bg-rubi-success font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 " +
          (lg ? "h-9 px-4 text-sm" : "px-3 py-1.5 text-xs")
        }
      >
        {saved ? <Check className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
        {saving
          ? "Salvando..."
          : saved
            ? "Salvo!"
            : unchanged && lg
              ? "Confirmar level"
              : "Salvar level"}
      </button>
      {error && <span className="text-xs text-rubi-danger">{error}</span>}
    </div>
  );
}
