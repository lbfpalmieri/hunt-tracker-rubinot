import { fixBalanceSign, parseHunting } from "./parser";

/**
 * Exemplo da landing: um Hunting Analyser REAL do RubinOT (o mesmo export dos testes, sem nome de
 * ninguém), lido pelo mesmo parser do app. Assim a prévia mostra exatamente o que o app calcula —
 * nada de número inventado. Os "/h" seguem a regra do app: total ÷ duração da própria sessão.
 */
export const LANDING_SAMPLE_TEXT = `Session data: From 2026-09-28, 13:16:35 to 2026-09-28, 14:20:35
Session: 01:04h
Raw XP Gain: 10,640,217
XP Gain: 65,235,290
XP/h: 61,158,084
Raw XP/h: 9,975,203
Loot: 2,665,021
Supplies: 12,886
Balance: 2,652,135
Damage: 9,210,557
Damage/h: 8,634,897
Healing: 2,956,525
Healing/h: 2,771,742
Killed Monsters:
	571x Orclops Bloodbreaker
	459x Gloom Maw
	402x Dworc Shadowstalker
	150x Norcferatu Heartless
	135x Norcferatu Nightweaver
	90x Varg
	1x Haunted Treeling
	1x Tarantula
Looted Items:
	17166x platinum coin
	90x small ruby
	75x orcish toothbrush
	1x wand of defiance`;

export interface LandingSample {
  durationSec: number;
  rawXp: number;
  loot: number;
  supplies: number;
  balance: number;
  rawXpPerHour: number;
  balancePerHour: number;
  kills: number;
  killsPerHour: number;
  topKills: { name: string; count: number }[];
}

export function landingSample(text: string = LANDING_SAMPLE_TEXT): LandingSample {
  const h = fixBalanceSign(parseHunting(text));
  const hours = h.durationSec > 0 ? h.durationSec / 3600 : 0;
  const perHour = (total: number) => (hours > 0 ? Math.round(total / hours) : 0);
  const kills = h.kills.reduce((sum, k) => sum + k.count, 0);
  return {
    durationSec: h.durationSec,
    rawXp: h.rawXp,
    loot: h.loot,
    supplies: h.supplies,
    balance: h.balance,
    rawXpPerHour: perHour(h.rawXp),
    balancePerHour: perHour(h.balance),
    kills,
    killsPerHour: perHour(kills),
    topKills: [...h.kills].sort((a, b) => b.count - a.count).slice(0, 4),
  };
}
