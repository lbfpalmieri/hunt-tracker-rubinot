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
  GitCompareArrows,
  Sparkles,
  Globe2,
  Trophy,

} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import rubinotLogo from "@/assets/rubinot-logo.png.asset.json";
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
  { to: "/tools/compare", label: "Comparar hunts", icon: GitCompareArrows },
  { to: "/tools/ranking", label: "Ranking de hunts", icon: Trophy },
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
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-2.5">
          <Link to="/dashboard" className="flex shrink-0 items-center">
            <img src={logo.url} alt="RubinOT Hunt Tracker" className="h-11 w-auto object-contain sm:h-16" />
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

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <CharacterSwitcher />
            <button
              onClick={handleSignOut}
              title={activeCharacter ? `Sair (${activeCharacter.name})` : "Sair"}
              aria-label="Sair"
              className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5">
          {nav.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex min-w-0 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium leading-tight transition-colors " +
                  (active ? "text-rubi-blue" : "text-muted-foreground")
                }
              >
                <Icon className={"h-5 w-5 " + (active ? "text-rubi-blue" : "")} />
                <span className="w-full truncate px-0.5 text-center">{n.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={
              "relative flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium leading-tight " +
              (moreActive ? "text-rubi-blue" : "text-muted-foreground")
            }
          >
            <MoreHorizontal className="h-5 w-5" />
            Mais
            {lowCount > 0 && (
              <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rubi-gold px-1 text-[10px] font-bold text-background animate-pulse">
                {lowCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile "Mais" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-popover pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto my-3 h-1 w-10 rounded-full bg-muted" />
            {moreNav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              const Icon = n.icon;
              const isImb = n.to === "/imbuements";
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMoreOpen(false)}
                  className={
                    "flex items-center gap-3 px-5 py-3.5 text-sm " +
                    (active ? "bg-rubi-blue-soft text-rubi-blue" : "text-foreground active:bg-accent")
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{n.label}</span>
                  {isImb && lowCount > 0 && (
                    <span className="rounded-full bg-rubi-gold px-1.5 py-0.5 text-[10px] font-bold text-background">
                      {lowCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-sm text-muted-foreground active:bg-accent"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 border-t border-border/60 sm:mt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:px-6 sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <img src={avatar.url} alt="Canal" className="h-10 w-10 rounded-full ring-2 ring-rubi-gold/40" />
            <div className="min-w-0">
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
