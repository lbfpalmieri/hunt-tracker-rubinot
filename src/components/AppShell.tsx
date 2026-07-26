import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Swords,
  ScrollText,
  UserCircle2,
  Info,
  LogOut,
  MoreHorizontal,
  Calculator,
  Sparkles,
  Globe2,

} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import { CharacterSwitcher } from "./CharacterSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/lib/store";
import { useLowImbuements, useLowImbuementToasts } from "@/lib/use-low-imbuements";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/import", label: "Nova sessão", icon: Swords },
  { to: "/sessions", label: "Sessões", icon: ScrollText },
  { to: "/community", label: "Comunidade", icon: Globe2 },
] as const;

const moreNav = [
  { to: "/imbuements", label: "Imbuements", icon: Sparkles },
  { to: "/tools/monster-calculator", label: "Calculadora de monstros/h", icon: Calculator },
  { to: "/characters", label: "Personagens", icon: UserCircle2 },
  { to: "/about", label: "Sobre", icon: Info },
] as const;



export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const reset = useAppStore((s) => s.reset);
  const activeCharacterId = useAppStore((s) => s.activeCharacterId);
  const characters = useAppStore((s) => s.characters);
  const activeCharacter = characters.find((c) => c.id === activeCharacterId) ?? null;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const lowImbuements = useLowImbuements(activeCharacterId);
  useLowImbuementToasts(lowImbuements);
  const lowCount = lowImbuements.length;

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = moreNav.some((n) => pathname === n.to || pathname.startsWith(n.to + "/"));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    reset();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo.url} alt="Hunt Tracker" className="h-9 w-9 object-contain" />
            <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
              Hunt Tracker
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
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

            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={
                  "relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (moreActive
                    ? "bg-rubi-blue-soft text-rubi-blue"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground")
                }
              >
                <MoreHorizontal className="h-4 w-4" />
                Mais
                {lowCount > 0 && (
                  <span
                    title={`${lowCount} imbuement(s) prestes a expirar`}
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rubi-gold px-1 text-[10px] font-bold text-background shadow-glow-blue animate-pulse"
                  >
                    {lowCount}
                  </span>
                )}
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                  {moreNav.map((n) => {
                    const active = pathname === n.to || pathname.startsWith(n.to + "/");
                    const Icon = n.icon;
                    const isImb = n.to === "/imbuements";
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={
                          "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors " +
                          (active
                            ? "bg-rubi-blue-soft text-rubi-blue"
                            : "text-foreground hover:bg-accent")
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{n.label}</span>
                        {isImb && lowCount > 0 && (
                          <span className="rounded-full bg-rubi-gold px-1.5 py-0.5 text-[10px] font-bold text-background">
                            {lowCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <CharacterSwitcher />
            <button
              onClick={handleSignOut}
              title={activeCharacter ? `Sair (${activeCharacter.name})` : "Sair"}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {[...nav, ...moreNav].map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
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
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:px-6 sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <img src={avatar.url} alt="Canal" className="h-10 w-10 rounded-full ring-2 ring-rubi-gold/40" />
            <div>
              <div className="font-semibold text-foreground">@Ésobrerubinot</div>
              <div className="text-xs">Desenvolvido pelo canal É sobre RubinOT</div>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={rubinotLogo.url} alt="RubinOT" className="h-10 w-auto opacity-90" />
          </div>
          <div className="text-xs sm:text-right">
            {activeCharacter ? <>Conectado como <b className="text-foreground">{activeCharacter.name}</b></> : "Feito para a comunidade RubinOT"}
          </div>
        </div>
      </footer>

    </div>
  );
}
