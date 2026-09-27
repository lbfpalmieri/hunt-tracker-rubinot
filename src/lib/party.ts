import type { HuntingData } from "./parser";

/**
 * Hunt em grupo (party). Quem não é o líder muitas vezes não pega loot nenhum — o Hunting
 * Analyser dele fecha com loot 0 e balance negativo, mesmo a party tendo lucrado. O que vale pra
 * cada membro é a DIVISÃO: o Party Hunt Analyser soma o balance de todos e cada um fica com
 * total ÷ membros (o jogo mostra quem transfere quanto pra quem).
 *
 * Com o Party Hunt Analyser colado, a sessão é salva já com a parte do usuário:
 *   balance = parte da divisão, loot = parte + supplies do próprio Hunting Analyser
 * e os números pessoais originais ficam em `personal` (dá pra desfazer). Assim todo o resto do
 * app (médias, ranking, comunidade) usa o lucro real da party sem precisar saber de party.
 * Sem o Party Hunt Analyser, a sessão só fica marcada como em grupo (tamanho) — sem divisão.
 */

export interface PartyMember {
  name: string;
  leader: boolean;
  loot: number;
  supplies: number;
  balance: number;
  damage: number;
  healing: number;
}

export interface PartyInfo {
  /** Jogadores na party (com o analyser = nº de membros). */
  size: number;
  /** Membros do Party Hunt Analyser. null = só informou o tamanho. */
  members: PartyMember[] | null;
  /** Qual membro é o personagem do usuário. */
  self: string | null;
  /** Loot/Balance do Hunting Analyser pessoal antes da divisão (pra desfazer / mostrar). */
  personal: { loot: number; balance: number } | null;
}

export const PARTY_MIN = 2;
export const PARTY_MAX = 10;

const toNum = (s: string): number => {
  const neg = s.trim().startsWith("-");
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
};

export interface ParsedPartyHunt {
  lootType: string | null;
  loot: number;
  supplies: number;
  balance: number;
  members: PartyMember[];
}

/**
 * Lê o export do Party Hunt Analyser ("Copy to clipboard"):
 *   Session data: From ... to ...
 *   Session: 01:08h
 *   Loot Type: Market
 *   Loot: 3,287,370 / Supplies: ... / Balance: ...
 *   Fulano (Leader)
 *       Loot: ... / Supplies: ... / Balance: ... / Damage: ... / Healing: ...
 *   Ciclano
 *       ...
 * Linha sem "Chave: valor" depois do cabeçalho = começa um membro.
 */
export function parsePartyHunt(text: string): ParsedPartyHunt | null {
  const head: Record<string, number> = {};
  let lootType: string | null = null;
  const members: PartyMember[] = [];
  let cur: PartyMember | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const kv = line.match(/^([A-Za-z /]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim().toLowerCase();
      const val = kv[2].trim();
      if (key === "loot type") {
        lootType = val || null;
        continue;
      }
      if (key === "session data" || key === "session") continue;
      const n = toNum(val);
      if (cur) {
        if (key === "loot") cur.loot = n;
        else if (key === "supplies") cur.supplies = n;
        else if (key === "balance") cur.balance = n;
        else if (key === "damage") cur.damage = n;
        else if (key === "healing") cur.healing = n;
      } else if (key === "loot" || key === "supplies" || key === "balance") {
        head[key] = n;
      }
      continue;
    }
    // Nome de membro (a linha não é "Chave: valor").
    const leader = /\(leader\)/i.test(line);
    const name = line.replace(/\s*\(leader\)\s*/i, "").trim().slice(0, 40);
    if (!name) continue;
    cur = { name, leader, loot: 0, supplies: 0, balance: 0, damage: 0, healing: 0 };
    members.push(cur);
  }
  if (members.length < 1) return null;
  const sum = (k: "loot" | "supplies" | "balance") => members.reduce((a, m) => a + m[k], 0);
  return {
    lootType,
    loot: head.loot ?? sum("loot"),
    supplies: head.supplies ?? sum("supplies"),
    balance: head.balance ?? sum("balance"),
    members,
  };
}

/** Parece o Party Hunt Analyser (e não o Hunting Analyser)? */
export function looksLikePartyHunt(text: string): boolean {
  if (/Killed Monsters:|Raw XP Gain:/i.test(text)) return false;
  const p = parsePartyHunt(text);
  return !!p && p.members.length >= 2;
}

export const partyBalance = (members: PartyMember[]) => members.reduce((a, m) => a + m.balance, 0);

/** Parte de cada um na divisão: balance total ÷ membros. */
export const partyShare = (members: PartyMember[]) =>
  members.length ? Math.round(partyBalance(members) / members.length) : 0;

const norm = (s: string) => s.trim().toLowerCase();

export function findSelf(members: PartyMember[], charName: string | null | undefined): string | null {
  if (!charName) return null;
  return members.find((m) => norm(m.name) === norm(charName))?.name ?? null;
}

/**
 * Quem transfere quanto pra quem pra todo mundo ficar com a mesma parte (como o jogo sugere):
 * quem ficou acima da parte paga quem ficou abaixo, maiores primeiro.
 */
export function partyTransfers(members: PartyMember[]): { from: string; to: string; amount: number }[] {
  const share = partyShare(members);
  const give = members
    .map((m) => ({ name: m.name, v: m.balance - share }))
    .filter((m) => m.v > 0)
    .sort((a, b) => b.v - a.v);
  const take = members
    .map((m) => ({ name: m.name, v: share - m.balance }))
    .filter((m) => m.v > 0)
    .sort((a, b) => b.v - a.v);
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < give.length && j < take.length) {
    const amount = Math.min(give[i].v, take[j].v);
    if (amount > 0) out.push({ from: give[i].name, to: take[j].name, amount });
    give[i].v -= amount;
    take[j].v -= amount;
    if (give[i].v <= 0) i++;
    if (take[j].v <= 0) j++;
  }
  return out;
}

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
  if (!party.members?.length || !party.self) {
    return { hunting: base, party: { ...party, personal: null } };
  }
  const share = partyShare(party.members);
  return {
    hunting: { ...base, balance: share, loot: share + base.supplies },
    party: { ...party, size: party.members.length, personal },
  };
}

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
        }))
    : null;
  const p = r.personal as Record<string, unknown> | null | undefined;
  return {
    size: Math.min(PARTY_MAX, size),
    members: members && members.length ? members : null,
    self: typeof r.self === "string" ? r.self : null,
    personal:
      p && typeof p === "object"
        ? { loot: Number(p.loot) || 0, balance: Number(p.balance) || 0 }
        : null,
  };
}

/** A divisão foi aplicada nessa sessão? */
export const isSplit = (party: PartyInfo | null | undefined) =>
  !!party?.members?.length && !!party.self && !!party.personal;

/** Hunting com os números pessoais de volta (desfaz a divisão, se tinha). */
export function unsplitHunting(hunting: HuntingData, party: PartyInfo | null): HuntingData {
  return party?.personal
    ? { ...hunting, loot: party.personal.loot, balance: party.personal.balance }
    : hunting;
}

/** Troca a party de uma sessão já salva: desfaz a divisão antiga e aplica a nova. */
export function resplit(hunting: HuntingData, oldParty: PartyInfo | null, next: PartyInfo | null) {
  return applyPartySplit(unsplitHunting(hunting, oldParty), next ? { ...next, personal: null } : null);
}
