import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Save, X } from "lucide-react";
import { toast } from "sonner";
import { WHEEL_ICON } from "@/lib/session-setup";
import { isEmptyWheel, usedPoints, type WheelBuild } from "@/lib/wheel";
import {
  WHEEL_PRESET_NAME_MAX,
  sameWheel,
  suggestedWheelName,
  useSaveWheelPreset,
  useWheelPresets,
} from "@/lib/wheel-presets";

/**
 * "Minhas rodas": escolhe uma das rodas salvas do personagem (wheel-presets.ts). Usado no setup da
 * sessão e no registro de boss. Clicar na roda já escolhida tira ela. `allowSave` mostra "Salvar
 * esta roda" quando a roda atual (montada na hora) ainda não está entre as salvas.
 */
export function WheelPresetPicker({
  characterId,
  value,
  onPick,
  allowSave = false,
}: {
  characterId: string | null;
  /** Roda atual do setup (pra marcar qual está escolhida). */
  value: WheelBuild | null | undefined;
  onPick: (wheel: WheelBuild | null) => void;
  allowSave?: boolean;
}) {
  const { data: presets = [] } = useWheelPresets(characterId);
  const save = useSaveWheelPreset(characterId);
  const [naming, setNaming] = useState<string | null>(null);
  const current = presets.find((p) => sameWheel(p.wheel, value)) ?? null;
  const canSave = allowSave && !!value && !isEmptyWheel(value) && !current;

  const confirmSave = async () => {
    if (!naming?.trim() || !value) return;
    try {
      await save.mutateAsync({ name: naming, wheel: value });
      toast.success(`Roda "${naming.trim()}" salva`);
      setNaming(null);
    } catch (e) {
      toast.error("Não consegui salvar a roda", { description: (e as Error).message });
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Minhas rodas
        </span>
        <Link to="/rodas" className="text-[11px] font-medium text-rubi-gold hover:underline">
          Gerenciar rodas
        </Link>
      </div>

      {presets.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const on = current?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(on ? null : p.wheel)}
                aria-pressed={on}
                title={on ? "Tirar esta roda" : `Usar a roda "${p.name}"`}
                className={
                  "inline-flex max-w-full items-center gap-1.5 rounded-lg border py-1 pl-1 pr-2.5 text-xs font-semibold transition-colors " +
                  (on
                    ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                    : "border-border bg-background/60 text-muted-foreground hover:border-rubi-gold/60 hover:text-foreground")
                }
              >
                <img src={WHEEL_ICON} alt="" className="h-5 w-5 [image-rendering:pixelated]" />
                {on && <Check className="h-3.5 w-3.5 flex-none" />}
                <span className="truncate">{p.name}</span>
                <span className="font-normal opacity-70">{usedPoints(p.wheel)} pts</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma roda salva. Cadastre em{" "}
          <Link to="/rodas" className="text-rubi-gold hover:underline">
            Minhas rodas
          </Link>{" "}
          e escolha aqui — sem precisar duplicar o set.
        </p>
      )}

      {canSave &&
        (naming == null ? (
          <button
            type="button"
            onClick={() => setNaming(suggestedWheelName(presets))}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rubi-gold hover:underline"
          >
            <Save className="h-3.5 w-3.5" /> Salvar esta roda em Minhas rodas
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={naming}
              onChange={(e) => setNaming(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmSave()}
              maxLength={WHEEL_PRESET_NAME_MAX}
              placeholder="Nome da roda (ex: Dano em área)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
            />
            <button
              type="button"
              onClick={confirmSave}
              disabled={save.isPending}
              aria-label="Confirmar"
              className="rounded-lg bg-rubi-gold px-3 text-background disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setNaming(null)}
              aria-label="Cancelar"
              className="rounded-lg border border-border px-3 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  );
}
