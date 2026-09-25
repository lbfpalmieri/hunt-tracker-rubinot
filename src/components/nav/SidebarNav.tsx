import { Link } from "@tanstack/react-router";
import { ChevronRight, LogOut, Pin, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import { NAV_GROUPS, NAV_ITEMS, findNavItem, isNavActive, type NavItem } from "@/lib/nav-items";
import { setSidebarExpanded, useNavPrefs } from "@/lib/nav-prefs";

const ROW =
  "relative mx-2.5 flex h-10 items-center gap-3 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors";

interface Props {
  pathname: string;
  lowCount: number;
  onCustomize: () => void;
  onSignOut: () => void;
}

/**
 * Menu lateral do desktop (≥1024px). Recolhido = trilho de 64px só com ícones; ao passar o
 * mouse (ou tabular) abre por cima do conteúdo; o botão na borda fixa aberto e empurra a página
 * (AppShell lê `expanded` pra abrir espaço). Fixados do usuário ficam no topo.
 */
export function SidebarNav({ pathname, lowCount, onCustomize, onSignOut }: Props) {
  const pinnedIds = useNavPrefs((s) => s.pinned);
  const fixedOpen = useNavPrefs((s) => s.expanded);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const open = fixedOpen || hover || focus;

  const pinned = pinnedIds.map(findNavItem).filter((n): n is NavItem => !!n);

  const renderItem = (n: NavItem) => {
    const active = isNavActive(pathname, n.to);
    const Icon = n.icon;
    const badge = n.id === "imbuements" && lowCount > 0 ? lowCount : 0;
    return (
      <Link
        key={n.id}
        to={n.to}
        title={open ? undefined : n.label}
        className={
          ROW +
          " " +
          (active
            ? "bg-rubi-blue-soft text-rubi-blue"
            : "text-muted-foreground hover:bg-accent hover:text-foreground")
        }
      >
        {active && (
          <span className="absolute -left-2.5 bottom-2 top-2 w-[3px] rounded-r-full bg-rubi-gold" />
        )}
        <Icon className="h-5 w-5 flex-none" />
        <span
          className={
            "flex-1 truncate transition-opacity duration-150 " +
            (open ? "opacity-100" : "opacity-0")
          }
        >
          {n.label}
        </span>
        {badge > 0 &&
          (open ? (
            <span className="rounded-full bg-rubi-gold px-1.5 py-0.5 text-[10px] font-bold text-background">
              {badge}
            </span>
          ) : (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rubi-gold px-1 text-[10px] font-bold text-background">
              {badge}
            </span>
          ))}
      </Link>
    );
  };

  const title = (label: string, icon?: boolean) =>
    open ? (
      <div className="flex items-center gap-1.5 whitespace-nowrap px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-rubi-gold/85">
        {icon && <Pin className="h-3 w-3" />}
        {label}
      </div>
    ) : (
      <div className="mx-5 my-3 h-px bg-border" />
    );

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => setFocus(e.target.matches(":focus-visible"))}
      onBlur={() => setFocus(false)}
      aria-label="Menu principal"
      className={
        "fixed inset-y-0 left-0 z-40 hidden border-r border-rubi-gold/30 bg-surface/95 backdrop-blur-xl transition-[width,box-shadow] duration-200 lg:block " +
        (open ? "w-72" : "w-16") +
        (open && !fixedOpen ? " shadow-[12px_0_40px_-12px_rgba(0,0,0,0.7)]" : "")
      }
    >
      <div className="flex h-full flex-col overflow-hidden">
        <Link
          to="/dashboard"
          className="flex h-[72px] flex-none items-center gap-3 px-3.5"
          title="Dashboard"
        >
          <img
            src={logo.url}
            alt="RubinOT Hunt Tracker"
            className="h-9 w-9 flex-none object-contain"
          />
          <span
            className={
              "min-w-0 whitespace-nowrap font-display leading-tight transition-opacity duration-150 " +
              (open ? "opacity-100" : "opacity-0")
            }
          >
            <span className="block text-sm font-bold text-foreground">RubinOT</span>
            <span className="block text-xs text-muted-foreground">Hunt Tracker</span>
          </span>
        </Link>

        <div className="flex-none px-4 pb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-rubi-gold/70">
          <span className="whitespace-nowrap">{open ? "Menu de navegação" : "Menu"}</span>
        </div>

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

        <div className="flex-none space-y-0.5 border-t border-border py-2">
          <button
            type="button"
            onClick={onCustomize}
            title={open ? undefined : "Personalizar menu"}
            className={
              ROW +
              " w-[calc(100%-1.25rem)] text-muted-foreground hover:bg-accent hover:text-foreground"
            }
          >
            <SlidersHorizontal className="h-5 w-5 flex-none" />
            <span
              className={
                "flex-1 truncate text-left transition-opacity duration-150 " +
                (open ? "opacity-100" : "opacity-0")
              }
            >
              Personalizar menu
            </span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title={open ? undefined : "Sair"}
            className={
              ROW +
              " w-[calc(100%-1.25rem)] text-muted-foreground hover:bg-accent hover:text-foreground"
            }
          >
            <LogOut className="h-5 w-5 flex-none" />
            <span
              className={
                "flex-1 truncate text-left transition-opacity duration-150 " +
                (open ? "opacity-100" : "opacity-0")
              }
            >
              Sair
            </span>
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
