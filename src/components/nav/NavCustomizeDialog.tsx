import { ArrowDown, ArrowUp, Plus, RotateCcw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MOBILE_BAR_SLOTS,
  NAV_GROUPS,
  NAV_ITEMS,
  findNavItem,
  type NavItem,
} from "@/lib/nav-items";
import { movePinned, resetNavPrefs, togglePinned, useNavPrefs } from "@/lib/nav-prefs";

const ICON_BTN =
  "flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

/** Personalizar menu: o usuário escolhe o que fica fixado no topo e em que ordem. */
export function NavCustomizeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const pinnedIds = useNavPrefs((s) => s.pinned);
  const pinned = pinnedIds.map(findNavItem).filter((n): n is NavItem => !!n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar menu</DialogTitle>
          <DialogDescription>
            Fixe o que você mais usa: vai pro topo do menu lateral e, no celular, os{" "}
            {MOBILE_BAR_SLOTS} primeiros ficam na barra de baixo. Fica salvo na sua conta (vale no
            computador e no celular).
          </DialogDescription>
        </DialogHeader>

        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rubi-gold/85">
            Fixados ({pinned.length})
          </h3>
          {pinned.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Nada fixado. Adicione itens na lista abaixo.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {pinned.map((n, i) => {
                const Icon = n.icon;
                return (
                  <li
                    key={n.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 py-1 pl-3 pr-1"
                  >
                    <Icon className="h-4 w-4 flex-none text-rubi-blue" />
                    <span className="min-w-0 flex-1 truncate text-sm">{n.label}</span>
                    {i < MOBILE_BAR_SLOTS && (
                      <span className="flex-none rounded bg-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Barra
                      </span>
                    )}
                    <button
                      type="button"
                      className={ICON_BTN}
                      disabled={i === 0}
                      onClick={() => movePinned(n.id, -1)}
                      aria-label={`Subir ${n.label}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={ICON_BTN}
                      disabled={i === pinned.length - 1}
                      onClick={() => movePinned(n.id, 1)}
                      aria-label={`Descer ${n.label}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={ICON_BTN + " hover:text-rubi-danger"}
                      onClick={() => togglePinned(n.id)}
                      aria-label={`Desafixar ${n.label}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rubi-gold/85">
            Adicionar aos fixados
          </h3>
          {NAV_GROUPS.map((g) => {
            const items = NAV_ITEMS.filter((n) => n.group === g.id && !pinnedIds.includes(n.id));
            if (items.length === 0) return null;
            return (
              <div key={g.id}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">{g.label}</div>
                <ul className="space-y-1">
                  {items.map((n) => {
                    const Icon = n.icon;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => togglePinned(n.id)}
                          className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-accent"
                        >
                          <Icon className="h-4 w-4 flex-none text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{n.label}</span>
                          <Plus className="h-4 w-4 flex-none text-rubi-gold" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={resetNavPrefs}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar padrão
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Concluir
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
