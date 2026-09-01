import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { latestPatch, formatPatchDate } from "@/lib/patches";

const dismissKey = (patchId: string) => `patch-announcement-dismissed:${patchId}`;

/**
 * Aviso único e persistente (por dispositivo) sobre o marco de balanceamento
 * mais recente — aparece em toda página autenticada até o usuário fechar.
 * Substitui os avisos pequenos que ficavam espalhados em cada tela (Ranking,
 * Comparar hunts, Meu rendimento, Dashboard); aquelas telas continuam
 * filtrando dados de antes do marco por padrão, mas sem repetir a explicação
 * inteira — ela mora só aqui agora.
 */
export function PatchAnnouncementBanner() {
  const patch = latestPatch();
  const [dismissed, setDismissed] = useState(true); // começa fechado até checar o localStorage, evita flash

  useEffect(() => {
    if (!patch) return;
    try {
      setDismissed(localStorage.getItem(dismissKey(patch.id)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [patch]);

  if (!patch || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey(patch.id), "1");
    } catch {
      // localStorage indisponível (ex.: aba privada) — só fecha na sessão atual.
    }
  };

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
          </div>
          <button
            type="button"
            onClick={close}
            title="Não mostrar de novo"
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
