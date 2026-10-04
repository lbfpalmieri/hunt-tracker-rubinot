import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Beer, Compass, Info, LogIn, Scale, Sparkles } from "lucide-react";
import logo from "@/assets/dragon-logo.png.asset.json";
import { AppShell } from "@/components/AppShell";
import { PlayModeSwitch } from "@/components/PlayModeSwitch";
import { initNavPrefs } from "@/lib/nav-prefs";
import { useAppStore } from "@/lib/store";
import { useAuthState } from "@/lib/use-auth-state";

/**
 * Casca das páginas PÚBLICAS (Comunidade, Comparar hunts, Sobre): com conta logada é o app normal
 * (AppShell, e carrega os dados como o layout _authenticated faz); sem conta é o modo VISITANTE —
 * cabeçalho simples, só essas páginas, e o convite pra entrar com Google. É a vitrine do app.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const auth = useAuthState();
  const loaded = useAppStore((s) => s.loaded);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    if (auth === "in" && !loaded && !loading) void loadAll().catch(() => {});
  }, [auth, loaded, loading, loadAll]);

  if (auth === "loading") return <div className="min-h-screen bg-background" />;
  if (auth === "in") return <AppShell>{children}</AppShell>;
  return <VisitorShell>{children}</VisitorShell>;
}

const VISITOR_NAV = [
  { to: "/community", label: "Comunidade", icon: Beer },
  { to: "/tools/hunt-advisor", label: "Hunt Advisor", icon: Compass },
  { to: "/tools/compare", label: "Comparar hunts", icon: Scale },
  { to: "/about", label: "Sobre", icon: Info },
] as const;

function VisitorShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    initNavPrefs();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
          <Link to="/" className="flex flex-none items-center">
            <img
              src={logo.url}
              alt="RubinOT Hunt Tracker"
              className="h-9 w-auto max-w-[7rem] object-contain sm:h-12 sm:max-w-none"
            />
          </Link>
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {VISITOR_NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  className={
                    "inline-flex flex-none items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-rubi-blue-soft text-rubi-blue"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground")
                  }
                >
                  <Icon className="h-4 w-4 flex-none" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <PlayModeSwitch />
          <Link
            to="/auth"
            className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-rubi-gold px-3 py-2 text-sm font-semibold text-background shadow-glow-gold hover:opacity-90"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar com Google</span>
            <span className="sm:hidden">Entrar</span>
          </Link>
        </div>
      </header>

      <div className="border-b border-rubi-gold/25 bg-rubi-gold/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs sm:px-6">
          <Sparkles className="h-3.5 w-3.5 flex-none text-rubi-gold" />
          <span className="text-muted-foreground">
            Você está como <b className="text-foreground">visitante</b>: dá pra pesquisar, ver as
            hunts e exportar o analyser. Pra registrar e comparar as <b>suas</b> hunts,
          </span>
          <Link to="/auth" className="font-semibold text-rubi-gold hover:underline">
            crie sua conta com o Google →
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mt-12 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <span>RubinOT Hunt Tracker · feito pelo canal É sobre RubinOT</span>
          <Link to="/auth" className="font-semibold text-rubi-gold hover:underline">
            Entrar com Google
          </Link>
        </div>
      </footer>
    </div>
  );
}
