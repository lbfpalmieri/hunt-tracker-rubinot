import { Link } from "@tanstack/react-router";
import { LogOut, Menu, SlidersHorizontal, X } from "lucide-react";
import {
  MOBILE_BAR_SLOTS,
  NAV_GROUPS,
  NAV_ITEMS,
  findNavItem,
  isNavActive,
  type NavItem,
} from "@/lib/nav-items";
import { useNavPrefs } from "@/lib/nav-prefs";

interface Props {
  pathname: string;
  lowCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomize: () => void;
  onSignOut: () => void;
}

/**
 * Celular / tablet (<1024px): barra de baixo com os primeiros fixados do usuário + "Menu", que
 * abre uma folha com o resto em grade de ícones, agrupada (mesmos grupos do menu lateral).
 */
export function MobileNav({
  pathname,
  lowCount,
  open,
  onOpenChange,
  onCustomize,
  onSignOut,
}: Props) {
  const pinnedIds = useNavPrefs((s) => s.pinned);
  const bar = pinnedIds
    .map(findNavItem)
    .filter((n): n is NavItem => !!n)
    .slice(0, MOBILE_BAR_SLOTS);
  const inBar = new Set<string>(bar.map((n) => n.id));
  const moreActive = NAV_ITEMS.some((n) => !inBar.has(n.id) && isNavActive(pathname, n.to));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-rubi-gold/25 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${bar.length + 1}, minmax(0, 1fr))` }}
        >
          {bar.map((n) => {
            const active = isNavActive(pathname, n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.id}
                to={n.to}
                className={
                  "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium leading-tight transition-colors " +
                  (active ? "text-rubi-blue" : "text-muted-foreground")
                }
              >
                <Icon className="h-5 w-5" />
                <span className="w-full truncate px-0.5 text-center">{n.short}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={
              "relative flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium leading-tight " +
              (moreActive ? "text-rubi-blue" : "text-muted-foreground")
            }
          >
            <Menu className="h-5 w-5" />
            Menu
            {lowCount > 0 && (
              <span className="absolute right-1/4 top-1.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-rubi-gold px-1 text-[10px] font-bold text-background">
                {lowCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-rubi-gold/30 bg-popover pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-popover px-4 pb-2 pt-3">
              <span className="font-display text-base font-bold">Menu</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onCustomize}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-rubi-gold hover:bg-accent"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Personalizar
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Fechar menu"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-2">
              {NAV_GROUPS.map((g) => {
                const items = NAV_ITEMS.filter((n) => n.group === g.id && !inBar.has(n.id));
                if (items.length === 0) return null;
                return (
                  <div key={g.id} className="mb-3">
                    <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rubi-gold/85">
                      {g.label}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((n) => {
                        const active = isNavActive(pathname, n.to);
                        const Icon = n.icon;
                        const badge = n.id === "imbuements" && lowCount > 0 ? lowCount : 0;
                        return (
                          <Link
                            key={n.id}
                            to={n.to}
                            onClick={() => onOpenChange(false)}
                            className={
                              "relative flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2.5 text-center text-[11px] font-medium leading-tight transition-colors active:bg-accent " +
                              (active
                                ? "border-rubi-blue/50 bg-rubi-blue-soft text-rubi-blue"
                                : "border-border/60 bg-surface/60 text-foreground")
                            }
                          >
                            <Icon className={"h-6 w-6 " + (active ? "" : "text-rubi-blue")} />
                            <span className="line-clamp-2">{n.short}</span>
                            {badge > 0 && (
                              <span className="absolute right-1.5 top-1.5 rounded-full bg-rubi-gold px-1.5 py-0.5 text-[10px] font-bold text-background">
                                {badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="flex min-h-12 w-full items-center gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground active:bg-accent"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}
