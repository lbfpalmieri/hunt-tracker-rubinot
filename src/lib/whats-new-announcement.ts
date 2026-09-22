import { create } from "zustand";
import { latestWhatsNew } from "./whats-new";

const SEEN_KEY = "whats-new-seen-id";

interface WhatsNewAnnouncementState {
  /** Já leu localStorage nessa sessão de página? Evita flash antes de saber o estado real. */
  ready: boolean;
  open: boolean;
  seenId: string | null;
}

const useStore = create<WhatsNewAnnouncementState>(() => ({
  ready: false,
  open: false,
  seenId: null,
}));

export const useWhatsNewAnnouncementState = useStore;

export function initWhatsNewAnnouncement() {
  let seenId: string | null = null;
  try {
    seenId = localStorage.getItem(SEEN_KEY);
  } catch {
    // localStorage indisponível (ex.: aba privada) — trata como nunca visto.
  }
  useStore.setState({ ready: true, seenId });
}

function markWhatsNewSeen() {
  const latest = latestWhatsNew();
  if (!latest) return;
  useStore.setState({ seenId: latest.id });
  try {
    localStorage.setItem(SEEN_KEY, latest.id);
  } catch {
    // sem persistência — a bolinha volta a aparecer na próxima visita, sem drama.
  }
}

/** Abrir o painel também marca a mais nova como vista (some a bolinha). */
export function toggleWhatsNewPanel() {
  useStore.setState((s) => {
    const open = !s.open;
    if (open) markWhatsNewSeen();
    return { open };
  });
}

export function closeWhatsNewPanel() {
  useStore.setState({ open: false });
}

export function hasUnseenWhatsNew(seenId: string | null): boolean {
  const latest = latestWhatsNew();
  return !!latest && latest.id !== seenId;
}
