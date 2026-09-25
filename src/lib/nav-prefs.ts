import { create } from "zustand";
import { DEFAULT_PINNED, NAV_ITEMS } from "./nav-items";

/**
 * Preferências do menu, por navegador (localStorage — sem banco): quais itens o usuário fixou
 * no topo (e em que ordem) e se o menu lateral fica sempre aberto. Item novo que aparecer no
 * app cai sozinho no grupo dele; ids que não existem mais são descartados na leitura.
 */
const KEY = "nav-prefs-v1";
const KNOWN = new Set<string>(NAV_ITEMS.map((n) => n.id));

interface NavPrefsState {
  /** Já leu o localStorage? Antes disso vale o padrão (evita piscar). */
  ready: boolean;
  pinned: string[];
  /** Menu lateral fixado aberto (desktop). Falso = recolhido, expande ao passar o mouse. */
  expanded: boolean;
}

export const useNavPrefs = create<NavPrefsState>(() => ({
  ready: false,
  pinned: [...DEFAULT_PINNED],
  expanded: false,
}));

function persist() {
  const { pinned, expanded } = useNavPrefs.getState();
  try {
    localStorage.setItem(KEY, JSON.stringify({ pinned, expanded }));
  } catch {
    // sem localStorage (aba privada): vale só nesta sessão.
  }
}

export function initNavPrefs() {
  if (useNavPrefs.getState().ready) return;
  let pinned = [...DEFAULT_PINNED];
  let expanded = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { pinned?: unknown; expanded?: unknown };
      if (Array.isArray(parsed.pinned)) {
        pinned = [
          ...new Set(
            parsed.pinned.filter((id): id is string => typeof id === "string" && KNOWN.has(id)),
          ),
        ];
      }
      expanded = parsed.expanded === true;
    }
  } catch {
    // JSON quebrado ou storage bloqueado: volta pro padrão.
  }
  useNavPrefs.setState({ ready: true, pinned, expanded });
}

export function setSidebarExpanded(expanded: boolean) {
  useNavPrefs.setState({ expanded });
  persist();
}

export function togglePinned(id: string) {
  useNavPrefs.setState((s) => ({
    pinned: s.pinned.includes(id) ? s.pinned.filter((p) => p !== id) : [...s.pinned, id],
  }));
  persist();
}

export function movePinned(id: string, dir: -1 | 1) {
  useNavPrefs.setState((s) => {
    const i = s.pinned.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= s.pinned.length) return s;
    const next = [...s.pinned];
    [next[i], next[j]] = [next[j], next[i]];
    return { pinned: next };
  });
  persist();
}

export function resetNavPrefs() {
  useNavPrefs.setState({ pinned: [...DEFAULT_PINNED] });
  persist();
}
