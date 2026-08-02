import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizePrey } from "./prey";

/** Columns that are safe to expose publicly. Never include user_id/character_id. */
const LIST_COLUMNS =
  "id, created_at, hunt_name, char_name, char_vocation, hunting, bounty_difficulty, bounty_tier, bounty_xp, prey";
const DETAIL_COLUMNS =
  "id, created_at, hunt_name, char_name, char_vocation, gear_url, hunting, damage, misc, bounty_difficulty, bounty_tier, bounty_xp, prey";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const listInput = z.object({
  vocation: z.string().trim().max(60).optional(),
  hunt: z.string().trim().max(120).optional(),
  monster: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(400).optional(),
});

export const getCommunitySessions = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("hunt_sessions")
      .select(LIST_COLUMNS)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 300);

    if (data.vocation) q = q.eq("char_vocation", data.vocation);
    if (data.hunt) q = q.ilike("hunt_name", `%${data.hunt}%`);

    const { data: rows, error } = await q;
    if (error) return { sessions: [], error: error.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let list = (rows ?? []) as any[];

    if (data.monster) {
      const needle = data.monster.toLowerCase();
      list = list.filter((r) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r.hunting?.kills ?? []).some((k: any) => String(k.name).toLowerCase().includes(needle)),
      );
    }

    return {
      sessions: list.map((r) => ({
        id: r.id as string,
        createdAt: r.created_at as string,
        huntName: (r.hunt_name ?? "") as string,
        charName: (r.char_name ?? "Anônimo") as string,
        vocation: (r.char_vocation ?? "—") as string,
        durationSec: Number(r.hunting?.durationSec ?? 0),
        xpGain: Number(r.hunting?.xpGain ?? 0),
        rawXp: Number(r.hunting?.rawXp ?? 0),
        bounty: r.bounty_difficulty && r.bounty_tier
          ? {
              difficulty: String(r.bounty_difficulty),
              tier: String(r.bounty_tier),
              xp: r.bounty_xp == null ? null : Number(r.bounty_xp),
            }
          : null,
        prey: normalizePrey(r.prey),
        balance: Number(r.hunting?.balance ?? 0),
        loot: Number(r.hunting?.loot ?? 0),
        supplies: Number(r.hunting?.supplies ?? 0),
        damage: Number(r.hunting?.damage ?? 0),
        healing: Number(r.hunting?.healing ?? 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        kills: ((r.hunting?.kills ?? []) as any[]).map((k) => ({
          name: String(k.name),
          count: Number(k.count) || 0,
        })),
      })),
      error: null as string | null,
    };
  });

/** Catalog used to power the Comunidade filters — monster/hunt names plus which monsters live in which hunt. */
export const getCommunityMonsters = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("hunt_sessions")
    .select("hunt_name, hunting")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(400);
  if (error) return { monsters: [] as string[], hunts: [] as string[], huntMonsters: {} as Record<string, string[]> };

  const monsters = new Set<string>();
  // Hunt names collide case-insensitively; keep the first-seen casing as the display name.
  const huntDisplayByKey = new Map<string, string>();
  const huntMonsterSets = new Map<string, Set<string>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    const huntName = String(row.hunt_name ?? "").trim();
    const key = huntName.toLowerCase();
    if (huntName && !huntDisplayByKey.has(key)) huntDisplayByKey.set(key, huntName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const k of (row.hunting?.kills ?? []) as any[]) {
      const name = String(k.name);
      monsters.add(name);
      if (huntName) {
        const set = huntMonsterSets.get(key) ?? new Set<string>();
        set.add(name);
        huntMonsterSets.set(key, set);
      }
    }
  }

  const huntMonsters: Record<string, string[]> = {};
  for (const [key, display] of huntDisplayByKey) {
    huntMonsters[display] = [...(huntMonsterSets.get(key) ?? [])].sort((a, b) => a.localeCompare(b));
  }

  return {
    monsters: [...monsters].sort((a, b) => a.localeCompare(b)),
    hunts: [...huntDisplayByKey.values()].sort((a, b) => a.localeCompare(b)),
    huntMonsters,
  };
});

export const getCommunitySession = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("hunt_sessions")
      .select(DETAIL_COLUMNS)
      .eq("is_public", true)
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return { session: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    return {
      session: {
        id: r.id as string,
        createdAt: r.created_at as string,
        huntName: (r.hunt_name ?? "") as string,
        charName: (r.char_name ?? "Anônimo") as string,
        vocation: (r.char_vocation ?? "—") as string,
        gearUrl: (r.gear_url ?? null) as string | null,
        hunting: r.hunting,
        damage: r.damage ?? null,
        misc: r.misc ?? null,
        bounty: r.bounty_difficulty && r.bounty_tier
          ? {
              difficulty: String(r.bounty_difficulty),
              tier: String(r.bounty_tier),
              xp: r.bounty_xp == null ? null : Number(r.bounty_xp),
            }
          : null,
        prey: normalizePrey(r.prey),
      },
    };
  });

/** Aggregated public numbers used by the landing page and community hero. */
export const getCommunityStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { count, error: countError } = await supabase
    .from("hunt_sessions")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true);

  const { data, error } = await supabase
    .from("hunt_sessions")
    .select("hunt_name, char_name, char_vocation, hunting")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || countError) {
    return { sessions: 0, players: 0, hunts: 0, kills: 0, hours: 0, rawXp: 0, gold: 0 };
  }

  const players = new Set<string>();
  const hunts = new Set<string>();
  let kills = 0;
  let hours = 0;
  let rawXp = 0;
  let gold = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    if (row.char_name) players.add(String(row.char_name).toLowerCase());
    if (row.hunt_name) hunts.add(String(row.hunt_name).toLowerCase());
    hours += Number(row.hunting?.durationSec ?? 0) / 3600;
    rawXp += Number(row.hunting?.rawXp ?? row.hunting?.xpGain ?? 0);
    gold += Number(row.hunting?.balance ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const k of (row.hunting?.kills ?? []) as any[]) kills += Number(k.count) || 0;
  }

  return {
    sessions: count ?? (data?.length ?? 0),
    players: players.size,
    hunts: hunts.size,
    kills,
    hours: Math.round(hours),
    rawXp,
    gold,
  };
});
