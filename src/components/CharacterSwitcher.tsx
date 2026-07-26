import { Link } from "@tanstack/react-router";
import { ChevronDown, Plus, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useAppStore, useHydrated } from "@/lib/store";

export function CharacterSwitcher() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const setActive = useAppStore((s) => s.setActive);
  const [open, setOpen] = useState(false);

  const active = characters.find((c) => c.id === activeId) ?? null;

  if (!hydrated) {
    return <div className="h-9 w-40 animate-pulse rounded-lg bg-muted/40" />;
  }

  if (characters.length === 0) {
    return (
      <Link
        to="/characters"
        className="inline-flex items-center gap-2 rounded-lg bg-rubi-gold px-3 py-2 text-sm font-semibold text-background hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Adicionar personagem
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm font-medium hover:bg-accent sm:gap-2 sm:px-3"
      >
        <UserCircle2 className="h-4 w-4 shrink-0 text-rubi-blue" />
        <span className="max-w-[92px] truncate sm:max-w-[140px]">{active?.name ?? "Selecionar"}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
            <div className="max-h-72 overflow-y-auto py-1">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActive(c.id);
                    setOpen(false);
                  }}
                  className={
                    "flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent " +
                    (c.id === activeId ? "bg-rubi-blue-soft" : "")
                  }
                >
                  <UserCircle2 className="mt-0.5 h-5 w-5 text-rubi-blue" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.vocation} · {c.world}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Link
              to="/characters"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm font-medium text-rubi-gold hover:bg-accent"
            >
              <Plus className="h-4 w-4" /> Gerenciar personagens
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
