import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useConfirmDialogState, resolveConfirmDialog } from "@/lib/confirm-dialog";

/** Renders whatever confirmDialog() last asked for. Mount once, near the app root. */
export function ConfirmDialogHost() {
  const { open, options } = useConfirmDialogState();
  if (!options) return null;

  const danger = options.tone === "danger";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resolveConfirmDialog(false);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {danger && <AlertTriangle className="h-4 w-4 flex-none text-rubi-danger" />}
            {options.title ?? (danger ? "Confirmar exclusão" : "Confirmar")}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line">{options.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => resolveConfirmDialog(false)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {options.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => resolveConfirmDialog(true)}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 " +
              (danger
                ? "bg-rubi-danger text-white"
                : "bg-rubi-gold text-background")
            }
          >
            {options.confirmLabel ?? (danger ? "Excluir" : "Confirmar")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
