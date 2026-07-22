import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
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
  loaded: boolean;
  loading: boolean;
  setActive: (id: string | null) => void;
  reset: () => void;
  loadAll: () => Promise<void>;
  addCharacter: (c: Omit<Character, "id" | "createdAt">) => Promise<Character>;
  removeCharacter: (id: string) => Promise<void>;
  addSession: (s: Omit<HuntSession, "id" | "createdAt">) => Promise<HuntSession>;
  removeSession: (id: string) => Promise<void>;
}

// Data API types aren't generated yet; cast to a loose client here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const useAppStore = create<State>()((set, get) => ({
  characters: [],
  sessions: [],
  activeCharacterId: null,
  loaded: false,
  loading: false,

  setActive: (id) => set({ activeCharacterId: id }),

  reset: () =>
    set({ characters: [], sessions: [], activeCharacterId: null, loaded: false, loading: false }),

  loadAll: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [charRes, sessRes] = await Promise.all([
        db.from("characters").select("*").order("created_at", { ascending: true }),
        db.from("hunt_sessions").select("*").order("created_at", { ascending: false }),
      ]);
      if (charRes.error) throw charRes.error;
      if (sessRes.error) throw sessRes.error;

      const characters: Character[] = (charRes.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        vocation: c.vocation,
        world: c.world,
        createdAt: c.created_at,
      }));
      const sessions: HuntSession[] = (sessRes.data ?? []).map((s: any) => ({
        id: s.id,
        characterId: s.character_id,
        huntName: s.hunt_name,
        createdAt: s.created_at,
        hunting: s.hunting as HuntingData,
        damage: (s.damage ?? null) as DamageData | null,
        misc: (s.misc ?? null) as MiscData | null,
      }));
      const prevActive = get().activeCharacterId;
      set({
        characters,
        sessions,
        loaded: true,
        loading: false,
        activeCharacterId:
          prevActive && characters.some((c) => c.id === prevActive)
            ? prevActive
            : (characters[0]?.id ?? null),
      });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  addCharacter: async (c) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Not signed in");
    const { data, error } = await db
      .from("characters")
      .insert({ user_id: uid, name: c.name, vocation: c.vocation, world: c.world })
      .select()
      .single();
    if (error) throw error;
    const created: Character = {
      id: data.id,
      name: data.name,
      vocation: data.vocation,
      world: data.world,
      createdAt: data.created_at,
    };
    set((s) => ({
      characters: [...s.characters, created],
      activeCharacterId: s.activeCharacterId ?? created.id,
    }));
    return created;
  },

  removeCharacter: async (id) => {
    const { error } = await db.from("characters").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      sessions: s.sessions.filter((se) => se.characterId !== id),
      activeCharacterId: s.activeCharacterId === id ? null : s.activeCharacterId,
    }));
  },

  addSession: async (input) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Not signed in");
    const { data, error } = await db
      .from("hunt_sessions")
      .insert({
        user_id: uid,
        character_id: input.characterId,
        hunt_name: input.huntName,
        hunting: input.hunting,
        damage: input.damage,
        misc: input.misc,
      })
      .select()
      .single();
    if (error) throw error;
    const created: HuntSession = {
      id: data.id,
      characterId: data.character_id,
      huntName: data.hunt_name,
      createdAt: data.created_at,
      hunting: data.hunting as HuntingData,
      damage: (data.damage ?? null) as DamageData | null,
      misc: (data.misc ?? null) as MiscData | null,
    };
    set((s) => ({ sessions: [created, ...s.sessions] }));
    return created;
  },

  removeSession: async (id) => {
    const { error } = await db.from("hunt_sessions").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ sessions: s.sessions.filter((se) => se.id !== id) }));
  },
}));

export function useHydrated() {
  return useAppStore((s) => s.loaded);
}
