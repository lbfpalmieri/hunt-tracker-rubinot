import { create } from "zustand";
import { latestPatch } from "./patches";

const dismissKey = (patchId: string) => `patch-announcement-dismissed:${patchId}`;
const seenKey = (patchId: string) => `patch-announcement-seen:${patchId}`;

interface PatchAnnouncementState {
  /** Já leu localStorage nessa sessão de página? Evita flash antes de saber o estado real. */
  ready: boolean;
  /** Permanente — usuário clicou "Não quero mais ver". Some o aviso E o sino. */
  dismissed: boolean;
  /** Banner grande visível agora (o sino sempre fica, contanto que !dismissed). */
  open: boolean;
}

const useStore = create<PatchAnnouncementState>(() => ({
  ready: false,
  dismissed: false,
  open: false,
}));

export const usePatchAnnouncementState = useStore;

/** Lê o localStorage e decide se o banner abre sozinho (primeira vez) ou fica só no sino. */
export function initPatchAnnouncement() {
  const patch = latestPatch();
  if (!patch) {
    useStore.setState({ ready: true, dismissed: false, open: false });
    return;
  }
  let dismissed = false;
  let seen = false;
  try {
    dismissed = localStorage.getItem(dismissKey(patch.id)) === "1";
    seen = localStorage.getItem(seenKey(patch.id)) === "1";
  } catch {
    // localStorage indisponível (ex.: aba privada) — trata como não visto ainda.
  }
  useStore.setState({ ready: true, dismissed, open: !dismissed && !seen });
}

/** Fecha o banner mas mantém o sino pra reabrir depois — não é dismissal permanente. */
export function closePatchAnnouncement() {
  const patch = latestPatch();
  useStore.setState({ open: false });
  if (!patch) return;
  try {
    localStorage.setItem(seenKey(patch.id), "1");
  } catch {
    // ok, só não persiste — reabre automático na próxima visita.
  }
}

export function togglePatchAnnouncement() {
  useStore.setState((s) => ({ open: !s.open }));
}

/** "Não quero mais ver, entendi o aviso" — permanente, some o sino também. */
export function dismissPatchAnnouncementForever() {
  const patch = latestPatch();
  useStore.setState({ open: false, dismissed: true });
  if (!patch) return;
  try {
    localStorage.setItem(dismissKey(patch.id), "1");
  } catch {
    // sem localStorage, fica só nessa sessão.
  }
}
