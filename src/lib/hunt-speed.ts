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
    }
  >();
  for (const s of sessions) {
    const sessionPer = new Map<string, number>();
    let sessionKills = 0;
    for (const k of s.hunting.kills) {
      const idx = needles.indexOf(k.name.toLowerCase());
      if (idx === -1) continue;
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
    };
    cur.totalSec += s.hunting.durationSec;
    cur.totalKills += sessionKills;
    cur.sessionCount += 1;
    for (const [name, n] of sessionPer) cur.perMonster.set(name, (cur.perMonster.get(name) ?? 0) + n);
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
      };
    })
    .sort((a, b) => a.estSec - b.estSec);
}
