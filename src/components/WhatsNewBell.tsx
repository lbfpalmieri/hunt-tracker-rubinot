import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { WHATS_NEW, formatWhatsNewDate } from "@/lib/whats-new";
import {
  useWhatsNewAnnouncementState,
  initWhatsNewAnnouncement,
  toggleWhatsNewPanel,
  closeWhatsNewPanel,
  hasUnseenWhatsNew,
} from "@/lib/whats-new-announcement";

/** Sino "Novidades" no header — lista as últimas atualizações do app (não é changelog
 * técnico, é o que mudou pro jogador). Abrir marca a mais recente como vista. */
export function WhatsNewBell() {
  const ready = useWhatsNewAnnouncementState((s) => s.ready);
  const open = useWhatsNewAnnouncementState((s) => s.open);
  const seenId = useWhatsNewAnnouncementState((s) => s.seenId);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initWhatsNewAnnouncement();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeWhatsNewPanel();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unseen = ready && hasUnseenWhatsNew(seenId);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleWhatsNewPanel}
        title="Novidades"
        aria-label="Novidades"
        aria-expanded={open}
        aria-haspopup="menu"
        className={
          "relative flex h-10 w-10 flex-none items-center justify-center rounded-lg transition-colors sm:h-11 sm:w-11 " +
          (open
            ? "bg-rubi-gold-soft text-rubi-gold"
            : "text-muted-foreground hover:bg-accent hover:text-foreground")
        }
      >
        <Sparkles className="h-4 w-4" />
        {unseen && !open && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rubi-gold shadow-glow-gold" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="border-b border-border/60 px-4 py-2.5 text-sm font-semibold">
            Novidades
          </div>
          <div className="max-h-96 overflow-y-auto">
            {WHATS_NEW.map((entry) => (
              <div key={entry.id} className="border-b border-border/40 px-4 py-3 last:border-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-sm font-semibold">{entry.title}</span>
                  <span className="flex-none text-[11px] text-muted-foreground">
                    {formatWhatsNewDate(entry)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
