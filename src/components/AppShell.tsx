import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, ScrollText, UserCircle2, Info } from "lucide-react";
import logo from "@/assets/rubinot-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import { CharacterSwitcher } from "./CharacterSwitcher";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/import", label: "Importar", icon: Upload },
  { to: "/sessions", label: "Sessões", icon: ScrollText },
  { to: "/characters", label: "Personagens", icon: UserCircle2 },
  { to: "/about", label: "Sobre", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="RubinOT" className="h-9 w-auto" />
            <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
              Hunt Tracker
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-rubi-blue-soft text-rubi-blue"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto">
            <CharacterSwitcher />
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "inline-flex flex-none items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium " +
                  (active
                    ? "bg-rubi-blue-soft text-rubi-blue"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="mt-16 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-3">
            <img src={avatar.url} alt="Canal" className="h-10 w-10 rounded-full ring-2 ring-rubi-gold/40" />
            <div>
              <div className="font-semibold text-foreground">@Ésobrerubinot</div>
              <div className="text-xs">Desenvolvido pelo canal É sobre RubinOT</div>
            </div>
          </div>
          <div className="text-xs">
            Feito para a comunidade RubinOT · Dados salvos apenas no seu navegador
          </div>
        </div>
      </footer>
    </div>
  );
}
