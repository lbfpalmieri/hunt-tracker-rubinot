import type { HuntSession } from "./store";
import { huntRawXp } from "./bounty";
import { MIN_HUNT_DURATION_SEC } from "./compare";

export interface PerformanceAgg {
  rawXph: number;
  totalRawXp: number;
  totalXp: number;
  gph: number;
  totalTime: number;
  xpTime: number;
  excludedBounty: number;
  balance: number;
  sessionCount: number;
  bestHunt: null | { name: string; gph: number };
}

/**
 * Aggregates a set of sessions into the headline performance numbers shown on
 * the Dashboard and on "Meu rendimento". Pulled out of Dashboard so both
 * pages compute the same thing — Dashboard passes every session, "Meu
 * rendimento" passes a period-filtered subset.
 *
 * `bestHuntSessions` (default: same as `sessions`) is the pool used just for
 * the "Top spot" comparison — Dashboard passes a patch-filtered subset there
 * so a pre-nerf spot can't outrank a post-nerf one, while Balance/Raw XP
 * still sum the character's whole history.
 */
export function aggregateSessions(sessions: HuntSession[], bestHuntSessions: HuntSession[] = sessions): PerformanceAgg {
  if (sessions.length === 0) {
    return {
      rawXph: 0,
      totalRawXp: 0,
      totalXp: 0,
      gph: 0,
      totalTime: 0,
      xpTime: 0,
      excludedBounty: 0,
      balance: 0,
      sessionCount: 0,
      bestHunt: null,
    };
  }
  const totalTime = sessions.reduce((a, s) => a + s.hunting.durationSec, 0);
  const totalXp = sessions.reduce((a, s) => a + s.hunting.xpGain, 0);
  // Sessions flagged as bounty without a known bonus amount can't be normalized,
  // so they stay out of the Raw XP figures instead of inflating them.
  const xpSessions = sessions.filter((s) => huntRawXp(s) != null);
  const excludedBounty = sessions.length - xpSessions.length;
  const totalRawXp = xpSessions.reduce((a, s) => a + (huntRawXp(s) as number), 0);
  const xpTime = xpSessions.reduce((a, s) => a + s.hunting.durationSec, 0);
  const totalBal = sessions.reduce((a, s) => a + s.hunting.balance, 0);
  const hoursTotal = totalTime / 3600 || 1;
  const rawXph = totalRawXp / (xpTime / 3600 || 1);
  const gph = totalBal / hoursTotal;

  const bySpot = new Map<string, { time: number; bal: number }>();
  for (const s of bestHuntSessions) {
    const cur = bySpot.get(s.huntName) ?? { time: 0, bal: 0 };
    cur.time += s.hunting.durationSec;
    cur.bal += s.hunting.balance;
    bySpot.set(s.huntName, cur);
  }
  let bestHunt: null | { name: string; gph: number } = null;
  for (const [name, v] of bySpot) {
    // Menos de 30min somados na hunt ainda não é dado suficiente pra virar "top spot".
    if (v.time < MIN_HUNT_DURATION_SEC) continue;
    const g = v.bal / (v.time / 3600 || 1);
    if (!bestHunt || g > bestHunt.gph) bestHunt = { name, gph: g };
  }

  return {
    rawXph,
    totalRawXp,
    totalXp,
    gph,
    totalTime,
    xpTime,
    excludedBounty,
    balance: totalBal,
    sessionCount: sessions.length,
    bestHunt,
  };
}

/** Sum of balance from a character's sessions created on/after a given date — used to drive goal progress. */
export function balanceSince(sessions: HuntSession[], characterId: string, sinceIso: string): number {
  return sessions
    .filter((s) => s.characterId === characterId && s.createdAt >= sinceIso)
    .reduce((a, s) => a + s.hunting.balance, 0);
}
