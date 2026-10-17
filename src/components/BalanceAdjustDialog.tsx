import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { adjustmentToReach, parseGold } from "@/lib/gold-balance";
import { errorMessage } from "@/lib/errors";
import { fmtGold } from "@/lib/format";

const DEFAULT_DESCRIPTION = "Ajuste de saldo";

/**
 * "Atualizar saldo": igual a atualizar o level — a pessoa digita quanto gold o personagem tem no
 * jogo agora e o app grava a diferença pro saldo que ele calcula (gold_adjustments). Serve pra gold
 * de fora das hunts: itens vendidos, o que já tinha antes de usar o app...
 */
export function BalanceAdjustDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  appBalance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
  /** Saldo que o app calcula hoje (hunts − imbuements − gastos + ajustes). */
  appBalance: number;
}) {
  const addGoldAdjustment = useAppStore((s) => s.addGoldAdjustment);
  const [gameInput, setGameInput] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setGameInput("");
    setDescription("");
    setError(null);
  }, [open]);

  const game = parseGold(gameInput);
  const diff = game == null ? null : adjustmentToReach(game, appBalance);
  const ready = diff != null && diff !== 0;

  const save = async () => {
    if (!ready || diff == null) return;
    setSaving(true);
    setError(null);
    try {
      await addGoldAdjustment({
        characterId,
        description: description.trim() || DEFAULT_DESCRIPTION,
        amount: diff,
      });
      toast.success(`Saldo de ${characterName} atualizado para ${fmtGold(game ?? 0)}`);
      onOpenChange(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atualizar saldo</DialogTitle>
          <DialogDescription>
            Quanto gold {characterName} tem no jogo agora? O app guarda a diferença como um ajuste —
            ex.: itens que você vendeu ou o gold que já tinha antes de usar o app.
          </DialogDescription>
        </DialogHeader>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Saldo no jogo (gold)
          </span>
          <input
            autoFocus
            inputMode="numeric"
            value={gameInput}
            onChange={(e) => setGameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
            placeholder="Ex: 25.000.000 ou 25kk"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
          />
        </label>
        <p className="text-2xs text-muted-foreground">
          Hoje o app calcula <strong className="text-foreground">{fmtGold(appBalance)}</strong>.
        </p>
        {gameInput.trim() && (
          <p
            className={
              "text-xs font-semibold " +
              (diff == null || diff === 0
                ? "text-muted-foreground"
                : diff > 0
                  ? "text-rubi-success"
                  : "text-rubi-danger")
            }
          >
            {diff == null
              ? "Não entendi esse valor — use só números (pode usar k e kk)."
              : diff === 0
                ? "Já bate com o saldo do app — nada a ajustar."
                : diff > 0
                  ? `Vai entrar um ajuste de +${fmtGold(diff)}.`
                  : `Vai entrar um ajuste de −${fmtGold(-diff)}.`}
          </p>
        )}
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Motivo <span className="normal-case tracking-normal">(opcional)</span>
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: vendi itens que eu já tinha"
            maxLength={120}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
          />
        </label>
        {error && (
          <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !ready}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Atualizar saldo"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
