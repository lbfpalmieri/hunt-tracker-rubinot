import type { HuntingData } from "../parser";
import type { HuntSession } from "../store";

/**
 * Textos de exemplo dos testes. Os marcados "export real" foram copiados do cliente do RubinOT
 * (enviados pelo usuário); os demais seguem o formato documentado em party.ts / parser.ts.
 */

/** Hunting Analyser — export real (2026-09-28), lista de itens encurtada. */
export const HUNT_TEXT = `Session data: From 2026-09-28, 13:16:35 to 2026-09-28, 14:20:35
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

/** Party Hunt Analyser do RubinOT — export real (2026-09-29): formato do Hunting Analyser, sem membros. */
export const RUBINOT_PARTY_TEXT = `Session data: From 2026-09-29, 10:27:27 to 2026-09-29, 11:39:37
Session: 01:12h
Raw XP Gain: 0
XP Gain: 0
XP/h: 0
Raw XP/h: 0
Loot: 1,942,481
Supplies: 152,970
Balance: 1,789,511
Damage: 5,021,554
Damage/h: 4,174,964
Healing: 981,433
Healing/h: 815,972
Killed Monsters:
	None
Looted Items:
	None`;

/** Party Hunt Analyser no formato do OTClient (com membros) — exemplo do cabeçalho de party.ts. */
export const OTCLIENT_PARTY_TEXT = `Session data: From 2026-09-26, 19:44:24 to 2026-09-26, 20:52:59
Session: 01:08h
Loot Type: Leader
Loot: 3,287,370
Supplies: 1,212,946
Balance: 2,074,424
Lodrak (Leader)
	Loot: 3,287,370
	Supplies: 337,520
	Balance: 2,949,850
	Damage: 5,020,221
	Healing: 441,227
Meu Char
	Loot: 0
	Supplies: 875,426
	Balance: -875,426
	Damage: 3,000,000
	Healing: 200,000`;

/** Resultado do LootSplitter do RubinOT — export real (2026-09-27). */
export const SPLITTER_TEXT = `- Loot Splitter -
From 2026-09-27, 06:21:19 to 2026-09-27, 07:10:20

Zork Ligth: 8,495,121
Emplacado: 673,187

Loot: 9,343,254
Supplies: 174,946
Profit: 9,168,308 (4,584,154 each)

Bank transfers:
- Zork Ligth transfers 3,910,967 to Emplacado`;

/** Input Analyser (dano recebido) — formato esperado por parseDamage. */
export const INPUT_TEXT = `Received Damage
Total: 1,234,567
Max-DPS: 2,345
Damage Types
	Physical 800,000 (64.8%)
	Fire 434,567 (35.2%)
Damage Sources:
	Gloom Maw 700,000 (56.7%)
	Varg 534,567 (43.3%)`;

/** Miscellaneous — formato esperado por parseMiscellaneous. */
export const MISC_TEXT = `Session: 01:04:10
Charm Data:
	Low Blow: 1,234
Imbuement Data:
	Vampirism 2.5k
Item Upgrade:
	No data yet`;

export function makeHunting(over: Partial<HuntingData> = {}): HuntingData {
  return {
    startedAt: null,
    endedAt: null,
    durationSec: 3600,
    rawXp: 1_000_000,
    xpGain: 1_500_000,
    xpPerHour: 1_500_000,
    rawXpPerHour: 1_000_000,
    loot: 500_000,
    supplies: 100_000,
    balance: 400_000,
    damage: 2_000_000,
    damagePerHour: 2_000_000,
    healing: 300_000,
    healingPerHour: 300_000,
    kills: [],
    lootedItems: [],
    ...over,
  };
}

let seq = 0;
export function makeSession(
  over: Partial<Omit<HuntSession, "hunting">> & { hunting?: Partial<HuntingData> } = {},
): HuntSession {
  const { hunting, ...rest } = over;
  seq += 1;
  return {
    id: `s${seq}`,
    characterId: "char-1",
    huntName: "Asura",
    createdAt: "2026-10-01T12:00:00.000Z",
    damage: null,
    misc: null,
    gearUrl: null,
    isPublic: false,
    bounty: null,
    prey: null,
    notes: null,
    setup: null,
    party: null,
    ...rest,
    hunting: makeHunting(hunting),
  };
}
