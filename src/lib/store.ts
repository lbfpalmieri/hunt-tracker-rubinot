import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { HuntingData, DamageData, MiscData } from "./parser";
import type { BountyInfo, BountyDifficulty, BountyTier } from "./bounty";

export interface Character {
  id: string;
  name: string;
  vocation: string;
  world: string;
  outfitUrl: string | null;
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
  gearUrl: string | null;
  isPublic: boolean;
}


export interface Hunt {
  id: string;
  characterId: string;
  name: string;
  createdAt: string;
}

export type ImbuementTier = "basic" | "intricate" | "powerful";

export interface Imbuement {
  id: string;
  characterId: string;
  tier: ImbuementTier;
  goldTokenCost: number;
  label: string | null;
  hoursRemaining: number;
  createdAt: string;
}

interface State {
  characters: Character[];
  sessions: HuntSession[];
  hunts: Hunt[];
  imbuements: Imbuement[];
  activeCharacterId: string | null;
  loaded: boolean;
  loading: boolean;
  setActive: (id: string | null) => void;
  reset: () => void;
  loadAll: () => Promise<void>;
  addCharacter: (c: Omit<Character, "id" | "createdAt">) => Promise<Character>;
  updateCharacter: (id: string, patch: Partial<Omit<Character, "id" | "createdAt">>) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  addHunt: (characterId: string, name: string) => Promise<Hunt>;
  removeHunt: (id: string) => Promise<void>;
  addSession: (s: Omit<HuntSession, "id" | "createdAt" | "gearUrl" | "isPublic"> & { gearUrl?: string | null; isPublic?: boolean }) => Promise<HuntSession>;
  updateSession: (id: string, patch: { gearUrl?: string | null; isPublic?: boolean }) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  addImbuement: (i: Omit<Imbuement, "id" | "createdAt">) => Promise<Imbuement>;
  renewImbuement: (id: string, goldTokenCost?: number) => Promise<Imbuement>;

  removeImbuement: (id: string) => Promise<void>;
}



// Data API types aren't generated yet; cast to a loose client here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const useAppStore = create<State>()((set, get) => ({
  characters: [],
  sessions: [],
  hunts: [],
  imbuements: [],
  activeCharacterId: null,
  loaded: false,
  loading: false,

  setActive: (id) => set({ activeCharacterId: id }),

  reset: () =>
    set({ characters: [], sessions: [], hunts: [], imbuements: [], activeCharacterId: null, loaded: false, loading: false }),

  loadAll: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const [charRes, sessRes, huntRes, imbRes] = await Promise.all([
        db.from("characters").select("*").order("created_at", { ascending: true }),
        // The public community policy also exposes other users' public sessions,
        // so scope the personal history explicitly to the signed-in user.
        db
          .from("hunt_sessions")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        db.from("hunts").select("*").order("created_at", { ascending: true }),
        db.from("imbuements").select("*").order("created_at", { ascending: false }),
      ]);

      if (charRes.error) throw charRes.error;
      if (sessRes.error) throw sessRes.error;
      if (huntRes.error) throw huntRes.error;
      if (imbRes.error) throw imbRes.error;

      const characters: Character[] = (charRes.data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        vocation: c.vocation,
        world: c.world,
        outfitUrl: c.outfit_url ?? null,
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
        gearUrl: s.gear_url ?? null,
        isPublic: s.is_public ?? true,
      }));

      const hunts: Hunt[] = (huntRes.data ?? []).map((h: any) => ({
        id: h.id,
        characterId: h.character_id,
        name: h.name,
        createdAt: h.created_at,
      }));
      const imbuements: Imbuement[] = (imbRes.data ?? []).map((i: any) => ({
        id: i.id,
        characterId: i.character_id,
        tier: i.tier as ImbuementTier,
        goldTokenCost: Number(i.gold_token_cost ?? 0),
        label: i.label ?? null,
        hoursRemaining: Number(i.hours_remaining ?? 20),
        createdAt: i.created_at,
      }));
      const prevActive = get().activeCharacterId;
      set({
        characters,
        sessions,
        hunts,
        imbuements,
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
      .insert({
        user_id: uid,
        name: c.name,
        vocation: c.vocation,
        world: c.world,
        outfit_url: c.outfitUrl,
      })
      .select()
      .single();
    if (error) throw error;
    const created: Character = {
      id: data.id,
      name: data.name,
      vocation: data.vocation,
      world: data.world,
      outfitUrl: data.outfit_url ?? null,
      createdAt: data.created_at,
    };
    set((s) => ({
      characters: [...s.characters, created],
      activeCharacterId: s.activeCharacterId ?? created.id,
    }));
    return created;
  },

  updateCharacter: async (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.vocation !== undefined) dbPatch.vocation = patch.vocation;
    if (patch.world !== undefined) dbPatch.world = patch.world;
    if (patch.outfitUrl !== undefined) dbPatch.outfit_url = patch.outfitUrl;
    const { error } = await db.from("characters").update(dbPatch).eq("id", id);
    if (error) throw error;
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },

  removeCharacter: async (id) => {
    const { error } = await db.from("characters").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      sessions: s.sessions.filter((se) => se.characterId !== id),
      hunts: s.hunts.filter((h) => h.characterId !== id),
      activeCharacterId: s.activeCharacterId === id ? null : s.activeCharacterId,
    }));
  },

  addHunt: async (characterId, name) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Not signed in");
    const trimmed = name.trim();
    const existing = get().hunts.find(
      (h) => h.characterId === characterId && h.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) return existing;
    const { data, error } = await db
      .from("hunts")
      .insert({ user_id: uid, character_id: characterId, name: trimmed })
      .select()
      .single();
    if (error) throw error;
    const created: Hunt = {
      id: data.id,
      characterId: data.character_id,
      name: data.name,
      createdAt: data.created_at,
    };
    set((s) => ({ hunts: [...s.hunts, created] }));
    return created;
  },

  removeHunt: async (id) => {
    const { error } = await db.from("hunts").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ hunts: s.hunts.filter((h) => h.id !== id) }));
  },





  addSession: async (input) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Not signed in");
    let char = get().characters.find((c) => c.id === input.characterId);
    if (!char?.name || !char?.vocation) {
      // Estado local pode estar vazio/desatualizado (ex.: acesso direto a /import).
      // Busca o personagem no banco para nunca salvar a sessão sem nome/vocação.
      const { data: cRow } = await db
        .from("characters")
        .select("id, name, vocation, world, outfit_url, created_at")
        .eq("id", input.characterId)
        .maybeSingle();
      if (cRow) {
        char = {
          id: cRow.id,
          name: cRow.name,
          vocation: cRow.vocation,
          world: cRow.world,
          outfitUrl: cRow.outfit_url ?? null,
          createdAt: cRow.created_at,
        } as typeof char;
      }
    }
    if (!char?.name) throw new Error("Personagem não encontrado — recarregue a página e tente novamente.");
    const { data, error } = await db
      .from("hunt_sessions")
      .insert({
        user_id: uid,
        character_id: input.characterId,
        hunt_name: input.huntName,
        hunting: input.hunting,
        damage: input.damage,
        misc: input.misc,
        gear_url: input.gearUrl ?? null,
        is_public: input.isPublic ?? true,
        char_name: char?.name ?? null,
        char_vocation: char?.vocation ?? null,
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
      gearUrl: data.gear_url ?? null,
      isPublic: data.is_public ?? true,
    };
    set((s) => ({ sessions: [created, ...s.sessions] }));
    return created;
  },

  updateSession: async (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.gearUrl !== undefined) dbPatch.gear_url = patch.gearUrl;
    if (patch.isPublic !== undefined) dbPatch.is_public = patch.isPublic;
    if (Object.keys(dbPatch).length === 0) return;
    const { error } = await db.from("hunt_sessions").update(dbPatch).eq("id", id);
    if (error) throw error;
    set((s) => ({
      sessions: s.sessions.map((se) => (se.id === id ? { ...se, ...patch } : se)),
    }));
  },

  removeSession: async (id) => {
    const { error } = await db.from("hunt_sessions").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ sessions: s.sessions.filter((se) => se.id !== id) }));
  },



  addImbuement: async (input) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Not signed in");
    const { data, error } = await db
      .from("imbuements")
      .insert({
        user_id: uid,
        character_id: input.characterId,
        tier: input.tier,
        gold_token_cost: input.goldTokenCost,
        label: input.label,
        hours_remaining: input.hoursRemaining,
      })
      .select()
      .single();
    if (error) throw error;
    const created: Imbuement = {
      id: data.id,
      characterId: data.character_id,
      tier: data.tier as ImbuementTier,
      goldTokenCost: Number(data.gold_token_cost ?? 0),
      label: data.label ?? null,
      hoursRemaining: Number(data.hours_remaining ?? 20),
      createdAt: data.created_at,
    };
    set((s) => ({ imbuements: [created, ...s.imbuements] }));
    return created;
  },

  renewImbuement: async (id, goldTokenCost) => {
    const current = get().imbuements.find((i) => i.id === id);
    if (!current) throw new Error("Imbuement not found");
    return await get().addImbuement({
      characterId: current.characterId,
      tier: current.tier,
      goldTokenCost: goldTokenCost ?? current.goldTokenCost,
      label: current.label,
      hoursRemaining: 20,
    });
  },

  removeImbuement: async (id) => {
    const { error } = await db.from("imbuements").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ imbuements: s.imbuements.filter((i) => i.id !== id) }));
  },
}));


export function useHydrated() {
  return useAppStore((s) => s.loaded);
}
