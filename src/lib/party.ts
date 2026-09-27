import { resolveDurationSec, type HuntingData } from "./parser";

/**
 * Hunt em grupo (party) — segue o que o cliente do RubinOT faz (OTClient, módulos
 * game_analyser/PartyHuntAnalyser.lua e game_lootsplitter/lootsplitter.lua):
 *
 * PARTY HUNT ANALYSER → botão direito → "Copy to Clipboard" copia:
 *   Session data: From 2026-09-26, 19:44:24 to 2026-09-26, 20:52:59
 *   Session: 01:08h
 *   Loot Type: Leader            (ou Market — preços do líder ou do market)
 *   Loot: 3,287,370
 *   Supplies: 1,212,946
 *   Balance: 2,074,424
 *   Lodrak (Leader)
 *   \tLoot: 3,287,370
 *   \tSupplies: 337,520
 *   \tBalance: 2,949,850         (= loot − supplies do membro)
 *   \tDamage: 5,020,221
 *   \tHealing: 441,227
 *   Outro Membro
 *   \t...
 * "Copy to LootSplitter" NÃO copia nada: só abre a janela LootSplitter do próprio cliente com
 * esse mesmo texto. O "Copy" dessa janela copia o RESULTADO — no cliente do RubinOT (export real
 * enviado pelo usuário em 2026-09-27):
 *   - Loot Splitter -
 *   From 2026-09-27, 06:21:19 to 2026-09-27, 07:10:20
 *
 *   Zork Ligth: 8,495,121          (balance de cada um)
 *   Emplacado: 673,187
 *
 *   Loot: 9,343,254
 *   Supplies: 174,946
 *   Profit: 9,168,308 (4,584,154 each)
 *
 *   Bank transfers:
 *   - Zork Ligth transfers 3,910,967 to Emplacado
 * (o OTClient base usa "- Total profit: X $ (Y $ each)" e "should transfer" — também aceito).
 * Os dois textos (Party Hunt e resultado) são aceitos aqui.
 *
 * MODO GRUPO: a sessão é registrada SÓ com esse texto (sem Hunting Analyser) — duração e datas da
 * sessão da party, loot/supplies/dano/cura da linha do usuário e o lucro = parte da divisão. Sem XP
 * nem criaturas (o analyser da party não traz): `noHuntingAnalyser` tira a sessão das médias de XP.
 *
 * DIVISÃO (igual ao LootSplitter do cliente): líder primeiro, depois os membros na ordem do texto;
 * cada um com balance − "extra cost" (gasto extra informado — ex. quem pagou imbuement/bless da
 * pt); membro "removido" fica fora. Média = soma ÷ membros; quem ficou ACIMA da média transfere
 * pra quem ficou ABAIXO, valores arredondados pra baixo, na ordem da lista. Cada um termina com a
 * média = o lucro de verdade de cada um na hunt.
 * Diferença proposital: no cliente o balance de um membro removido continua somando no total
 * (aí as transferências não fecham); aqui o removido sai por completo.
 *
 * A sessão é salva já com a parte do usuário: balance = média, loot = média + supplies do próprio
 * Hunting Analyser; os números pessoais originais ficam em `personal` (dá pra desfazer).
 */

export interface PartyMember {
  name: string;
  leader: boolean;
  loot: number;
  supplies: number;
  balance: number;
  damage: number;
  healing: number;
  /** Gasto extra do membro que entra na divisão (Advanced do LootSplitter). */
  extraCost?: number;
  /** Fora da divisão (Advanced do LootSplitter → remover). */
  removed?: boolean;
}

export interface PartyInfo {
  /** Jogadores na party. */
  size: number;
  /** Membros do Party Hunt Analyser. null = sem o analyser (só tamanho ou resultado do LootSplitter). */
  members: PartyMember[] | null;
  /** Qual membro é o personagem do usuário. */
  self: string | null;
  /** Loot/Balance do Hunting Analyser pessoal antes da divisão (pra desfazer / mostrar). */
  personal: { loot: number; balance: number } | null;
  /** Preços usados no analyser da party: do líder ou do market. */
  lootType?: "Leader" | "Market" | null;
  /** Duração da sessão da party (pra avisar se não bate com o Hunting Analyser). */
  sessionSec?: number | null;
  /** Veio do RESULTADO do LootSplitter ("X $ each"): parte de cada um já calculada. */
  splitterShare?: number | null;
  /** Transferências lidas do resultado do LootSplitter. */
  splitterTransfers?: PartyTransfer[] | null;
  /** De onde vieram os membros: Party Hunt Analyser (loot/supplies de cada um) ou resultado do LootSplitter (só balance). */
  source?: "analyser" | "splitter" | null;
  /** "2026-09-27, 06:21:19" — início/fim da sessão da party. */
  startedAt?: string | null;
  endedAt?: string | null;
  /** Sessão registrada só com o texto da party (Modo Grupo): sem XP, criaturas e loot por item. */
  noHuntingAnalyser?: boolean;
}

export interface PartyTransfer {
  from: string;
  to: string;
  amount: number;
}

export const PARTY_MIN = 2;
export const PARTY_MAX = 30;

/** "3,287,370" / "3.287.370" / "-272,478" → número. */
const toNum = (s: string): number => {
  const neg = /^\s*-/.test(s);
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
};

const durationSec = (s: string): number | null => {
  const m = s.match(/(\d+):(\d{2})/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 : null;
};

export interface ParsedPartyHunt {
  lootType: "Leader" | "Market" | null;
  sessionSec: number | null;
  startedAt: string | null;
  endedAt: string | null;
  loot: number;
  supplies: number;
  balance: number;
  members: PartyMember[];
}

/** "From 2026-09-27, 06:21:19 to 2026-09-27, 07:10:20" */
function fromTo(s: string): { from: string; to: string } | null {
  const m = s.match(
    /From\s+(\d{4}-\d{2}-\d{2},?\s*\d{1,2}:\d{2}(?::\d{2})?)\s+to\s+(\d{4}-\d{2}-\d{2},?\s*\d{1,2}:\d{2}(?::\d{2})?)/i,
  );
  return m ? { from: m[1].trim(), to: m[2].trim() } : null;
}

const KEY_RE =
  /(Session data|Session length|Session|Loot Type|Loot|Supplies|Balance|Damage|Healing):/g;
const NUM_KEYS = new Set(["Loot", "Supplies", "Balance", "Damage", "Healing"]);

/**
 * Lê o "Copy to Clipboard" do Party Hunt Analyser. Não depende de quebra de linha (o texto às
 * vezes chega numa linha só, colado de Discord/WhatsApp): o nome de cada membro é o que sobra
 * depois do número do campo anterior, até o próximo "Loot:".
 */
export function parsePartyHunt(text: string): ParsedPartyHunt | null {
  const matches = [...text.matchAll(KEY_RE)];
  if (!matches.length) return null;
  const head: Record<string, number> = {};
  let lootType: ParsedPartyHunt["lootType"] = null;
  let sessionSec: number | null = null;
  let range: { from: string; to: string } | null = null;
  const members: PartyMember[] = [];
  let cur: PartyMember | null = null;

  const startMember = (raw: string) => {
    const leader = /\(\s*leader\s*\)/i.test(raw);
    const name = raw
      .replace(/\(\s*leader\s*\)/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
    if (!name) return;
    cur = { name, leader, loot: 0, supplies: 0, balance: 0, damage: 0, healing: 0 };
    members.push(cur);
  };

  // Texto antes do primeiro campo pode ser o nome de um membro (analyser colado pela metade).
  const before = text.slice(0, matches[0].index).trim();
  if (before && !/session/i.test(before)) startMember(before);

  matches.forEach((m, i) => {
    const key = m[1];
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const seg = text.slice(m.index! + m[0].length, end);
    if (NUM_KEYS.has(key)) {
      const num = seg.match(/^\s*(-?\s*[\d.,]+)/);
      const value = num ? toNum(num[1]) : 0;
      const rest = (num ? seg.slice(num[0].length) : seg).trim();
      const k = key.toLowerCase() as "loot" | "supplies" | "balance" | "damage" | "healing";
      if (cur) cur[k] = value;
      else if (k === "loot" || k === "supplies" || k === "balance") head[k] = value;
      // O que sobra depois do número (ex.: "2,074,424\nLodrak (Leader)") é o próximo membro.
      if (rest) startMember(rest);
    } else if (key === "Loot Type") {
      const t = seg.trim().split(/\s+/)[0]?.toLowerCase();
      lootType = t === "market" ? "Market" : t === "leader" ? "Leader" : null;
    } else if (key === "Session" || key === "Session length") {
      sessionSec = durationSec(seg);
    } else if (key === "Session data") {
      range = fromTo(seg);
    }
  });

  if (!members.length) return null;
  const sum = (k: "loot" | "supplies" | "balance") => members.reduce((a, x) => a + x[k], 0);
  const r = range as { from: string; to: string } | null;
  return {
    lootType,
    sessionSec,
    startedAt: r?.from ?? null,
    endedAt: r?.to ?? null,
    loot: head.loot ?? sum("loot"),
    supplies: head.supplies ?? sum("supplies"),
    balance: head.balance ?? sum("balance"),
    members,
  };
}

export interface ParsedSplitterResult {
  total: number;
  each: number;
  transfers: PartyTransfer[];
  /** "Nome: balance" de cada membro (formato do RubinOT). */
  members: { name: string; balance: number }[];
  startedAt: string | null;
  endedAt: string | null;
}

const SPLITTER_KEYS = /^(loot|supplies|profit|total profit|from|bank transfers|session.*)$/i;

/** Lê o resultado copiado da janela LootSplitter (formato do RubinOT e do OTClient base). */
export function parseSplitterResult(text: string): ParsedSplitterResult | null {
  const tot = text.match(/Profit:\s*(-?[\d.,]+)\s*\$?\s*\(\s*(-?[\d.,]+)\s*\$?\s*each\s*\)/i);
  if (!tot) return null;
  const transfers: PartyTransfer[] = [];
  for (const m of text.matchAll(
    /-\s*([^\n]+?)\s+(?:should transfer|transfers)\s+([\d.,]+)\s+to\s+([^\n]+)/gi,
  )) {
    transfers.push({ from: m[1].trim(), to: m[3].trim(), amount: toNum(m[2]) });
  }
  const members: { name: string; balance: number }[] = [];
  for (const m of text.matchAll(/^[ \t]*([^:\n-][^:\n]*?)[ \t]*:[ \t]*(-?[\d.,]+)[ \t]*$/gm)) {
    const name = m[1].trim();
    if (!SPLITTER_KEYS.test(name)) members.push({ name: name.slice(0, 40), balance: toNum(m[2]) });
  }
  const r = fromTo(text);
  return {
    total: toNum(tot[1]),
    each: toNum(tot[2]),
    transfers,
    members,
    startedAt: r?.from ?? null,
    endedAt: r?.to ?? null,
  };
}

/** Parece o Party Hunt Analyser (e não o Hunting Analyser pessoal)? */
export function looksLikePartyHunt(text: string): boolean {
  if (/Killed Monsters:|Raw XP Gain:|XP Gain:/i.test(text)) return false;
  const p = parsePartyHunt(text);
  return !!p && p.members.length >= 1 && /Damage:/.test(text);
}

export const looksLikeSplitterResult = (text: string) => !!parseSplitterResult(text);

/** Qualquer um dos dois textos da party. */
export const looksLikePartyText = (text: string) =>
  looksLikePartyHunt(text) || looksLikeSplitterResult(text);

const norm = (s: string) => s.trim().toLowerCase();

export function findSelf(
  members: PartyMember[],
  charName: string | null | undefined,
): string | null {
  if (!charName) return null;
  return members.find((m) => norm(m.name) === norm(charName))?.name ?? null;
}

/** Party a partir de qualquer um dos textos (null = não reconheceu). */
export function partyFromText(text: string, charName: string | null | undefined): PartyInfo | null {
  const hunt = looksLikePartyHunt(text) ? parsePartyHunt(text) : null;
  if (hunt) {
    const members = hunt.members.slice(0, PARTY_MAX);
    return {
      size: Math.max(PARTY_MIN, members.length),
      members,
      self: findSelf(members, charName),
      personal: null,
      lootType: hunt.lootType,
      sessionSec: hunt.sessionSec,
      startedAt: hunt.startedAt,
      endedAt: hunt.endedAt,
      source: "analyser",
    };
  }
  const res = parseSplitterResult(text);
  // Formato do RubinOT: tem o balance de cada um → vira membro de verdade (divide igual ao jogo).
  if (res && res.members.length >= PARTY_MIN) {
    const members: PartyMember[] = res.members.slice(0, PARTY_MAX).map((m) => ({
      name: m.name,
      leader: false,
      loot: Math.max(0, m.balance),
      supplies: Math.max(0, -m.balance),
      balance: m.balance,
      damage: 0,
      healing: 0,
    }));
    return {
      size: members.length,
      members,
      self: findSelf(members, charName),
      personal: null,
      startedAt: res.startedAt,
      endedAt: res.endedAt,
      source: "splitter",
    };
  }
  if (res) {
    const names = new Set(res.transfers.flatMap((t) => [t.from, t.to]));
    const bySplit = res.each ? Math.round(res.total / res.each) : 0;
    return {
      size: Math.min(PARTY_MAX, Math.max(PARTY_MIN, bySplit || names.size)),
      members: null,
      self: null,
      personal: null,
      splitterShare: res.each,
      splitterTransfers: res.transfers,
      startedAt: res.startedAt,
      endedAt: res.endedAt,
      source: "splitter",
    };
  }
  return null;
}

/**
 * Hunting da sessão feita SÓ com o texto da party (Modo Grupo): números PESSOAIS da linha do
 * usuário (a divisão entra depois, em applyPartySplit). Sem XP, criaturas e itens.
 */
export function huntingFromParty(party: PartyInfo): HuntingData {
  const me = party.members?.find((m) => m.name === party.self);
  const startedAt = party.startedAt ?? null;
  const endedAt = party.endedAt ?? null;
  const durationSec =
    resolveDurationSec({ durationSec: 0, startedAt, endedAt }) || party.sessionSec || 0;
  const perHour = (v: number) => Math.round(v / (durationSec / 3600 || 1));
  const balance = me?.balance ?? 0;
  return {
    startedAt,
    endedAt,
    durationSec,
    rawXp: 0,
    xpGain: 0,
    xpPerHour: 0,
    rawXpPerHour: 0,
    loot: me ? me.loot : 0,
    supplies: me ? me.supplies : 0,
    balance,
    damage: me?.damage ?? 0,
    damagePerHour: perHour(me?.damage ?? 0),
    healing: me?.healing ?? 0,
    healingPerHour: perHour(me?.healing ?? 0),
    kills: [],
    lootedItems: [],
  };
}

/** Membros na ordem do LootSplitter do cliente: líder primeiro, depois a ordem do texto. */
const splitOrder = (members: PartyMember[]) => [
  ...members.filter((m) => m.leader),
  ...members.filter((m) => !m.leader),
];

export interface PartySplit {
  /** Membros que entram na divisão (sem os removidos), com balance − extra cost. */
  active: { name: string; balance: number }[];
  total: number;
  /** Parte de cada um (média), arredondada como o cliente mostra. */
  share: number;
  transfers: PartyTransfer[];
}

/** A divisão do LootSplitter do cliente (ver cabeçalho). */
export function computeSplit(members: PartyMember[]): PartySplit {
  const active = splitOrder(members)
    .filter((m) => !m.removed)
    .map((m) => ({ name: m.name, balance: m.balance - (m.extraCost ?? 0) }));
  const total = active.reduce((a, m) => a + m.balance, 0);
  const avg = active.length ? total / active.length : 0;
  const creditors = active
    .filter((m) => m.balance - avg > 0)
    .map((m) => ({ name: m.name, amount: m.balance - avg }));
  const debtors = active
    .filter((m) => m.balance - avg < 0)
    .map((m) => ({ name: m.name, amount: avg - m.balance }));
  const transfers: PartyTransfer[] = [];
  for (const d of debtors) {
    for (const c of creditors) {
      const amount = Math.floor(Math.min(d.amount, c.amount));
      if (amount > 0) {
        transfers.push({ from: c.name, to: d.name, amount });
        d.amount -= amount;
        c.amount -= amount;
        if (d.amount <= 0) break;
      }
    }
  }
  return { active, total, share: Math.round(avg), transfers };
}

/** Parte do usuário na divisão, ou null quando não dá pra dividir (sem analyser / fora da divisão). */
export function selfShare(party: PartyInfo | null | undefined): number | null {
  if (!party) return null;
  if (party.members?.length) {
    const me = party.members.find((m) => m.name === party.self);
    if (!me || me.removed) return null;
    return computeSplit(party.members).share;
  }
  return party.splitterShare ?? null;
}

/** Transferências a mostrar: calculadas dos membros ou lidas do resultado do LootSplitter. */
export function partyTransfers(party: PartyInfo): PartyTransfer[] {
  if (party.members?.length) return computeSplit(party.members).transfers;
  return party.splitterTransfers ?? [];
}

/** Comando do NPC do banco. */
export const transferCommand = (t: PartyTransfer) => `transfer ${t.amount} to ${t.to}`;

/**
 * Hunting do usuário com a divisão aplicada (ou sem, se não der pra dividir). Sempre parte dos
 * números PESSOAIS originais — chamar de novo com outra party não acumula.
 */
export function applyPartySplit(
  hunting: HuntingData,
  party: PartyInfo | null,
): { hunting: HuntingData; party: PartyInfo | null } {
  const personal = party?.personal ?? { loot: hunting.loot, balance: hunting.balance };
  const base: HuntingData = { ...hunting, loot: personal.loot, balance: personal.balance };
  if (!party) return { hunting: base, party: null };
  const share = selfShare(party);
  if (share == null) return { hunting: base, party: { ...party, personal: null } };
  const size = party.members?.length
    ? Math.max(PARTY_MIN, party.members.filter((m) => !m.removed).length)
    : party.size;
  return {
    hunting: { ...base, balance: share, loot: share + base.supplies },
    party: { ...party, size, personal },
  };
}

/** Hunting com os números pessoais de volta (desfaz a divisão, se tinha). */
export function unsplitHunting(hunting: HuntingData, party: PartyInfo | null): HuntingData {
  return party?.personal
    ? { ...hunting, loot: party.personal.loot, balance: party.personal.balance }
    : hunting;
}

/** Troca a party de uma sessão já salva: desfaz a divisão antiga e aplica a nova. */
export function resplit(hunting: HuntingData, oldParty: PartyInfo | null, next: PartyInfo | null) {
  return applyPartySplit(
    unsplitHunting(hunting, oldParty),
    next ? { ...next, personal: null } : null,
  );
}

/** A divisão foi aplicada nessa sessão? */
export const isSplit = (party: PartyInfo | null | undefined) => !!party?.personal;

/** Lê o jsonb salvo. Qualquer coisa estranha vira null (= sessão solo). */
export function normalizeParty(raw: unknown): PartyInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const size = Math.round(Number(r.size));
  if (!Number.isFinite(size) || size < PARTY_MIN) return null;
  const members = Array.isArray(r.members)
    ? (r.members as Record<string, unknown>[])
        .filter((m) => m && typeof m.name === "string")
        .map((m) => ({
          name: String(m.name).slice(0, 40),
          leader: m.leader === true,
          loot: Number(m.loot) || 0,
          supplies: Number(m.supplies) || 0,
          balance: Number(m.balance) || 0,
          damage: Number(m.damage) || 0,
          healing: Number(m.healing) || 0,
          ...(Number(m.extraCost) ? { extraCost: Number(m.extraCost) } : {}),
          ...(m.removed === true ? { removed: true } : {}),
        }))
        .slice(0, PARTY_MAX)
    : null;
  const p = r.personal as Record<string, unknown> | null | undefined;
  const transfers = Array.isArray(r.splitterTransfers)
    ? (r.splitterTransfers as Record<string, unknown>[])
        .filter((t) => t && typeof t.from === "string" && typeof t.to === "string")
        .map((t) => ({
          from: String(t.from).slice(0, 40),
          to: String(t.to).slice(0, 40),
          amount: Number(t.amount) || 0,
        }))
        .slice(0, 60)
    : null;
  return {
    size: Math.min(PARTY_MAX, size),
    members: members && members.length ? members : null,
    self: typeof r.self === "string" ? r.self : null,
    personal:
      p && typeof p === "object"
        ? { loot: Number(p.loot) || 0, balance: Number(p.balance) || 0 }
        : null,
    lootType: r.lootType === "Leader" || r.lootType === "Market" ? r.lootType : null,
    sessionSec: Number(r.sessionSec) > 0 ? Number(r.sessionSec) : null,
    splitterShare: typeof r.splitterShare === "number" ? r.splitterShare : null,
    splitterTransfers: transfers && transfers.length ? transfers : null,
    source: r.source === "analyser" || r.source === "splitter" ? r.source : null,
    startedAt: typeof r.startedAt === "string" ? r.startedAt.slice(0, 30) : null,
    endedAt: typeof r.endedAt === "string" ? r.endedAt.slice(0, 30) : null,
    ...(r.noHuntingAnalyser === true ? { noHuntingAnalyser: true } : {}),
  };
}
