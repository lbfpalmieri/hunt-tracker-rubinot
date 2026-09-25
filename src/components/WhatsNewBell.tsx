import { useEffect, useRef } from "react";
import { Megaphone, Sparkles } from "lucide-react";
import { latestPatch, formatPatchDate } from "@/lib/patches";
import { usePatchAnnouncementState, openPatchAnnouncement } from "@/lib/patch-announcement";
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
  const patch = latestPatch();
  const patchReady = usePatchAnnouncementState((s) => s.ready);
  const patchDismissed = usePatchAnnouncementState((s) => s.dismissed);
  const patchOpen = usePatchAnnouncementState((s) => s.open);

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
  // Só no celular: lá o sino de aviso de balanceamento não existe, então a bolinha dele vem pra cá.
  const patchDot = !!patch && patchReady && !patchDismissed && !patchOpen;

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
        {(unseen || patchDot) && !open && (
          <span
            className={
              "absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rubi-gold shadow-glow-gold " +
              (unseen ? "" : "lg:hidden")
            }
          />
        )}
      </button>

      {open && (
        // No celular o sino fica no meio do header: `absolute right-0` empurrava o painel pra fora
        // da tela. Aqui ele ocupa a largura toda (o header, por ter backdrop-blur, é o referencial do `fixed`).
        <div className="fixed inset-x-3 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:w-80">
          <div className="border-b border-border/60 px-4 py-2.5 text-sm font-semibold">
            Novidades
          </div>
          {patch && patchReady && (
            <button
              type="button"
              onClick={() => {
                closeWhatsNewPanel();
                openPatchAnnouncement();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex w-full items-start gap-3 border-b border-border/60 bg-rubi-gold/10 px-4 py-3 text-left hover:bg-rubi-gold/15 lg:hidden"
            >
              <Megaphone className="mt-0.5 h-4 w-4 flex-none text-rubi-gold" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-rubi-gold">
                  Aviso: {patch.label} ({formatPatchDate(patch)})
                </span>
                <span className="block text-xs text-muted-foreground">
                  Ajuste na economia do RubinOT — toque para ler
                </span>
              </span>
            </button>
          )}
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
