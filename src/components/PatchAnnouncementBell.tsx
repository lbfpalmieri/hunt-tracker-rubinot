import { Bell } from "lucide-react";
import { latestPatch, formatPatchDate } from "@/lib/patches";
import { usePatchAnnouncementState, togglePatchAnnouncement } from "@/lib/patch-announcement";

/** No celular/tablet (<lg) este sino some: o aviso vira uma linha dentro do painel do sino
 * de Novidades (WhatsNewBell), pra caber um sino só no header. Sino no header — fica fixo mesmo depois de "Não quero mais ver" (só a bolinha de novo
 * some), pra quem dispensou sem querer ou mudar de ideia ainda conseguir abrir o aviso. */
export function PatchAnnouncementBell() {
  const patch = latestPatch();
  const ready = usePatchAnnouncementState((s) => s.ready);
  const dismissed = usePatchAnnouncementState((s) => s.dismissed);
  const open = usePatchAnnouncementState((s) => s.open);

  if (!patch || !ready) return null;

  return (
    <button
      type="button"
      onClick={togglePatchAnnouncement}
      title={`Aviso: ${patch.label} (${formatPatchDate(patch)})`}
      aria-label="Ver aviso de balanceamento"
      className={
        "relative hidden h-11 w-11 flex-none items-center justify-center rounded-lg transition-colors lg:flex " +
        (open ? "bg-rubi-gold-soft text-rubi-gold" : "text-muted-foreground hover:bg-accent hover:text-foreground")
      }
    >
      <Bell className="h-4 w-4" />
      {!dismissed && !open && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rubi-gold shadow-glow-gold" />
      )}
    </button>
  );
}
