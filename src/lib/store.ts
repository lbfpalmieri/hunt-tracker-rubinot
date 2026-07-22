import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HuntingData, DamageData, MiscData } from "./parser";

export interface Character {
  id: string;
  name: string;
  vocation: string;
  world: string;
  createdAt: string;
}

export interface HuntSession {
  id: string;
  characterId: string;
  huntName: string;
  createdAt: string;
  hunting: HuntingData;
  damage: DamageData | null;
  misc: MiscData | null;
}

interface State {
  characters: Character[];
  sessions: HuntSession[];
  activeCharacterId: string | null;
  addCharacter: (c: Omit<Character, "id" | "createdAt">) => Character;
  removeCharacter: (id: string) => void;
  setActive: (id: string | null) => void;
  addSession: (s: Omit<HuntSession, "id" | "createdAt">) => HuntSession;
  removeSession: (id: string) => void;
  importData: (data: { characters: Character[]; sessions: HuntSession[] }) => void;
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      characters: [],
      sessions: [],
      activeCharacterId: null,
      addCharacter: (c) => {
        const created: Character = { ...c, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({
          characters: [...s.characters, created],
          activeCharacterId: s.activeCharacterId ?? created.id,
        }));
        return created;
      },
      removeCharacter: (id) =>
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== id),
          sessions: s.sessions.filter((se) => se.characterId !== id),
          activeCharacterId: s.activeCharacterId === id ? null : s.activeCharacterId,
        })),
      setActive: (id) => set({ activeCharacterId: id }),
      addSession: (s) => {
        const created: HuntSession = { ...s, id: uid(), createdAt: new Date().toISOString() };
        set((st) => ({ sessions: [created, ...st.sessions] }));
        return created;
      },
      removeSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((se) => se.id !== id) })),
      importData: (data) => set({ characters: data.characters, sessions: data.sessions }),
    }),
    {
      name: "rubinot-tracker-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage),
      ),
      skipHydration: true,
    },
  ),
);

// SSR-safe hydration hook
import { useEffect, useState } from "react";
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
