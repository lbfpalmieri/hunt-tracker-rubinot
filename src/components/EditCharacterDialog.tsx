import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHARACTER_NAME_MAX,
  CHARACTER_WORLD_MAX,
  buildCharacterPatch,
  nameTaken,
} from "@/lib/character-edit";
import { errorMessage } from "@/lib/errors";
import { useAppStore, type Character } from "@/lib/store";

/**
 * Edita nome, vocação e mundo de um personagem que já existe. As sessões continuam ligadas a ele
 * (o histórico não se perde); o nome novo também vai pras sessões públicas (updateCharacter).
 */
export function EditCharacterDialog({
  character,
  vocations,
  open,
  onOpenChange,
}: {
  character: Character;
  vocations: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const characters = useAppStore((s) => s.characters);
  const updateCharacter = useAppStore((s) => s.updateCharacter);
  const [name, setName] = useState(character.name);
  const [vocation, setVocation] = useState(character.vocation);
  const [world, setWorld] = useState(character.world);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vocação antiga que não está na lista atual continua escolhível (não some do select).
  const options = vocations.includes(character.vocation)
    ? vocations
    : [character.vocation, ...vocations];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const result = buildCharacterPatch(character, { name, vocation, world });
    if (result.status === "erro") return setError(result.message);
    if (result.status === "nada-mudou") return onOpenChange(false);
    if (result.patch.name && nameTaken(characters, character.id, result.patch.name)) {
      return setError("Você já tem outro personagem com esse nome.");
    }
    setSaving(true);
    setError(null);
    try {
      await updateCharacter(character.id, result.patch);
      toast.success("Personagem atualizado", {
        description: "As sessões dele continuam todas aqui.",
      });
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field =
    "mt-1 min-h-11 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brand">Editar personagem</DialogTitle>
          <DialogDescription>
            Mudou de nome, vocação ou mundo? Corrija aqui, sem perder o histórico de sessões.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Nome</span>
            <input
              value={name}
              maxLength={CHARACTER_NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              className={field}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Vocação</span>
            <select value={vocation} onChange={(e) => setVocation(e.target.value)} className={field}>
              {options.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Mundo</span>
            <input
              value={world}
              maxLength={CHARACTER_WORLD_MAX}
              onChange={(e) => setWorld(e.target.value)}
              className={field}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium transition-transform hover:bg-accent active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-rubi-blue px-4 text-sm font-semibold text-primary-foreground shadow-glow-blue transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
