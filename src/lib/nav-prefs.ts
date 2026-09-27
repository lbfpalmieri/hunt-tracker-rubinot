import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PINNED, NAV_ITEMS } from "./nav-items";

/**
 * Preferências do menu: quais itens o usuário fixou no topo (e em que ordem) e se o menu lateral
 * fica sempre aberto. Fonte da verdade = tabela public.user_nav_prefs (uma linha por usuário,
 * segue a conta entre dispositivos). O localStorage é só cache pra abrir sem piscar; o banco
 * sobrescreve assim que responde. Sem a tabela (migration não aplicada) tudo continua
 * funcionando só com o cache local. Ids que não existem mais são descartados na leitura.
 * Também guarda o modo de jogo (Solo / Grupo — ver play-mode.ts), coluna play_mode.
 */
const KEY = "nav-prefs-v1";
const KNOWN = new Set<string>(NAV_ITEMS.map((n) => n.id));
const SAVE_DELAY_MS = 500;

// Tabela nova ainda não está nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type PlayMode = "solo" | "party";

interface NavPrefsState {
  /** Já leu o cache local? Antes disso vale o padrão (evita piscar). */
  ready: boolean;
  pinned: string[];
  /** Menu lateral fixado aberto (desktop). Falso = recolhido, expande ao passar o mouse. */
  expanded: boolean;
  /** Modo Solo ou Grupo: filtra as sessões e muda o visual do app inteiro. */
  mode: PlayMode;
}

export const useNavPrefs = create<NavPrefsState>(() => ({
  ready: false,
  pinned: [...DEFAULT_PINNED],
  expanded: false,
  mode: "solo",
}));

interface CachedPrefs {
  uid?: string;
  pinned: string[];
  expanded: boolean;
  mode: PlayMode;
}

const asMode = (v: unknown): PlayMode => (v === "party" ? "party" : "solo");

function clean(pinned: unknown): string[] | null {
  if (!Array.isArray(pinned)) return null;
  return [...new Set(pinned.filter((id): id is string => typeof id === "string" && KNOWN.has(id)))];
}

function readCache(): CachedPrefs | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      uid?: unknown;
      pinned?: unknown;
      expanded?: unknown;
      mode?: unknown;
    };
    const pinned = clean(parsed.pinned);
    if (!pinned) return null;
    return {
      uid: typeof parsed.uid === "string" ? parsed.uid : undefined,
      pinned,
      expanded: parsed.expanded === true,
      mode: asMode(parsed.mode),
    };
  } catch {
    return null;
  }
}

function writeCache() {
  const { pinned, expanded, mode } = useNavPrefs.getState();
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ uid: syncedUid ?? undefined, pinned, expanded, mode }),
    );
  } catch {
    // sem localStorage (aba privada): fica só no banco / nesta sessão.
  }
}

/** Usuário cujas preferências já foram puxadas do banco nesta página. */
let syncedUid: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
/** Mexeu no menu antes do banco responder? Então o que vale é o local, não o do banco. */
let changedBeforeSync = false;

async function saveToDb() {
  if (!syncedUid) return;
  const { pinned, expanded, mode } = useNavPrefs.getState();
  const row = {
    user_id: syncedUid,
    pinned,
    sidebar_expanded: expanded,
    updated_at: new Date().toISOString(),
  };
  let { error } = await db
    .from("user_nav_prefs")
    .upsert({ ...row, play_mode: mode }, { onConflict: "user_id" });
  // Coluna play_mode ainda não existe: salva o resto (o modo fica no cache local).
  if (error) ({ error } = await db.from("user_nav_prefs").upsert(row, { onConflict: "user_id" }));
  if (error) console.warn("[nav-prefs] não salvou no banco:", error.message);
}

function persist() {
  if (!syncedUid) changedBeforeSync = true;
  writeCache();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveToDb(), SAVE_DELAY_MS);
}

async function syncFromDb() {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user?.id ?? null;
  if (!uid || uid === syncedUid) return;

  const cache = readCache();
  // Cache de outra conta nesse navegador: não vaza pra esta.
  if (cache?.uid && cache.uid !== uid) {
    useNavPrefs.setState({ pinned: [...DEFAULT_PINNED], expanded: false, mode: "solo" });
  }

  const read = (cols: string) =>
    db.from("user_nav_prefs").select(cols).eq("user_id", uid).maybeSingle();
  let { data, error } = await read("pinned, sidebar_expanded, play_mode");
  const hasModeColumn = !error;
  if (error) ({ data, error } = await read("pinned, sidebar_expanded"));
  if (error) return; // tabela ainda não existe / sem rede: segue com o cache local.

  syncedUid = uid;
  if (changedBeforeSync) {
    changedBeforeSync = false;
    persist();
  } else if (data) {
    useNavPrefs.setState({
      pinned: clean(data.pinned) ?? [...DEFAULT_PINNED],
      expanded: data.sidebar_expanded === true,
      ...(hasModeColumn ? { mode: asMode(data.play_mode) } : {}),
    });
    writeCache();
  } else if (cache && (!cache.uid || cache.uid === uid)) {
    // Primeira vez com o banco: leva pra conta o que já estava personalizado neste navegador.
    persist();
  }
}

export function initNavPrefs() {
  if (!useNavPrefs.getState().ready) {
    const cache = readCache();
    useNavPrefs.setState({
      ready: true,
      pinned: cache?.pinned ?? [...DEFAULT_PINNED],
      expanded: cache?.expanded ?? false,
      mode: cache?.mode ?? "solo",
    });
  }
  void syncFromDb();
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

export function setPlayMode(mode: PlayMode) {
  if (useNavPrefs.getState().mode === mode) return;
  useNavPrefs.setState({ mode });
  persist();
}
