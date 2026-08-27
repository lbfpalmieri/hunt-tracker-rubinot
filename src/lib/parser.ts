// Parsers for RubinOT / Tibia analyser text exports.
// Tolerant to `.` and `,` as thousand separators.

const toNum = (s: string): number => {
  const cleaned = s.replace(/[.,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const durationToSec = (s: string): number => {
  const m = s.match(/(\d+):(\d+)(?::(\d+))?/);
  if (!m) return 0;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  const se = Number(m[3] ?? "0");
  return h * 3600 + mi * 60 + se;
};

/** "2026-08-27, 05:36:39" -> ms (local). Devolve null quando não dá pra ler. */
export const parseSessionStamp = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const t = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6] ?? "0"),
  ).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Alguns logs do RubinOT não trazem a linha "Session: HH:MM" — nesses casos a
 * duração vem do intervalo "Session data: From ... to ..." ou do
 * Miscellaneous ("Session: HH:MM:SS").
 */
export const resolveDurationSec = (
  hunting: { durationSec?: number; startedAt?: string | null; endedAt?: string | null },
  miscSessionSec?: number | null,
): number => {
  const direct = Number(hunting?.durationSec ?? 0);
  if (direct > 0) return direct;
  const start = parseSessionStamp(hunting?.startedAt);
  const end = parseSessionStamp(hunting?.endedAt);
  if (start != null && end != null && end > start) return Math.round((end - start) / 1000);
  return Number(miscSessionSec ?? 0) || 0;
};


export interface HuntingData {
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number;
  rawXp: number;
  xpGain: number;
  xpPerHour: number;
  rawXpPerHour: number;
  loot: number;
  supplies: number;
  balance: number;
  damage: number;
  damagePerHour: number;
  healing: number;
  healingPerHour: number;
  kills: { name: string; count: number }[];
  lootedItems: { name: string; count: number }[];
}

export interface DamageData {
  totalReceived: number;
  maxDps: number;
  damageTypes: { type: string; value: number; pct: number }[];
  damageSources: { source: string; value: number; pct: number }[];
}

export interface MiscData {
  sessionSec: number;
  charm: Record<string, number>;
  imbuement: Record<string, number>;
  itemUpgrade: Record<string, number>;
}

export function parseHunting(text: string): HuntingData {
  const get = (re: RegExp) => text.match(re)?.[1]?.trim() ?? "";
  const rangeMatch = text.match(
    /Session data:\s*From\s+([\d\-:\s,]+?)\s+to\s+([\d\-:\s,]+?)$/m,
  );

  const kills: HuntingData["kills"] = [];
  const killsBlock = text.match(/Killed Monsters:\s*([\s\S]*?)(?:Looted Items:|$)/);
  if (killsBlock) {
    for (const line of killsBlock[1].split("\n")) {
      const m = line.trim().match(/^(\d+)x\s+(.+)$/);
      if (m) kills.push({ count: Number(m[1]), name: m[2].trim() });
    }
  }

  const items: HuntingData["lootedItems"] = [];
  const itemsBlock = text.match(/Looted Items:\s*([\s\S]*)$/);
  if (itemsBlock) {
    for (const line of itemsBlock[1].split("\n")) {
      const m = line.trim().match(/^(\d+)x\s+(.+)$/);
      if (m) items.push({ count: Number(m[1]), name: m[2].trim() });
    }
  }

  return {
    startedAt: rangeMatch?.[1]?.trim() ?? null,
    endedAt: rangeMatch?.[2]?.trim() ?? null,
    durationSec: resolveDurationSec({
      durationSec: durationToSec(get(/Session(?:\s*length)?:\s*([\d:h\s]+)/)),
      startedAt: rangeMatch?.[1]?.trim() ?? null,
      endedAt: rangeMatch?.[2]?.trim() ?? null,
    }),

    rawXp: toNum(get(/Raw XP Gain:\s*([\d.,]+)/)),
    xpGain: toNum(get(/(?<!Raw )XP Gain:\s*([\d.,]+)/)),
    xpPerHour: toNum(get(/(?<!Raw )XP\/h:\s*([\d.,]+)/)),
    rawXpPerHour: toNum(get(/Raw XP\/h:\s*([\d.,]+)/)),
    loot: toNum(get(/^Loot:\s*([\d.,]+)/m)),
    supplies: toNum(get(/Supplies:\s*([\d.,]+)/)),
    balance: (() => {
      const raw = get(/Balance:\s*(-?[\d.,]+)/);
      const n = toNum(raw);
      return raw.trim().startsWith("-") ? -n : n;
    })(),
    damage: toNum(get(/^Damage:\s*([\d.,]+)/m)),
    damagePerHour: toNum(get(/Damage\/h:\s*([\d.,]+)/)),
    healing: toNum(get(/^Healing:\s*([\d.,]+)/m)),
    healingPerHour: toNum(get(/Healing\/h:\s*([\d.,]+)/)),
    kills,
    lootedItems: items,
  };
}

export function parseDamage(text: string): DamageData {
  const total = toNum(text.match(/Total:\s*([\d.,]+)/)?.[1] ?? "0");
  const max = toNum(text.match(/Max-DPS:\s*([\d.,]+)/)?.[1] ?? "0");

  const parseSection = (header: string) => {
    const block = text.match(
      new RegExp(`${header}\\s*([\\s\\S]*?)(?:\\n\\s*[A-Z][\\w -]+\\n|$)`),
    );
    const out: { name: string; value: number; pct: number }[] = [];
    if (!block) return out;
    for (const line of block[1].split("\n")) {
      const m = line.trim().match(/^(.+?)\s+([\d.,]+)\s*\(([\d.,]+)%\)/);
      if (m) out.push({ name: m[1].trim(), value: toNum(m[2]), pct: Number(m[3].replace(",", ".")) });
    }
    return out;
  };

  const types = parseSection("Damage Types").map((x) => ({ type: x.name, value: x.value, pct: x.pct }));
  const sources = parseSection("Damage Sources").map((x) => ({ source: x.name, value: x.value, pct: x.pct }));

  return { totalReceived: total, maxDps: max, damageTypes: types, damageSources: sources };
}

export function parseMiscellaneous(text: string): MiscData {
  const session = durationToSec(text.match(/Session:\s*([\d:h\s]+)/)?.[1] ?? "");

  type MiscKey = "charm" | "imbuement" | "itemUpgrade";

  const out: Record<MiscKey, Record<string, number>> = {
    charm: {},
    imbuement: {},
    itemUpgrade: {},
  };

  const getHeader = (line: string): MiscKey | null => {
    const cleaned = line
      .replace(/^[-•]+\s*/, "")
      .replace(/:$/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    if (cleaned === "charm" || cleaned === "charm data") return "charm";
    if (cleaned === "imbuement" || cleaned === "imbuement data") return "imbuement";
    if (cleaned === "item upgrade") return "itemUpgrade";
    return null;
  };

  const parseValue = (raw: string): number => {
    const value = raw.trim().match(/^([\d.,]+)\s*([km]?)$/i);
    if (!value) return 0;

    const [, numberText, suffixRaw] = value;
    const suffix = suffixRaw.toLowerCase();
    let parsed: number;

    if (suffix) {
      parsed = Number(numberText.replace(/,/g, "."));
    } else {
      parsed = toNum(numberText);
    }

    if (!Number.isFinite(parsed)) return 0;
    if (suffix === "k") parsed *= 1000;
    if (suffix === "m") parsed *= 1_000_000;
    return parsed;
  };

  const parseEntry = (line: string): { name: string; value: number } | null => {
    const cleaned = line.replace(/^[-•]+\s*/, "").trim();
    if (!cleaned || /^no data yet$/i.test(cleaned)) return null;

    const colon = cleaned.match(/^(.+?):\s*([\d.,]+\s*[km]?)$/i);
    const spaced = cleaned.match(/^(.+?)\s+([\d.,]+\s*[km]?)$/i);
    const match = colon ?? spaced;
    if (!match) return null;

    return { name: match[1].trim(), value: parseValue(match[2]) };
  };

  let current: MiscKey | null = null;
  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line || /^Session:/i.test(line)) continue;

    const header = getHeader(line);
    if (header) {
      current = header;
      continue;
    }

    if (!current) continue;

    const entry = parseEntry(line);
    if (entry) out[current][entry.name] = entry.value;
  }

  return {
    sessionSec: session,
    charm: out.charm,
    imbuement: out.imbuement,
    itemUpgrade: out.itemUpgrade,
  };
}

export function splitCombinedInput(text: string): {
  hunting: string;
  damage: string;
  misc: string;
} {
  // Heuristic split — users can paste all three blocks separated by blank lines or headers.
  const miscStart = String.raw`\n\s*(?:Charm(?:\s+Data)?|Imbuement(?:\s+Data)?|Item Upgrade)\s*:?`;
  const hunting = new RegExp(String.raw`Session data:[\s\S]*?(?=(?:\n\s*Received Damage|${miscStart}|$))`).exec(text)?.[0] ?? "";
  const damage = new RegExp(String.raw`Received Damage[\s\S]*?(?=(?:${miscStart}|\n\s*Session:|$))`).exec(text)?.[0] ?? "";
  const misc = new RegExp(String.raw`(?:^|\n)(?:-\s*)?Session:[\s\S]*?(?:Charm(?:\s+Data)?|Imbuement(?:\s+Data)?|Item Upgrade)\s*:?[\s\S]*$`, "i").exec(text)?.[0] ?? "";
  return { hunting: hunting.trim(), damage: damage.trim(), misc: misc.trim() };
}
