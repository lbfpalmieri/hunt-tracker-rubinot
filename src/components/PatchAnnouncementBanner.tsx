import { useEffect } from "react";
import { Megaphone, X, Check } from "lucide-react";
import { latestPatch, formatPatchDate } from "@/lib/patches";
import {
  usePatchAnnouncementState,
  initPatchAnnouncement,
  closePatchAnnouncement,
  dismissPatchAnnouncementForever,
} from "@/lib/patch-announcement";

/**
 * Aviso sobre o marco de balanceamento mais recente. Fechar (X) só recolhe
 * pro sino no header (PatchAnnouncementBell) — continua reabrível a
 * qualquer momento. Só "Não quero mais ver" apaga de vez (e some o sino
 * também). Ver [[PatchAnnouncementBell]] / lib/patch-announcement.ts.
 */
export function PatchAnnouncementBanner() {
  const patch = latestPatch();
  const ready = usePatchAnnouncementState((s) => s.ready);
  const dismissed = usePatchAnnouncementState((s) => s.dismissed);
  const open = usePatchAnnouncementState((s) => s.open);

  useEffect(() => {
    initPatchAnnouncement();
  }, []);

  if (!patch || !ready || dismissed || !open) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
      <div className="animate-notice-in relative overflow-hidden rounded-2xl border border-rubi-gold/50 bg-gradient-to-br from-rubi-gold/15 via-surface to-rubi-blue/15 shadow-glow-gold">
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rubi-gold/15 text-rubi-gold">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-rubi-gold">
              Ajuste na economia do RubinOT — {patch.label} ({formatPatchDate(patch)})
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{patch.announcement}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={dismissPatchAnnouncementForever}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 px-3 py-1.5 text-xs font-semibold text-rubi-gold transition-colors hover:bg-rubi-gold/20"
              >
                <Check className="h-3.5 w-3.5" /> Não quero mais ver, entendi o aviso
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={closePatchAnnouncement}
            title="Fechar (continua disponível no sino de avisos, no topo)"
            aria-label="Fechar aviso"
            className="flex-none rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
