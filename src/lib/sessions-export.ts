import { huntRawXp } from "./bounty";
import type { Character, HuntSession } from "./store";

/**
 * Exportar TODAS as sessões do jogador (CSV pra planilha, JSON pra backup). Tudo calculado no
 * navegador, sem banco. Cada "/h" é o total ÷ duração da própria sessão (regra do app).
 * Observações (notes) ficam de fora: o arquivo é pra números.
 */
export interface SessionExportRow {
  date: string;
  hunt: string;
  character: string;
  vocation: string;
  mode: "solo" | "grupo";
  durationMin: number;
  balance: number;
  balancePerHour: number;
  rawXp: number | null;
  rawXpPerHour: number | null;
  xpGain: number;
  loot: number;
  supplies: number;
  damage: number;
  healing: number;
  kills: number;
  killsPerHour: number;
  bounty: boolean;
  prey: boolean;
  isPublic: boolean;
}

const per = (total: number, hours: number) => Math.round(total / hours);

export function buildSessionRows(
  sessions: HuntSession[],
  characters: Pick<Character, "id" | "name" | "vocation">[],
): SessionExportRow[] {
  return sessions
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((s) => {
      const c = characters.find((x) => x.id === s.characterId);
      const h = s.hunting;
      const hours = h.durationSec / 3600 || 1;
      const raw = huntRawXp(s);
      const kills = h.kills.reduce((a, k) => a + k.count, 0);
      return {
        date: s.createdAt.slice(0, 10),
        hunt: s.huntName,
        character: c?.name ?? "",
        vocation: c?.vocation ?? "",
        mode: s.party ? "grupo" : "solo",
        durationMin: Math.round(h.durationSec / 60),
        balance: Math.round(h.balance),
        balancePerHour: per(h.balance, hours),
        rawXp: raw == null ? null : Math.round(raw),
        rawXpPerHour: raw == null ? null : per(raw, hours),
        xpGain: Math.round(h.xpGain),
        loot: Math.round(h.loot),
        supplies: Math.round(h.supplies),
        damage: Math.round(h.damage),
        healing: Math.round(h.healing),
        kills,
        killsPerHour: per(kills, hours),
        bounty: !!s.bounty,
        prey: !!s.prey?.length,
        isPublic: s.isPublic,
      };
    });
}

/** Cabeçalho do CSV, em português, na mesma ordem das colunas de `SessionExportRow`. */
const CSV_COLUMNS: [keyof SessionExportRow, string][] = [
  ["date", "Data"],
  ["hunt", "Hunt"],
  ["character", "Personagem"],
  ["vocation", "Vocação"],
  ["mode", "Modo"],
  ["durationMin", "Duração (min)"],
  ["balance", "Balance (gold)"],
  ["balancePerHour", "Balance/h (gold)"],
  ["rawXp", "Raw XP"],
  ["rawXpPerHour", "Raw XP/h"],
  ["xpGain", "XP com bônus"],
  ["loot", "Loot (gold)"],
  ["supplies", "Supplies (gold)"],
  ["damage", "Dano causado"],
  ["healing", "Cura"],
  ["kills", "Monstros mortos"],
  ["killsPerHour", "Monstros/h"],
  ["bounty", "Bounty Task"],
  ["prey", "Prey"],
  ["isPublic", "Pública"],
];

/**
 * Uma célula de CSV. Texto que começa com = + - @ viraria fórmula na planilha (o nome da hunt é
 * digitado pelo jogador), então ganha um apóstrofo na frente.
 */
export function csvCell(v: string | number | boolean | null): string {
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "number") return String(v);
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV com `;` (o Excel em português usa ponto e vírgula) e BOM, pra acentos abrirem certo. */
export function sessionsToCsv(rows: SessionExportRow[]): string {
  const head = CSV_COLUMNS.map(([, label]) => csvCell(label)).join(";");
  const body = rows.map((r) => CSV_COLUMNS.map(([k]) => csvCell(r[k])).join(";"));
  return "﻿" + [head, ...body].join("\r\n") + "\r\n";
}

export function sessionsToJson(rows: SessionExportRow[]): string {
  return JSON.stringify({ app: "RubinOT Hunt Tracker", sessions: rows }, null, 2);
}

/** Baixa um texto como arquivo (só no navegador). */
export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
