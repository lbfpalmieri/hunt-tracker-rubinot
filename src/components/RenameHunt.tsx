import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { HUNT_NAME_MAX, normalizeHuntName } from "@/lib/hunt-name";
import { errorMessage } from "@/lib/errors";

/**
 * Nome da hunt (spot) na página da sessão, com edição no lugar: o lápis troca o título por um campo,
 * Enter ou o botão de confirmar salva, Esc cancela. Nome corrigido passa a contar junto com as outras
 * sessões de mesmo nome nas médias da hunt (que agrupam pelo nome).
 */
export function RenameHunt({
  name,
  onSave,
}: {
  name: string;
  onSave: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(name);
  const [saving, setSaving] = useState(false);

  const clean = normalizeHuntName(text);
  const changed = clean !== name && clean.length > 0;

  const start = () => {
    setText(name);
    setEditing(true);
  };

  const save = async () => {
    if (saving) return;
    if (!changed) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(clean);
      toast.success("Hunt renomeada", { description: clean });
      setEditing(false);
    } catch (e) {
      toast.error("Não consegui renomear a hunt", { description: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="font-brand text-3xl font-bold">{name}</h1>
        <button
          type="button"
          onClick={start}
          aria-label="Renomear hunt"
          title="Renomear hunt"
          className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground active:scale-[0.98]"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex min-w-0 flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <input
        autoFocus
        value={text}
        maxLength={HUNT_NAME_MAX}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        aria-label="Nome da hunt"
        className="min-h-11 w-full min-w-0 rounded-lg border border-rubi-blue/50 bg-background/60 px-3 font-brand text-2xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-96"
      />
      <button
        type="submit"
        disabled={!changed || saving}
        aria-label="Salvar nome da hunt"
        title="Salvar"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-rubi-success/50 text-rubi-success transition-opacity hover:bg-rubi-success/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label="Cancelar"
        title="Cancelar"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 active:scale-[0.98]"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="w-full text-xs text-muted-foreground">
        Sessões com o mesmo nome contam juntas na média da hunt.
      </p>
    </form>
  );
}
