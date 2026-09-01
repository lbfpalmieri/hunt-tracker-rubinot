import { Bell } from "lucide-react";
import { latestPatch, formatPatchDate } from "@/lib/patches";
import { usePatchAnnouncementState, togglePatchAnnouncement } from "@/lib/patch-announcement";

/** Sino no header — só existe enquanto o aviso do marco mais recente não foi dispensado de vez. */
export function PatchAnnouncementBell() {
  const patch = latestPatch();
  const ready = usePatchAnnouncementState((s) => s.ready);
  const dismissed = usePatchAnnouncementState((s) => s.dismissed);
  const open = usePatchAnnouncementState((s) => s.open);

  if (!patch || !ready || dismissed) return null;

  return (
    <button
      type="button"
      onClick={togglePatchAnnouncement}
      title={`Aviso: ${patch.label} (${formatPatchDate(patch)})`}
      aria-label="Ver aviso de balanceamento"
      className={
        "relative flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-colors " +
        (open ? "bg-rubi-gold-soft text-rubi-gold" : "text-muted-foreground hover:bg-accent hover:text-foreground")
      }
    >
      <Bell className="h-4 w-4" />
      {!open && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rubi-gold shadow-glow-gold" />
      )}
    </button>
  );
}
