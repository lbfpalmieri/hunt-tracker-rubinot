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

// ── Canonicalização de nomes de hunt ────────────────────────────────────────
// A comunidade digita o nome à mão, então o mesmo spot aparece como "Plage Seal
// -3", "Plague seal -1", "plague  seal -2"... Aqui normalizamos, agrupamos
// grafias parecidas sob a mais usada e marcamos andares improváveis (ex: um
// "-3" com uma única sessão quando "-1"/"-2" têm várias) como suspeitos.

const FLOOR_RE = /(-?\s*[+-]?\d+)\s*$/;

/** Chave comparável: sem acento, minúscula, espaços/hífens normalizados. */
export function normalizeHuntKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s*-\s*/g, " -")
    .replace(/\s+/g, " ")
    .trim();
}

function splitFloor(key: string): { base: string; floor: string } {
  const m = key.match(FLOOR_RE);
  if (!m) return { base: key, floor: "" };
  return { base: key.slice(0, m.index).trim(), floor: m[1].replace(/\s+/g, "") };
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        last + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      last = cur;
    }
  }
  return prev[b.length];
}

function similarBase(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5) return false;
  if (Math.abs(a.length - b.length) > 2) return false;
  const tolerance = a.length >= 12 ? 2 : 1;
  return levenshtein(a, b) <= tolerance;
}

export interface CanonicalizedHunts<T> {
  rows: T[];
  /** Nomes (lowercase) cujo andar parece digitado errado. */
  suspicious: Set<string>;
}

// ── Correção de typos por palavra ───────────────────────────────────────────
// Nomes de spot têm estruturas diferentes ("Plage Seal -3" vs "Darashia -
// Ferumbras Plague -1"), então comparar a string inteira não resolve. Aqui
// corrigimos palavra por palavra: uma palavra rara que é quase igual a uma
// palavra muito usada na base ("plage" → "plague") é reescrita.
const WORD_RE = /[\p{L}\p{N}]+/gu;

function tokenFreq(rows: { huntName: string }[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const r of rows) {
    const base = splitFloor(normalizeHuntKey(r.huntName)).base;
    for (const w of base.match(WORD_RE) ?? []) {
      if (w.length < 4) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return freq;
}

function buildTokenFix(freq: Map<string, number>): Map<string, string> {
  const fix = new Map<string, string>();
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  for (const [word, count] of sorted) {
    for (const [other, otherCount] of sorted) {
      if (other === word) continue;
      if (otherCount < count * 2 || otherCount < 2) continue;
      if (Math.abs(other.length - word.length) > 1) continue;
      if (levenshtein(word, other) <= 1) {
        fix.set(word, fix.get(other) ?? other);
        break;
      }
    }
  }
  return fix;
}

function applyTokenFix(name: string, fix: Map<string, string>): string {
  if (fix.size === 0) return name;
  return name.replace(WORD_RE, (w) => {
    const key = w
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const target = fix.get(key);
    if (!target) return w;
    // Preserva a caixa do original ("Plage" → "Plague").
    return /^[A-Z]/.test(w) ? target.charAt(0).toUpperCase() + target.slice(1) : target;
  });
}

/**
 * Reescreve o nome de cada linha para a grafia dominante do spot e devolve
 * quais nomes têm andar improvável.
 */
export function canonicalizeHuntRows<T extends { huntName: string }>(
  input: T[],
): CanonicalizedHunts<T> {
  // 0. corrige typos palavra por palavra antes de qualquer agrupamento
  const tokenFix = buildTokenFix(tokenFreq(input));
  const rows = input.map((r) => {
    const fixed = applyTokenFix(r.huntName, tokenFix);
    return fixed === r.huntName ? r : { ...r, huntName: fixed };
  });

  // Andares plausíveis por palavra: "plague" aparece com -1 e -2 várias vezes,
  // então um "-3" solitário nessa família é provável erro de digitação.
  const floorsByWord = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const { base, floor } = splitFloor(normalizeHuntKey(r.huntName));
    if (!floor) continue;
    for (const w of base.match(WORD_RE) ?? []) {
      if (w.length < 4) continue;
      const m = floorsByWord.get(w) ?? new Map<string, number>();
      m.set(floor, (m.get(floor) ?? 0) + 1);
      floorsByWord.set(w, m);
    }
  }
  const wordFloorSuspicious = (name: string): boolean => {
    const { base, floor } = splitFloor(normalizeHuntKey(name));
    if (!floor) return false;
    for (const w of base.match(WORD_RE) ?? []) {
      const m = floorsByWord.get(w);
      if (!m) continue;
      const mine = m.get(floor) ?? 0;
      const strongest = Math.max(
        ...[...m.entries()].filter(([f]) => f !== floor).map(([, c]) => c),
        0,
      );
      if (mine <= 1 && strongest >= 3) return true;
    }
    return false;
  };

  // 1. contagem por chave normalizada, guardando a grafia mais frequente
  const byKey = new Map<string, { count: number; spellings: Map<string, number> }>();
  for (const r of rows) {
    const key = normalizeHuntKey(r.huntName);
    if (!key) continue;
    const cur = byKey.get(key) ?? { count: 0, spellings: new Map() };
    cur.count += 1;
    cur.spellings.set(r.huntName.trim(), (cur.spellings.get(r.huntName.trim()) ?? 0) + 1);
    byKey.set(key, cur);
  }

  const display = (key: string) => {
    const entry = byKey.get(key);
    if (!entry) return key;
    return [...entry.spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  };

  // 2. clusteriza bases parecidas (typos) — o andar continua distinguindo spots
  const bases: { base: string; count: number }[] = [];
  const baseCount = new Map<string, number>();
  for (const [key, entry] of byKey) {
    const { base } = splitFloor(key);
    baseCount.set(base, (baseCount.get(base) ?? 0) + entry.count);
  }
  for (const [base, count] of [...baseCount.entries()].sort((a, b) => b[1] - a[1])) {
    bases.push({ base, count });
  }
  const baseCanon = new Map<string, string>();
  for (const { base } of bases) {
    const hit = [...new Set(baseCanon.values())].find((c) => similarBase(c, base));
    baseCanon.set(base, hit ?? base);
  }

  // 3. andares por cluster de base → detecta o "-3" que não existe
  const floorsByBase = new Map<string, Map<string, number>>();
  for (const [key, entry] of byKey) {
    const { base, floor } = splitFloor(key);
    const canonBase = baseCanon.get(base) ?? base;
    const floors = floorsByBase.get(canonBase) ?? new Map<string, number>();
    floors.set(floor, (floors.get(floor) ?? 0) + entry.count);
    floorsByBase.set(canonBase, floors);
  }

  // 4. chave normalizada → nome canônico exibido
  const keyToName = new Map<string, string>();
  const suspicious = new Set<string>();
  for (const [key, entry] of byKey) {
    const { base, floor } = splitFloor(key);
    const canonBase = baseCanon.get(base) ?? base;
    // Grafia dominante da mesma base+andar
    let bestKey = key;
    let bestCount = entry.count;
    for (const [otherKey, other] of byKey) {
      const o = splitFloor(otherKey);
      if ((baseCanon.get(o.base) ?? o.base) !== canonBase || o.floor !== floor) continue;
      if (other.count > bestCount) {
        bestCount = other.count;
        bestKey = otherKey;
      }
    }
    let name = display(bestKey);
    if (bestKey === key && floor) {
      // Nenhuma outra sessão com esse andar: corrige a grafia da base usando a
      // variante dominante do cluster ("Plage Seal -3" → "Plague Seal -3").
      let clusterKey = key;
      let clusterCount = entry.count;
      for (const [otherKey, other] of byKey) {
        const o = splitFloor(otherKey);
        if ((baseCanon.get(o.base) ?? o.base) !== canonBase) continue;
        if (other.count > clusterCount) {
          clusterCount = other.count;
          clusterKey = otherKey;
        }
      }
      const clusterBase = splitFloor(clusterKey).base;
      if (clusterKey !== key && clusterBase !== base) {
        const ref = display(clusterKey);
        const m = ref.match(FLOOR_RE);
        if (m) name = `${ref.slice(0, m.index).trim()} ${floor}`;
      }
    }
    keyToName.set(key, name);

    const floors = floorsByBase.get(canonBase);
    if (floor && floors) {
      const mine = floors.get(floor) ?? 0;
      const strongest = Math.max(...[...floors.entries()].filter(([f]) => f !== floor).map(([, c]) => c), 0);
      if (mine <= 1 && strongest >= 3) suspicious.add(name.toLowerCase());
    }
    if (wordFloorSuspicious(name)) suspicious.add(name.toLowerCase());
  }


  return {
    rows: rows.map((r) => {
      const key = normalizeHuntKey(r.huntName);
      const name = keyToName.get(key);
      return name && name !== r.huntName ? { ...r, huntName: name } : r;
    }),
    suspicious,
  };
}
