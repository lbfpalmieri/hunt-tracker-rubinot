// Suggests which hunt/spot a freshly parsed session likely belongs to, by
// matching the monsters just killed against monsters seen before under each
// hunt name — either the player's own history or the community's.

export interface HuntMonsterGroup {
  huntName: string;
  monsters: Set<string>;
  sessionCount: number;
}

export interface HuntMatch {
  huntName: string;
  shared: number;
  total: number;
  sessionCount: number;
}

export function groupMonstersByHunt(
  rows: { huntName: string; kills: { name: string }[] }[],
): HuntMonsterGroup[] {
  const map = new Map<string, HuntMonsterGroup>();
  for (const r of rows) {
    const key = r.huntName.trim().toLowerCase();
    if (!key) continue;
    const cur = map.get(key) ?? { huntName: r.huntName, monsters: new Set<string>(), sessionCount: 0 };
    cur.sessionCount += 1;
    for (const k of r.kills) cur.monsters.add(k.name);
    map.set(key, cur);
  }
  return [...map.values()];
}

/** Ranks hunt-name groups by how many of the target monsters they share. */
export function matchHuntsByMonsters(
  targetMonsters: string[],
  groups: HuntMonsterGroup[],
  limit = 4,
): HuntMatch[] {
  const target = new Set(targetMonsters.map((m) => m.toLowerCase()));
  if (target.size === 0) return [];
  const scored: HuntMatch[] = groups.map((g) => {
    const lower = new Set([...g.monsters].map((m) => m.toLowerCase()));
    let shared = 0;
    for (const m of target) if (lower.has(m)) shared++;
    return { huntName: g.huntName, shared, total: lower.size, sessionCount: g.sessionCount };
  });
  return scored
    .filter((s) => s.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.shared / b.total - a.shared / a.total)
    .slice(0, limit);
}

const GENERIC_WORDS = new Set([
  "teste",
  "testes",
  "test",
  "tests",
  "asdf",
  "abc",
  "xxx",
  "aaa",
  "semnome",
  "unnamed",
  "novo",
  "new",
  "spot",
  "hunt",
  "qwe",
  "qwerty",
]);

/** Heuristic for placeholder-looking names ("teste1", "asdf", "xxxx") that won't help anyone find the spot. */
export function looksGenericHuntName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (n.length < 3) return true;
  if (/^\d+$/.test(n)) return true;
  // Strip trailing digits ("teste1" -> "teste") and spaces before comparing to known placeholders.
  const base = n.replace(/\d+$/, "").replace(/\s+/g, "");
  if (GENERIC_WORDS.has(base)) return true;
  if (/^([a-z])\1{2,}$/.test(base)) return true;
  return false;
}
