// Suggests which hunt/spot a freshly parsed session likely belongs to, by
// matching the monsters just killed against monsters seen before under each
// hunt name — either the player's own history or the community's.
//
// Importante: o histórico acumula bichos "de passagem" (um Wasp que apareceu
// numa sessão, um bicho puxado no caminho). Se contássemos tudo, um spot de 4
// monstros viraria 7 e nenhuma sessão daria match total. Por isso cada hunt tem
// um conjunto "core": monstros recorrentes e relevantes em volume de kills.

export interface MonsterStat {
  name: string;
  /** Em quantas sessões dessa hunt esse monstro apareceu. */
  sessions: number;
  /** Soma de kills desse monstro em todas as sessões da hunt. */
  kills: number;
}

export interface HuntMonsterGroup {
  huntName: string;
  monsters: Set<string>;
  /** Monstros recorrentes/relevantes — usados como referência do spot. */
  coreMonsters: Set<string>;
  stats: MonsterStat[];
  sessionCount: number;
}

export interface HuntMatch {
  huntName: string;
  shared: number;
  total: number;
  sessionCount: number;
  /** Monstros da sessão atual que não fazem parte do core do spot. */
  extras: number;
}

/** Presença mínima entre as sessões da hunt para o monstro contar como core. */
const CORE_SESSION_RATIO = 0.5;
/** Fatia mínima do total de kills da hunt — corta bichos de passagem. */
const CORE_KILL_RATIO = 0.03;

function computeCore(stats: MonsterStat[], sessionCount: number): Set<string> {
  const totalKills = stats.reduce((s, m) => s + m.kills, 0);
  const core = stats.filter(
    (m) =>
      m.sessions / Math.max(1, sessionCount) >= CORE_SESSION_RATIO &&
      (totalKills === 0 || m.kills / totalKills >= CORE_KILL_RATIO),
  );
  // Nunca devolve vazio: se o filtro cortar tudo, cai para os mais matados.
  const list = core.length
    ? core
    : [...stats].sort((a, b) => b.kills - a.kills).slice(0, Math.min(4, stats.length));
  return new Set(list.map((m) => m.name));
}

export function groupMonstersByHunt(
  rows: { huntName: string; kills: { name: string }[] }[],
): HuntMonsterGroup[] {
  const map = new Map<
    string,
    { huntName: string; sessionCount: number; stats: Map<string, MonsterStat> }
  >();

  for (const r of rows) {
    const key = r.huntName.trim().toLowerCase();
    if (!key) continue;
    const cur = map.get(key) ?? { huntName: r.huntName, sessionCount: 0, stats: new Map() };
    cur.sessionCount += 1;
    const seen = new Set<string>();
    for (const k of r.kills) {
      const name = k.name;
      const stat = cur.stats.get(name) ?? { name, sessions: 0, kills: 0 };
      if (!seen.has(name)) {
        stat.sessions += 1;
        seen.add(name);
      }
      stat.kills += Number((k as { count?: number }).count ?? 0) || 0;
      cur.stats.set(name, stat);
    }
    map.set(key, cur);
  }

  return [...map.values()].map((g) => {
    const stats = [...g.stats.values()];
    return {
      huntName: g.huntName,
      monsters: new Set(stats.map((s) => s.name)),
      coreMonsters: computeCore(stats, g.sessionCount),
      stats,
      sessionCount: g.sessionCount,
    };
  });
}

/** Ranks hunt-name groups by how many of the spot's core monsters they share. */
export function matchHuntsByMonsters(
  targetMonsters: string[],
  groups: HuntMonsterGroup[],
  limit = 4,
): HuntMatch[] {
  const target = new Set(targetMonsters.map((m) => m.toLowerCase()));
  if (target.size === 0) return [];
  const scored: HuntMatch[] = groups.map((g) => {
    const core = new Set([...g.coreMonsters].map((m) => m.toLowerCase()));
    const known = new Set([...g.monsters].map((m) => m.toLowerCase()));
    let shared = 0;
    for (const m of target) if (core.has(m)) shared++;
    let extras = 0;
    for (const m of target) if (!known.has(m)) extras++;
    return {
      huntName: g.huntName,
      shared,
      total: core.size,
      sessionCount: g.sessionCount,
      extras,
    };
  });
  return scored
    .filter((s) => s.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        b.shared / b.total - a.shared / a.total ||
        a.extras - b.extras,
    )
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
