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
  Gauge,
  BookmarkCheck,
  Users,
  Coins,
  Link2,
  BookOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import rubinotLogo from "@/assets/rubinot-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import { CharacterSwitcher } from "./CharacterSwitcher";
import { PatchAnnouncementBanner } from "./PatchAnnouncementBanner";
import { PatchAnnouncementBell } from "./PatchAnnouncementBell";
import { WhatsNewBell } from "./WhatsNewBell";
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
  { to: "/rendimento", label: "Meu rendimento", icon: Gauge },
  { to: "/overview", label: "Todos os personagens", icon: Users },
  { to: "/imbuements", label: "Imbuements", icon: Sparkles },
  { to: "/tools/monster-calculator", label: "Calculadora de monstros/h", icon: Calculator },
  { to: "/tools/compare", label: "Comparar hunts", icon: GitCompareArrows },
  { to: "/tools/ranking", label: "Ranking de hunts", icon: Trophy },
  { to: "/tools/comparisons", label: "Comparações salvas", icon: BookmarkCheck },
  { to: "/tools/rubini-coins", label: "Calculadora de Rubini Coins", icon: Coins },
  { to: "/tools/linked-tasks", label: "Linked Tasks", icon: Link2 },
  { to: "/wiki", label: "Wiki", icon: BookOpen },
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
    if (!window.matchMedia("(min-width: 1280px)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen || window.matchMedia("(min-width: 1280px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
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
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-2.5 xl:flex">
          <Link to="/dashboard" className="flex shrink-0 items-center">
            <img
              src={logo.url}
              alt="RubinOT Hunt Tracker"
              className="h-9 w-auto max-w-[8.5rem] object-contain sm:h-14 sm:max-w-none md:h-16"
            />
          </Link>


          <nav className="ml-4 hidden items-center gap-1 xl:flex">
            {nav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={
                    "inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
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
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={
                  "relative inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
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

          <div className="ml-auto flex min-w-0 items-center justify-end gap-1 sm:gap-2">
            <PatchAnnouncementBell />
            <WhatsNewBell />
            <Link
              to="/wiki"
              title="Wiki"
              className="hidden flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <BookOpen className="h-4 w-4 flex-none text-rubi-gold" />
              <span className="hidden md:inline">Wiki</span>
            </Link>
            <CharacterSwitcher />
            <button
              onClick={handleSignOut}
              title={activeCharacter ? `Sair (${activeCharacter.name})` : "Sair"}
              aria-label="Sair"
                className="hidden flex-none items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground xl:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <PatchAnnouncementBanner />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 xl:pb-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl xl:hidden">
        <div className="grid grid-cols-5">
          {nav.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                    "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium leading-tight transition-colors " +
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
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={
               "relative flex min-h-12 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium leading-tight " +
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
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Mais opções">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[min(88dvh,46rem)] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-popover pb-[env(safe-area-inset-bottom)] shadow-2xl">
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
                     "flex min-h-12 items-center gap-3 px-5 py-3 text-sm " +
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
               className="flex min-h-12 w-full items-center gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground active:bg-accent"
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
