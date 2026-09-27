import { useMemo } from "react";
import { useNavPrefs, type PlayMode } from "./nav-prefs";
import { useAppStore, type HuntSession } from "./store";

/**
 * Modo Solo / Grupo. O app inteiro olha só pras sessões do modo escolhido: Solo = sessões sem
 * party, Grupo = sessões em party. Assim uma hunt em pt (lucro dividido, XP compartilhada) não
 * distorce as médias e comparações das hunts solo — e vice-versa.
 *
 * Telas de "hunt" (Dashboard, Sessões, Comparar, Ranking, Comunidade...) usam useModeSessions().
 * Telas do PERSONAGEM (Meu rendimento, Imbuements, Personagens, saldo de gold) continuam
 * olhando tudo: o gold e o level do char são um só, não importa com quem ele caçou.
 * O modo fica em nav-prefs.ts (user_nav_prefs.play_mode); o visual muda via
 * html[data-play-mode="party"] em styles.css.
 */
export type { PlayMode };

export const usePlayMode = () => useNavPrefs((s) => s.mode);

export const sessionInMode = (s: Pick<HuntSession, "party">, mode: PlayMode) =>
  mode === "party" ? !!s.party : !s.party;

export function useModeSessions(): HuntSession[] {
  const mode = usePlayMode();
  const sessions = useAppStore((s) => s.sessions);
  return useMemo(() => sessions.filter((s) => sessionInMode(s, mode)), [sessions, mode]);
}

/** Quantas sessões do personagem estão no OUTRO modo (pra avisar que existem). */
export function useOtherModeCount(characterId: string | null): number {
  const mode = usePlayMode();
  const sessions = useAppStore((s) => s.sessions);
  return useMemo(
    () =>
      sessions.filter((s) => (!characterId || s.characterId === characterId) && !sessionInMode(s, mode))
        .length,
    [sessions, mode, characterId],
  );
}

export const MODE_LABEL: Record<PlayMode, string> = { solo: "Solo", party: "Grupo" };
