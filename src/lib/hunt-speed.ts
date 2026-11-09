/**
 * Em qual hunt do SEU histórico uma task (bounty ou linked) termina mais rápido: soma as kills
 * das criaturas alvo por hunt e divide pelo tempo das próprias sessões (regra do app: "/h" =
 * total ÷ duração). Usado pela Calculadora de monstros/h e pelo conselho da Linked Task.
 */
export interface HuntSpeedSession {
  huntName: string;
  hunting: { durationSec: number; kills: { name: string; count: number }[] };
}

export interface HuntSpeedResult {
  huntName: string;
  sessionCount: number;
  totalKills: number;
  totalSec: number;
  /** Kills (de todas as criaturas alvo) por hora. */
  perHour: number;
  /** Segundos pra matar `quantity` criaturas nesse ritmo (Infinity se perHour = 0). */
  estSec: number;
  perMonsterPerHour: { name: string; perHour: number }[];
  /** Criaturas dessas sessões que NÃO são da task (não contam), da mais matada pra menos. */
  ignoredKills: { name: string; count: number }[];
}

export function rankHuntsByTask(
  sessions: HuntSpeedSession[],
  targets: string[],
  quantity: number,
): HuntSpeedResult[] {
  if (targets.length === 0) return [];
  const needles = targets.map((t) => t.toLowerCase());
  const byHunt = new Map<
    string,
    {
      huntName: string;
      totalSec: number;
      totalKills: number;
      sessionCount: number;
      perMonster: Map<string, number>;
      ignored: Map<string, number>;
    }
  >();
  for (const s of sessions) {
    const sessionPer = new Map<string, number>();
    const sessionIgnored = new Map<string, number>();
    let sessionKills = 0;
    for (const k of s.hunting.kills) {
      const idx = needles.indexOf(k.name.toLowerCase());
      if (idx === -1) {
        sessionIgnored.set(k.name, (sessionIgnored.get(k.name) ?? 0) + k.count);
        continue;
      }
      sessionPer.set(targets[idx], (sessionPer.get(targets[idx]) ?? 0) + k.count);
      sessionKills += k.count;
    }
    if (sessionKills <= 0) continue;
    // Mesma hunt com grafia diferente ("Asura" / "asura ") conta junto, como no resto do app.
    const key = s.huntName.trim().toLowerCase();
    const cur = byHunt.get(key) ?? {
      huntName: s.huntName.trim(),
      totalSec: 0,
      totalKills: 0,
      sessionCount: 0,
      perMonster: new Map(),
      ignored: new Map(),
    };
    cur.totalSec += s.hunting.durationSec;
    cur.totalKills += sessionKills;
    cur.sessionCount += 1;
    for (const [name, n] of sessionPer) cur.perMonster.set(name, (cur.perMonster.get(name) ?? 0) + n);
    for (const [name, n] of sessionIgnored) cur.ignored.set(name, (cur.ignored.get(name) ?? 0) + n);
    byHunt.set(key, cur);
  }
  return Array.from(byHunt.values())
    .map((v) => {
      const hours = v.totalSec / 3600;
      const perHour = hours > 0 ? v.totalKills / hours : 0;
      const estSec = perHour > 0 ? (quantity / perHour) * 3600 : Infinity;
      return {
        huntName: v.huntName,
        sessionCount: v.sessionCount,
        totalKills: v.totalKills,
        totalSec: v.totalSec,
        perHour,
        estSec,
        perMonsterPerHour: targets.map((t) => ({
          name: t,
          perHour: hours > 0 ? (v.perMonster.get(t) ?? 0) / hours : 0,
        })),
        ignoredKills: Array.from(v.ignored, ([name, count]) => ({ name, count })).sort(
          (a, b) => b.count - a.count,
        ),
      };
    })
    .sort((a, b) => a.estSec - b.estSec);
}

export interface HuntMonsters {
  huntName: string;
  sessionCount: number;
  /** Criaturas mortas nessa hunt (todas as sessões), da mais matada pra menos. */
  monsters: { name: string; count: number }[];
}

/** As hunts do histórico com as criaturas de cada uma (grafias iguais juntas), da mais jogada pra menos. */
export function listHunts(sessions: HuntSpeedSession[]): HuntMonsters[] {
  const byHunt = new Map<string, { huntName: string; sessionCount: number; kills: Map<string, number> }>();
  for (const s of sessions) {
    const key = s.huntName.trim().toLowerCase();
    if (!key) continue;
    const cur = byHunt.get(key) ?? { huntName: s.huntName.trim(), sessionCount: 0, kills: new Map() };
    cur.sessionCount += 1;
    for (const k of s.hunting.kills) cur.kills.set(k.name, (cur.kills.get(k.name) ?? 0) + k.count);
    byHunt.set(key, cur);
  }
  return Array.from(byHunt.values())
    .map((h) => ({
      huntName: h.huntName,
      sessionCount: h.sessionCount,
      monsters: Array.from(h.kills, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    }))
    .filter((h) => h.monsters.length > 0)
    .sort((a, b) => b.sessionCount - a.sessionCount || a.huntName.localeCompare(b.huntName));
}

/**
 * Em quantos dias de jogo a task acaba jogando `hoursPerDay` por dia. Arredonda pra cima: 29,2 dias
 * de jogo = termina no 30º dia. Infinity se não dá pra estimar.
 */
export function playDays(estSec: number, hoursPerDay: number): number {
  if (!Number.isFinite(estSec) || !(hoursPerDay > 0)) return Infinity;
  if (estSec <= 0) return 0;
  // Tolerância pra conta exata (8h a 4h/dia = 2 dias, não 3 por erro de ponto flutuante).
  return Math.ceil(estSec / (hoursPerDay * 3600) - 1e-9);
}

/** Dia em que termina começando hoje (hoje conta como o 1º dia de jogo). null se não dá pra estimar. */
export function finishDate(estSec: number, hoursPerDay: number, start: Date): Date | null {
  const days = playDays(estSec, hoursPerDay);
  if (!Number.isFinite(days)) return null;
  const d = new Date(start);
  d.setDate(d.getDate() + Math.max(0, days - 1));
  return d;
}
