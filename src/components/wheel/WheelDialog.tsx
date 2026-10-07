import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WheelPlanner } from "@/components/wheel/WheelPlanner";
import { WHEEL_ICON, type SetupVocation } from "@/lib/session-setup";
import { emptyWheel, isEmptyWheel, type WheelBuild } from "@/lib/wheel";

/**
 * Planejador da roda num Dialog grande (tela cheia no celular). Edita um rascunho; só grava no setup
 * ao clicar "Usar esta roda".
 */
export function WheelDialog({
  open,
  onOpenChange,
  value,
  vocation,
  defaultLevel,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: WheelBuild | null | undefined;
  vocation: SetupVocation | null;
  /** Level atual do personagem (preenche o level da roda nova). */
  defaultLevel: number | null;
  onApply: (wheel: WheelBuild | null) => void;
}) {
  const fresh = () =>
    value && (!vocation || value.voc === vocation)
      ? structuredClone(value)
      : emptyWheel(vocation ?? "knight", defaultLevel);
  const [draft, setDraft] = useState<WheelBuild>(fresh);
  const initial = useRef("");

  // Abriu de novo: começa do que está salvo.
  useEffect(() => {
    if (!open) return;
    const start = fresh();
    initial.current = JSON.stringify(start);
    setDraft(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fechar sem "Usar esta roda" perde o que foi montado — pergunta antes se mudou alguma coisa.
  const requestClose = () => {
    const dirty = JSON.stringify(draft) !== initial.current;
    if (!dirty || window.confirm("Fechar sem salvar? As mudanças na roda vão ser perdidas.")) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Clique fora (ex. na borda escura) não fecha: era fácil perder a roda montada sem querer.
        onInteractOutside={(e) => e.preventDefault()}
        className="h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-y-auto overflow-x-hidden rounded-none p-3 sm:h-auto sm:max-h-[94vh] sm:max-w-6xl sm:rounded-xl sm:p-5 [&>*]:min-w-0"
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="flex items-center gap-2 font-brand text-xl text-rubi-gold">
            <img src={WHEEL_ICON} alt="" className="h-7 w-7 [image-rendering:pixelated]" />
            Wheel of Destiny
          </DialogTitle>
          <DialogDescription>
            Monte a roda igual no jogo: o level define os pontos, as fatias liberam do centro pra
            fora e as gemas ligam com os Vessels.
          </DialogDescription>
        </DialogHeader>

        <WheelPlanner value={draft} onChange={setDraft} vocation={vocation} />

        <div className="sticky -bottom-3 -mx-3 -mb-3 sm:-bottom-5 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5">
          <button
            type="button"
            onClick={requestClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium sm:flex-none sm:px-5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(isEmptyWheel(draft) ? null : draft);
              onOpenChange(false);
            }}
            className="flex-1 rounded-lg bg-rubi-gold py-2.5 text-sm font-bold text-background sm:ml-auto sm:flex-none sm:px-6"
          >
            Usar esta roda
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
