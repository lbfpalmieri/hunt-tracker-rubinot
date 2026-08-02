import type { HuntSession } from "./store";
import { huntRawXp, type BountyInfo } from "./bounty";
import { normalizePrey, type PreySlot } from "./prey";

export type CompareSource = "own" | "community";

export interface CompareHunt {
  /** Unique key across sources, e.g. "own:uuid". */
  key: string;
  id: string;
  source: CompareSource;
  huntName: string;
  charName: string;
  vocation: string;
  createdAt: string;
  durationSec: number;
  /** Raw XP with the bounty bonus removed. Null when the bonus is unknown. */
  rawXpHunt: number | null;
  rawXpTotal: number;
  xpGain: number;
  balance: number;
  loot: number;
  supplies: number;
  killsTotal: number;
  kills: { name: string; count: number }[];
  damageDealt: number;
  healing: number;
  damageReceived: number | null;
  bounty: BountyInfo | null;
  prey: PreySlot[] | null;
  /** Quantas sessões formam esta hunt (1 = sessão única). */
  sessionCount?: number;
  /** Quantas dessas sessões tinham prey ativa. */
  preySessions?: number;
}


const hoursOf = (durationSec: number) => durationSec / 3600 || 1;

export const perHour = (value: number | null, durationSec: number): number | null =>
  value == null ? null : value / hoursOf(durationSec);

export function fromOwnSession(s: HuntSession, charName: string, vocation: string): CompareHunt {
  const kills = s.hunting.kills ?? [];
  return {
    key: `own:${s.id}`,
    id: s.id,
    source: "own",
    huntName: s.huntName,
    charName,
    vocation,
    createdAt: s.createdAt,
    durationSec: Number(s.hunting.durationSec ?? 0),
    rawXpHunt: huntRawXp(s),
    rawXpTotal: Number(s.hunting.rawXp || s.hunting.xpGain || 0),
    xpGain: Number(s.hunting.xpGain ?? 0),
    balance: Number(s.hunting.balance ?? 0),
    loot: Number(s.hunting.loot ?? 0),
    supplies: Number(s.hunting.supplies ?? 0),
    killsTotal: kills.reduce((a, k) => a + (Number(k.count) || 0), 0),
    kills: kills.map((k) => ({ name: k.name, count: Number(k.count) || 0 })),
    damageDealt: Number(s.hunting.damage ?? 0),
    healing: Number(s.hunting.healing ?? 0),
    damageReceived: s.damage ? Number(s.damage.totalReceived ?? 0) : null,
    bounty: s.bounty,
    prey: s.prey,
  };
}

/** Shape returned by getCommunitySessions. */
export interface CommunityRow {
  id: string;
  createdAt: string;
  huntName: string;
  charName: string;
  vocation: string;
  durationSec: number;
  xpGain: number;
  rawXp: number;
  balance: number;
  loot: number;
  supplies: number;
  damage?: number;
  healing?: number;
  kills: { name: string; count: number }[];
  bounty: { difficulty: string; tier: string; xp: number | null } | null;
  prey: unknown;
}

export function fromCommunityRow(r: CommunityRow): CompareHunt {
  const bounty = r.bounty
    ? ({
        difficulty: r.bounty.difficulty,
        tier: r.bounty.tier,
        xp: r.bounty.xp,
      } as BountyInfo)
    : null;
  const rawXpTotal = Number(r.rawXp || r.xpGain || 0);
  const rawXpHunt = !bounty ? rawXpTotal : bounty.xp == null ? null : Math.max(0, rawXpTotal - bounty.xp);
  return {
    key: `community:${r.id}`,
    id: r.id,
    source: "community",
    huntName: r.huntName,
    charName: r.charName,
    vocation: r.vocation,
    createdAt: r.createdAt,
    durationSec: Number(r.durationSec ?? 0),
    rawXpHunt,
    rawXpTotal,
    xpGain: Number(r.xpGain ?? 0),
    balance: Number(r.balance ?? 0),
    loot: Number(r.loot ?? 0),
    supplies: Number(r.supplies ?? 0),
    killsTotal: (r.kills ?? []).reduce((a, k) => a + (Number(k.count) || 0), 0),
    kills: (r.kills ?? []).map((k) => ({ name: k.name, count: Number(k.count) || 0 })),
    damageDealt: Number(r.damage ?? 0),
    healing: Number(r.healing ?? 0),
    damageReceived: null,
    bounty,
    prey: normalizePrey(r.prey),
  };
}

export const MAX_COMPARE = 4;

const avg = (values: number[]): number =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const avgOrNull = (values: (number | null)[]): number | null => {
  const nums = values.filter((v): v is number => v != null);
  return nums.length ? avg(nums) : null;
};

const uniq = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

/**
 * Agrupa sessões pelo nome da hunt e devolve a MÉDIA de cada métrica.
 * É isso que o comparativo usa: hunts (médias), não sessões individuais.
 */
export function aggregateByHunt(sessions: CompareHunt[]): CompareHunt[] {
  const groups = new Map<string, CompareHunt[]>();
  for (const s of sessions) {
    const k = s.huntName.trim().toLowerCase();
    const arr = groups.get(k);
    if (arr) arr.push(s);
    else groups.set(k, [s]);
  }

  const out: CompareHunt[] = [];
  for (const [slug, group] of groups) {
    const first = group[0];
    if (group.length === 1) {
      out.push({ ...first, sessionCount: 1, preySessions: first.prey?.length ? 1 : 0 });
      continue;
    }

    // Kills médias por criatura
    const killMap = new Map<string, number>();
    for (const s of group) {
      for (const k of s.kills) killMap.set(k.name, (killMap.get(k.name) ?? 0) + k.count);
    }
    const kills = Array.from(killMap, ([name, total]) => ({
      name,
      count: total / group.length,
    })).sort((a, b) => b.count - a.count);

    const chars = uniq(group.map((s) => s.charName));
    const vocs = uniq(group.map((s) => s.vocation));
    const preySlots = group.flatMap((s) => s.prey ?? []);

    out.push({
      key: `${first.source}:hunt:${slug}`,
      id: first.id,
      source: first.source,
      huntName: first.huntName,
      charName: chars.length === 1 ? chars[0] : `${chars.length} personagens`,
      vocation: vocs.length === 1 ? vocs[0] : "Várias vocações",
      // Data da sessão mais recente do grupo
      createdAt: group.reduce(
        (acc, s) => (new Date(s.createdAt) > new Date(acc) ? s.createdAt : acc),
        first.createdAt,
      ),
      durationSec: avg(group.map((s) => s.durationSec)),
      rawXpHunt: avgOrNull(group.map((s) => s.rawXpHunt)),
      rawXpTotal: avg(group.map((s) => s.rawXpTotal)),
      xpGain: avg(group.map((s) => s.xpGain)),
      balance: avg(group.map((s) => s.balance)),
      loot: avg(group.map((s) => s.loot)),
      supplies: avg(group.map((s) => s.supplies)),
      killsTotal: avg(group.map((s) => s.killsTotal)),
      kills,
      damageDealt: avg(group.map((s) => s.damageDealt)),
      healing: avg(group.map((s) => s.healing)),
      damageReceived: avgOrNull(group.map((s) => s.damageReceived)),
      bounty: null,
      prey: preySlots.length ? preySlots : null,
      sessionCount: group.length,
      preySessions: group.filter((s) => s.prey?.length).length,
    });
  }

  return out.sort((a, b) => b.huntName.localeCompare(a.huntName) * -1);
}


export function topKills(h: CompareHunt, n = 3): { name: string; count: number }[] {
  return h.kills
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
