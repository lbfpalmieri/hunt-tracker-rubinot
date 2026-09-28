import { parseSessionStamp } from "./parser";
import type { HuntSession } from "./store";

/**
 * Exporta uma sessão (ou a média de uma hunt) no MESMO texto do "Copy to Clipboard" do Hunting
 * Analyser do cliente (OTClient/RubinOT — modules/game_analyser/classes/HuntingAnalyser.lua):
 *
 *   Session data: From 2026-09-27, 06:21:19 to 2026-09-27, 07:10:20
 *   Session: 00:49h
 *   Raw XP Gain: 1,234,567
 *   XP Gain: ...  /  XP/h  /  Raw XP/h  /  Loot  /  Supplies  /  Balance  /  Damage  /  Damage/h
 *   Healing  /  Healing/h
 *   Killed Monsters:
 *   \t5x Lion
 *   Looted Items:
 *   \t2x gold coin
 *
 * Serve pra colar em ferramentas que leem o analyser do jogo (ex.: Guia de Build do Miguelnut →
 * "Hunt personalizada"). A média da hunt vira 1 hora no ritmo médio (tudo ÷ horas), inclusive
 * kills/h — é a "densidade média" da hunt.
 */

const n = (v: number) => Math.round(v).toLocaleString("en-US");

const pad = (v: number) => String(v).padStart(2, "0");
const stamp = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const hhmm = (sec: number) =>
  `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}h`;

interface AnalyserData {
  startMs: number;
  durationSec: number;
  rawXp: number;
  xp: number;
  loot: number;
  supplies: number;
  balance: number;
  damage: number;
  healing: number;
  kills: { name: string; count: number }[];
  items: { name: string; count: number }[];
}

function render(d: AnalyserData): string {
  const h = d.durationSec / 3600 || 1;
  const list = (rows: { name: string; count: number }[]) =>
    rows.length
      ? rows
          .slice()
          .sort((a, b) => b.count - a.count)
          .map((r) => `\t${r.count}x ${r.name}`)
          .join("\n")
      : "\tNone";
  return [
    `Session data: From ${stamp(d.startMs)} to ${stamp(d.startMs + d.durationSec * 1000)}`,
    `Session: ${hhmm(d.durationSec)}`,
    `Raw XP Gain: ${n(d.rawXp)}`,
    `XP Gain: ${n(d.xp)}`,
    `XP/h: ${n(d.xp / h)}`,
    `Raw XP/h: ${n(d.rawXp / h)}`,
    `Loot: ${n(d.loot)}`,
    `Supplies: ${n(d.supplies)}`,
    `Balance: ${n(d.balance)}`,
    `Damage: ${n(d.damage)}`,
    `Damage/h: ${n(d.damage / h)}`,
    `Healing: ${n(d.healing)}`,
    `Healing/h: ${n(d.healing / h)}`,
    `Killed Monsters:`,
    list(d.kills),
    `Looted Items:`,
    list(d.items),
  ].join("\n");
}

/** Início da sessão: o "From" do analyser original; senão, fim (criação) − duração. */
function startOf(s: HuntSession): number {
  const from = parseSessionStamp(s.hunting.startedAt);
  if (from != null) return from;
  return new Date(s.createdAt).getTime() - s.hunting.durationSec * 1000;
}

/** A sessão salva, no formato do Hunting Analyser do jogo. */
export function exportSessionAnalyser(s: HuntSession): string {
  const h = s.hunting;
  return render({
    startMs: startOf(s),
    durationSec: h.durationSec,
    rawXp: h.rawXp || h.xpGain,
    xp: h.xpGain || h.rawXp,
    loot: h.loot,
    supplies: h.supplies,
    balance: h.balance,
    damage: h.damage,
    healing: h.healing,
    kills: h.kills,
    items: h.lootedItems,
  });
}

/**
 * Média da hunt como 1 hora no ritmo médio das sessões: cada total ÷ horas somadas (XP só das
 * sessões que têm XP). Kills e itens por hora, arredondados (some o que dá menos de 1/h).
 */
export function exportHuntAverageAnalyser(sessions: HuntSession[]): string {
  const totalSec = sessions.reduce((a, s) => a + s.hunting.durationSec, 0);
  const hours = totalSec / 3600 || 1;
  const withXp = sessions.filter((s) => (s.hunting.rawXp || s.hunting.xpGain) > 0);
  const xpHours = withXp.reduce((a, s) => a + s.hunting.durationSec, 0) / 3600 || 1;
  const sum = (f: (s: HuntSession) => number) => sessions.reduce((a, s) => a + f(s), 0);
  const perHour = (rows: { name: string; count: number }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.name, (m.get(r.name) ?? 0) + r.count);
    return [...m.entries()]
      .map(([name, c]) => ({ name, count: Math.round(c / hours) }))
      .filter((r) => r.count > 0);
  };
  const latest = Math.max(...sessions.map((s) => new Date(s.createdAt).getTime()));
  return render({
    startMs: latest - 3600 * 1000,
    durationSec: 3600,
    rawXp: withXp.reduce((a, s) => a + (s.hunting.rawXp || s.hunting.xpGain), 0) / xpHours,
    xp: withXp.reduce((a, s) => a + (s.hunting.xpGain || s.hunting.rawXp), 0) / xpHours,
    loot: sum((s) => s.hunting.loot) / hours,
    supplies: sum((s) => s.hunting.supplies) / hours,
    balance: sum((s) => s.hunting.balance) / hours,
    damage: sum((s) => s.hunting.damage) / hours,
    healing: sum((s) => s.hunting.healing) / hours,
    kills: perHour(sessions.flatMap((s) => s.hunting.kills)),
    items: perHour(sessions.flatMap((s) => s.hunting.lootedItems)),
  });
}
