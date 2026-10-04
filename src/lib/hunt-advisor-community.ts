import type { CommunityRow } from "./compare";
import type { GearSlot } from "./equipment";
import type { HuntMonster } from "./hunt-advisor";
import { setupVocation, type SetupVocation } from "./session-setup";

/**
 * Hunt Advisor × Comunidade: o que dá pra tirar das sessões públicas (getCommunitySessions) —
 * catálogo de hunts, criaturas de cada uma, XP/lucro por vocação, o que os jogadores usam e hunts
 * recomendadas pro seu level. Tudo calculado no navegador a partir da lista pública.
 */

export type AdvisorRow = CommunityRow & { level?: number | null };

const key = (name: string) => name.trim().toLowerCase();
const hours = (sec: number) => Math.max(sec, 1) / 3600;

export interface HuntCatalogEntry {
  key: string;
  name: string;
  sessions: number;
  players: number;
  vocations: SetupVocation[];
  /** 3 criaturas mais mortas (pra mostrar no card). */
  topMonsters: string[];
}

export function huntCatalog(rows: AdvisorRow[]): HuntCatalogEntry[] {
  type Acc = {
    names: Map<string, number>;
    rows: AdvisorRow[];
    players: Set<string>;
    vocs: Set<SetupVocation>;
  };
  const map = new Map<string, Acc>();
  for (const r of rows) {
    if (!r.huntName.trim()) continue;
    const k = key(r.huntName);
    const cur: Acc = map.get(k) ?? {
      names: new Map(),
      rows: [],
      players: new Set(),
      vocs: new Set(),
    };
    cur.names.set(r.huntName.trim(), (cur.names.get(r.huntName.trim()) ?? 0) + 1);
    cur.rows.push(r);
    cur.players.add(r.charName);
    const v = setupVocation(r.vocation);
    if (v) cur.vocs.add(v);
    map.set(k, cur);
  }
  return [...map]
    .map(([k, v]) => ({
      key: k,
      // Grafia mais usada.
      name: [...v.names].sort((a, b) => b[1] - a[1])[0][0],
      sessions: v.rows.length,
      players: v.players.size,
      vocations: [...v.vocs],
      topMonsters: huntMonsters(v.rows)
        .slice(0, 3)
        .map((m) => m.name),
    }))
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
}

export const rowsOfHunt = (rows: AdvisorRow[], name: string) =>
  rows.filter((r) => key(r.huntName) === key(name));

/** Criaturas da hunt somando as kills de todas as sessões (corta o que for < 1% das kills). */
export function huntMonsters(rows: AdvisorRow[]): HuntMonster[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const r of rows)
    for (const k of r.kills) {
      const kk = key(k.name);
      const cur = map.get(kk) ?? { name: k.name, count: 0 };
      cur.count += k.count;
      map.set(kk, cur);
    }
  const list = [...map.values()].sort((a, b) => b.count - a.count);
  const total = list.reduce((a, m) => a + m.count, 0) || 1;
  return list.filter((m) => m.count / total >= 0.01).slice(0, 14);
}

export interface VocationStats {
  sessions: number;
  avgLevel: number | null;
  rawXpH: number | null;
  profitH: number | null;
}

/** Média por sessão (cada sessão pesa igual — mesmo critério do resto do app). */
export function vocationStats(rows: AdvisorRow[], voc: SetupVocation): VocationStats {
  const mine = rows.filter((r) => setupVocation(r.vocation) === voc && r.durationSec >= 600);
  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  return {
    sessions: mine.length,
    avgLevel: avg(mine.map((r) => r.level ?? 0).filter((l) => l > 0)),
    rawXpH: avg(
      mine
        .filter((r) => !r.party?.noXp && (r.rawXp || r.xpGain))
        .map((r) => (r.rawXp || r.xpGain) / hours(r.durationSec)),
    ),
    profitH: avg(mine.map((r) => r.balance / hours(r.durationSec))),
  };
}

export interface UsageEntry {
  name: string;
  count: number;
}

export interface CommunityUsage {
  sessions: number;
  weapons: UsageEntry[];
  gear: Partial<Record<GearSlot, UsageEntry[]>>;
  stances: UsageEntry[];
  charms: UsageEntry[];
}

const top = (m: Map<string, number>, n = 3): UsageEntry[] =>
  [...m]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);

const bump = (m: Map<string, number>, k: string | null | undefined) => {
  if (k) m.set(k, (m.get(k) ?? 0) + 1);
};

/** O que os jogadores dessa vocação registraram no setup das sessões dessa hunt. */
export function communityUsage(rows: AdvisorRow[], voc: SetupVocation): CommunityUsage {
  const mine = rows.filter((r) => setupVocation(r.vocation) === voc && r.setup);
  const weapons = new Map<string, number>();
  const stances = new Map<string, number>();
  const charms = new Map<string, number>();
  const gear = new Map<GearSlot, Map<string, number>>();
  for (const r of mine) {
    const s = r.setup!;
    bump(weapons, s.weapon);
    bump(stances, s.stance);
    for (const c of new Set(s.charms.map((c) => c.charm))) bump(charms, c);
    for (const [slot, name] of Object.entries(s.gear ?? {}) as [GearSlot, string][]) {
      const m = gear.get(slot) ?? new Map();
      bump(m, name);
      gear.set(slot, m);
    }
  }
  return {
    sessions: mine.length,
    weapons: top(weapons),
    stances: top(stances),
    charms: top(charms, 5),
    gear: Object.fromEntries([...gear].map(([slot, m]) => [slot, top(m)])),
  };
}

export interface RecommendedHunt {
  name: string;
  sessions: number;
  avgLevel: number;
  rawXpH: number | null;
  profitH: number | null;
}

/**
 * Hunts que jogadores da mesma vocação e level parecido (±25%, mínimo ±50) fazem, ordenadas por
 * Raw XP/h. Sem level, ordena só por XP/h entre as da vocação.
 */
export function recommendedHunts(
  rows: AdvisorRow[],
  voc: SetupVocation,
  level: number | null,
): RecommendedHunt[] {
  const out: RecommendedHunt[] = [];
  for (const h of huntCatalog(rows)) {
    const hr = rowsOfHunt(rows, h.name);
    const st = vocationStats(hr, voc);
    if (!st.sessions || st.avgLevel == null) continue;
    if (level != null && Math.abs(st.avgLevel - level) > Math.max(50, level * 0.25)) continue;
    out.push({
      name: h.name,
      sessions: st.sessions,
      avgLevel: Math.round(st.avgLevel),
      rawXpH: st.rawXpH,
      profitH: st.profitH,
    });
  }
  return out.sort((a, b) => (b.rawXpH ?? 0) - (a.rawXpH ?? 0)).slice(0, 8);
}
