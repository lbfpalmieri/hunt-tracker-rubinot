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
    durationSec: durationToSec(get(/Session:\s*([\d:h\s]+)/)),
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

  // Explicit stop headers — each Misc block stops at the next known header
  // (or a blank line, or end of text). Prevents e.g. Imbuement bullets
  // bleeding into Charm when Charm section is empty.
  const HEADERS = ["Charm Data", "Imbuement Data", "Item Upgrade"] as const;

  const parseBlock = (header: (typeof HEADERS)[number]): Record<string, number> => {
    const others = HEADERS.filter((h) => h !== header).map((h) => h.replace(/\s+/g, "\\s+"));
    // Stop as soon as we hit another known header (with or without a leading newline),
    // a blank line, or end of text. Using a lookahead so the header itself is not consumed.
    const stop = `(?=\\n\\s*\\n|\\s*(?:${others.join("|")})\\b|$)`;
    const re = new RegExp(`${header.replace(/\s+/g, "\\s+")}[^\\n:]*:[ \\t]*\\n?([\\s\\S]*?)${stop}`, "i");
    const block = text.match(re);
    const out: Record<string, number> = {};
    if (!block) return out;
    for (const line of block[1].split("\n")) {
      const m = line.trim().match(/^-?\s*(.+?):\s*([\d.,]+)\s*([km]?)$/i);
      if (m) {
        let v = Number(m[2].replace(/[.,]/g, (c) => (c === "," ? "." : "")));
        if (Number.isNaN(v)) v = toNum(m[2]);
        const suffix = m[3].toLowerCase();
        if (suffix === "k") v *= 1000;
        if (suffix === "m") v *= 1_000_000;
        out[m[1].trim()] = v;
      }
    }
    return out;
  };

  return {
    sessionSec: session,
    charm: parseBlock("Charm Data"),
    imbuement: parseBlock("Imbuement Data"),
    itemUpgrade: parseBlock("Item Upgrade"),
  };
}

export function splitCombinedInput(text: string): {
  hunting: string;
  damage: string;
  misc: string;
} {
  // Heuristic split — users can paste all three blocks separated by blank lines or headers.
  const hunting = /Session data:[\s\S]*?(?=(?:\n\s*Received Damage|\n\s*Charm Data|$))/.exec(text)?.[0] ?? "";
  const damage = /Received Damage[\s\S]*?(?=(?:\n\s*Charm Data|\n\s*Session:|$))/.exec(text)?.[0] ?? "";
  const misc = /(?:^|\n)(?:- )?Session:[\s\S]*?Charm Data:[\s\S]*$/.exec(text)?.[0] ?? "";
  return { hunting: hunting.trim(), damage: damage.trim(), misc: misc.trim() };
}
