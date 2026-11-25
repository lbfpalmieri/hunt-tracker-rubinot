import { huntRawXp, type BountyInfo } from "./bounty";

/**
 * Painel de Bounty: junta as sessões que registraram uma Bounty e mostra, por criatura da task,
 * em qual ritmo ela cai. Regra do app: todo "/h" = total ÷ duração da própria sessão; a média da
 * criatura soma as kills e o tempo de todas as tasks (não tira média de médias) e o "melhor" é o
 * maior ritmo de uma sessão só.
 */
export interface BountyPanelSession {
  characterId: string;
  hunting: {
    durationSec: number;
    balance: number;
    rawXp: number;
    xpGain: number;
    kills: { name: string; count: number }[];
  };
  bounty?: BountyInfo | null;
  party?: { noHuntingAnalyser?: boolean } | null;
}

export interface BountyCreatureRow {
  /** Nome da criatura como foi registrado na primeira task. */
  creature: string;
  /** Sessões (tasks) registradas com essa criatura. */
  tasks: number;
  /** Tasks com abates e tempo suficientes pra calcular ritmo. */
  measuredTasks: number;
  /** Abates/h da criatura da task: total de abates ÷ total de horas. */
  avgKillsPerHour: number | null;
  /** Maior abates/h de uma sessão só. */
  bestKillsPerHour: number | null;
  /** Tempo médio de uma task fechada, em segundos (a sessão vai até a task fechar). */
  avgTaskSec: number | null;
  /** Raw XP/h da hunt (sem a XP do prêmio da Bounty); null sem XP conhecida. */
  xpPerHour: number | null;
  /** Lucro/h dessas sessões. */
  profitPerHour: number | null;
}

export function normalizeCreature(name: string): string {
  return name.trim().toLowerCase();
}

/** Criatura da Bounty da sessão (as antigas, sem criatura registrada, não entram no painel). */
export function bountyCreatureOf(s: BountyPanelSession): string | null {
  const c = s.bounty?.creature?.trim();
  return c ? c : null;
}

export function bountyCreatureKills(s: BountyPanelSession, creature: string): number {
  const needle = normalizeCreature(creature);
  return s.hunting.kills.reduce((sum, k) => (normalizeCreature(k.name) === needle ? sum + k.count : sum), 0);
}

export function buildBountyPanel(
  sessions: BountyPanelSession[],
  filter: { characterId?: string | null; difficulty?: string | null } = {},
): BountyCreatureRow[] {
  const groups = new Map<
    string,
    {
      creature: string;
      tasks: number;
      kills: number;
      sec: number;
      measured: number;
      best: number;
      xp: number;
      xpSec: number;
      balance: number;
    }
  >();
  for (const s of sessions) {
    const creature = bountyCreatureOf(s);
    if (!creature) continue;
    if (filter.characterId && s.characterId !== filter.characterId) continue;
    if (filter.difficulty && s.bounty?.difficulty !== filter.difficulty) continue;
    const key = normalizeCreature(creature);
    const g = groups.get(key) ?? {
      creature,
      tasks: 0,
      kills: 0,
      sec: 0,
      measured: 0,
      best: 0,
      xp: 0,
      xpSec: 0,
      balance: 0,
    };
    g.tasks += 1;
    const sec = s.hunting.durationSec;
    const kills = bountyCreatureKills(s, creature);
    if (sec > 0 && kills > 0) {
      g.measured += 1;
      g.kills += kills;
      g.sec += sec;
      g.balance += s.hunting.balance;
      g.best = Math.max(g.best, kills / (sec / 3600));
      const xp = huntRawXp(s);
      if (xp != null) {
        g.xp += xp;
        g.xpSec += sec;
      }
    }
    groups.set(key, g);
  }
  return Array.from(groups.values())
    .map((g): BountyCreatureRow => {
      const hours = g.sec / 3600;
      return {
        creature: g.creature,
        tasks: g.tasks,
        measuredTasks: g.measured,
        avgKillsPerHour: g.measured > 0 ? g.kills / hours : null,
        bestKillsPerHour: g.measured > 0 ? g.best : null,
        avgTaskSec: g.measured > 0 ? g.sec / g.measured : null,
        xpPerHour: g.xpSec > 0 ? g.xp / (g.xpSec / 3600) : null,
        profitPerHour: g.measured > 0 ? g.balance / hours : null,
      };
    })
    .sort(
      (a, b) =>
        (b.avgKillsPerHour ?? -1) - (a.avgKillsPerHour ?? -1) || a.creature.localeCompare(b.creature),
    );
}
