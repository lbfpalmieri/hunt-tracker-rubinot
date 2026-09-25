import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import rubinotLogo from "@/assets/rubinot-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import { CharacterSwitcher } from "./CharacterSwitcher";
import { MobileNav } from "./nav/MobileNav";
import { NavCustomizeDialog } from "./nav/NavCustomizeDialog";
import { SidebarNav } from "./nav/SidebarNav";
import { PatchAnnouncementBanner } from "./PatchAnnouncementBanner";
import { PatchAnnouncementBell } from "./PatchAnnouncementBell";
import { WhatsNewBell } from "./WhatsNewBell";
import { supabase } from "@/integrations/supabase/client";
import { NAV_GROUPS, navItemForPath } from "@/lib/nav-items";
import { initNavPrefs, useNavPrefs } from "@/lib/nav-prefs";
import { useAppStore } from "@/lib/store";
import { useLowImbuements, useLowImbuementToasts } from "@/lib/use-low-imbuements";
import type { ReactNode } from "react";

// Itens do menu: src/lib/nav-items.ts (fonte única). Menu lateral no desktop (≥1024px),
// barra de baixo + folha "Menu" abaixo disso.

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const reset = useAppStore((s) => s.reset);
  const activeCharacterId = useAppStore((s) => s.activeCharacterId);
  const characters = useAppStore((s) => s.characters);
  const activeCharacter = characters.find((c) => c.id === activeCharacterId) ?? null;
  const sidebarFixed = useNavPrefs((s) => s.expanded);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const lowImbuements = useLowImbuements(activeCharacterId);
  useLowImbuementToasts(lowImbuements);
  const lowCount = lowImbuements.length;

  useEffect(() => {
    initNavPrefs();
  }, []);

  useEffect(() => {
    if (!menuOpen || window.matchMedia("(min-width: 1024px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    reset();
    navigate({ to: "/auth", replace: true });
  };

  const openCustomize = () => {
    setMenuOpen(false);
    setCustomizeOpen(true);
  };

  const current = navItemForPath(pathname);
  const currentGroup = current ? NAV_GROUPS.find((g) => g.id === current.group) : null;

  return (
    <div
      className={
        "min-h-screen transition-[padding] duration-200 " + (sidebarFixed ? "lg:pl-72" : "lg:pl-16")
      }
    >
      <SidebarNav
        pathname={pathname}
        lowCount={lowCount}
        onCustomize={openCustomize}
        onSignOut={handleSignOut}
      />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-2.5">
          <Link to="/dashboard" className="flex shrink-0 items-center lg:hidden">
            <img
              src={logo.url}
              alt="RubinOT Hunt Tracker"
              className="h-9 w-auto max-w-[8.5rem] object-contain sm:h-14 sm:max-w-none md:h-16"
            />
          </Link>

          <div className="hidden min-w-0 lg:block">
            {currentGroup && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rubi-gold/85">
                {currentGroup.label}
              </div>
            )}
            <div className="truncate font-display text-lg font-bold leading-tight">
              {current?.label ?? "RubinOT"}
            </div>
          </div>

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
          </div>
        </div>
      </header>

      <PatchAnnouncementBanner />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:pb-8">{children}</main>

      <MobileNav
        pathname={pathname}
        lowCount={lowCount}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onCustomize={openCustomize}
        onSignOut={handleSignOut}
      />

      <NavCustomizeDialog open={customizeOpen} onOpenChange={setCustomizeOpen} />

      <footer className="mt-12 border-t border-border/60 sm:mt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:px-6 sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <img
              src={avatar.url}
              alt="Canal"
              className="h-10 w-10 rounded-full ring-2 ring-rubi-gold/40"
            />
            <div className="min-w-0">
              <div className="font-semibold text-foreground">@Ésobrerubinot</div>
              <div className="text-xs">Desenvolvido pelo canal É sobre RubinOT</div>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={rubinotLogo.url} alt="RubinOT" className="h-10 w-auto opacity-90" />
          </div>
          <div className="text-xs sm:text-right">
            {activeCharacter ? (
              <>
                Conectado como <b className="text-foreground">{activeCharacter.name}</b>
              </>
            ) : (
              "Feito para a comunidade RubinOT"
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
