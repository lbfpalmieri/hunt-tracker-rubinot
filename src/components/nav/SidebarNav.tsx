import { Link } from "@tanstack/react-router";
import { ChevronRight, LogOut, Pin, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import { NAV_GROUPS, NAV_ITEMS, findNavItem, isNavActive, type NavItem } from "@/lib/nav-items";
import { setSidebarExpanded, useNavPrefs } from "@/lib/nav-prefs";
import { NavIcon } from "@/components/nav/NavIcon";

const ROW =
  "relative mx-2 flex h-11 items-center gap-3 whitespace-nowrap rounded-lg px-2.5 text-[15px] transition-colors";

/** Largura do menu recolhido — o AppShell usa a mesma pra abrir espaço (lg:pl-[72px]). */
const SIDEBAR_COLLAPSED = "w-[72px]";

interface Props {
  pathname: string;
  lowCount: number;
  onCustomize: () => void;
  onSignOut: () => void;
}

/**
 * Menu lateral do desktop (≥1024px). Recolhido = trilho de 72px só com os ícones (sprites do
 * jogo, como na wiki/site do RubinOT); ao passar o mouse (ou tabular) abre por cima do conteúdo;
 * o botão na borda fixa aberto e empurra a página (AppShell lê `expanded`). Fixados no topo.
 */
export function SidebarNav({ pathname, lowCount, onCustomize, onSignOut }: Props) {
  const pinnedIds = useNavPrefs((s) => s.pinned);
  const fixedOpen = useNavPrefs((s) => s.expanded);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const open = fixedOpen || hover || focus;

  const pinned = pinnedIds.map(findNavItem).filter((n): n is NavItem => !!n);
  const fade = "transition-opacity duration-150 " + (open ? "opacity-100" : "opacity-0");

  const renderItem = (n: NavItem) => {
    const active = isNavActive(pathname, n.to);
    const badge = n.id === "imbuements" && lowCount > 0 ? lowCount : 0;
    return (
      <Link
        key={n.id}
        to={n.to}
        title={open ? undefined : n.label}
        aria-current={active ? "page" : undefined}
        className={
          ROW +
          " " +
          (active
            ? "bg-gradient-to-r from-rubi-gold/20 to-rubi-gold/[0.04] font-semibold text-rubi-gold ring-1 ring-inset ring-rubi-gold/35"
            : "font-medium text-foreground/80 hover:bg-white/[0.06] hover:text-foreground")
        }
      >
        {active && (
          <span className="absolute -left-2 bottom-2 top-2 w-[3px] rounded-r-full bg-rubi-gold shadow-[0_0_8px_var(--rubi-gold)]" />
        )}
        <NavIcon item={n} size={30} />
        <span className={"flex-1 truncate " + fade}>{n.label}</span>
        {badge > 0 &&
          (open ? (
            <span className="rounded-full bg-rubi-gold px-1.5 py-0.5 text-[11px] font-bold text-background">
              {badge}
            </span>
          ) : (
            <span className="absolute right-1 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rubi-gold px-1 text-[10px] font-bold text-background">
              {badge}
            </span>
          ))}
      </Link>
    );
  };

  const title = (label: string, icon?: boolean) =>
    open ? (
      <div className="flex items-center gap-2 whitespace-nowrap px-4 pb-1.5 pt-5 font-brand text-[11px] font-bold uppercase tracking-[0.18em] text-rubi-gold">
        {icon && <Pin className="h-3 w-3" />}
        {label}
        <span className="h-px flex-1 bg-gradient-to-r from-rubi-gold/40 to-transparent" />
      </div>
    ) : (
      <div className="mx-4 my-3 h-px bg-rubi-gold/20" />
    );

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => setFocus(e.target.matches(":focus-visible"))}
      onBlur={() => setFocus(false)}
      aria-label="Menu principal"
      className={
        "fixed inset-y-0 left-0 z-40 hidden border-r border-rubi-gold/30 bg-[color-mix(in_oklab,var(--background)_85%,black)] backdrop-blur-xl transition-[width,box-shadow] duration-200 lg:block " +
        (open ? "w-72" : SIDEBAR_COLLAPSED) +
        (open && !fixedOpen ? " shadow-[12px_0_40px_-12px_rgba(0,0,0,0.7)]" : "")
      }
    >
      <div className="flex h-full flex-col overflow-hidden">
        <Link
          to="/dashboard"
          className="flex h-[72px] flex-none items-center gap-3 border-b border-rubi-gold/15 px-4"
          title="Dashboard"
        >
          <img
            src={logo.url}
            alt="RubinOT Hunt Tracker"
            className="h-10 w-10 flex-none object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.25)]"
          />
          <span className={"min-w-0 whitespace-nowrap leading-tight " + fade}>
            <span className="block font-brand text-base font-bold tracking-wide text-rubi-gold">
              RubinOT
            </span>
            <span className="block text-xs font-medium text-foreground/70">Hunt Tracker</span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-2 [scrollbar-width:thin]">
          {pinned.length > 0 && (
            <>
              {title("Fixados", true)}
              <div className="space-y-0.5">{pinned.map(renderItem)}</div>
            </>
          )}
          {NAV_GROUPS.map((g) => {
            const items = NAV_ITEMS.filter((n) => n.group === g.id && !pinnedIds.includes(n.id));
            if (items.length === 0) return null;
            return (
              <div key={g.id}>
                {title(g.label)}
                <div className="space-y-0.5">{items.map(renderItem)}</div>
              </div>
            );
          })}
        </nav>

        <div className="flex-none space-y-0.5 border-t border-rubi-gold/15 py-2">
          <button
            type="button"
            onClick={onCustomize}
            title={open ? undefined : "Personalizar menu"}
            className={
              ROW +
              " w-[calc(100%-1rem)] font-medium text-foreground/70 hover:bg-white/[0.06] hover:text-foreground"
            }
          >
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <span className={"flex-1 truncate text-left " + fade}>Personalizar menu</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title={open ? undefined : "Sair"}
            className={
              ROW +
              " w-[calc(100%-1rem)] font-medium text-foreground/70 hover:bg-rubi-danger/10 hover:text-rubi-danger"
            }
          >
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center">
              <LogOut className="h-5 w-5" />
            </span>
            <span className={"flex-1 truncate text-left " + fade}>Sair</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSidebarExpanded(!fixedOpen)}
        aria-pressed={fixedOpen}
        aria-label={fixedOpen ? "Recolher menu" : "Fixar menu aberto"}
        title={fixedOpen ? "Recolher menu" : "Fixar menu aberto"}
        className={
          "absolute -right-3 top-[60px] flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-colors " +
          (fixedOpen
            ? "border-rubi-gold bg-rubi-gold text-background"
            : "border-rubi-gold/50 bg-surface text-rubi-gold hover:bg-rubi-gold hover:text-background")
        }
      >
        <ChevronRight
          className={"h-3.5 w-3.5 transition-transform " + (fixedOpen ? "rotate-180" : "")}
        />
      </button>
    </aside>
  );
}
