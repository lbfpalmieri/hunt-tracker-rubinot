import type { PartyInfo } from "./party";

/**
 * Rascunho da "Nova sessão": o que o jogador já colou (Hunting, Input, Miscellaneous, Party) e o
 * nome da hunt digitado. A rota desmonta quando se navega pra outra página, então o texto fica
 * guardado aqui (memória do app + sessionStorage, que sobrevive a recarregar a aba). Só é limpo
 * depois de salvar a sessão ou quando o jogador limpa de propósito.
 */
export interface ImportDraft {
  hunting: string;
  damage: string;
  misc: string;
  partyText: string;
  party: PartyInfo | null;
  huntQuery: string;
}

const KEY = "rubinot:import-draft";

export const EMPTY_DRAFT: ImportDraft = {
  hunting: "",
  damage: "",
  misc: "",
  partyText: "",
  party: null,
  huntQuery: "",
};

let memory: ImportDraft | null = null;

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function isDraftEmpty(d: ImportDraft): boolean {
  return !d.hunting && !d.damage && !d.misc && !d.partyText && !d.party && !d.huntQuery;
}

export function loadImportDraft(): ImportDraft {
  if (memory) return memory;
  try {
    const raw = storage()?.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ImportDraft>;
      memory = {
        hunting: typeof p.hunting === "string" ? p.hunting : "",
        damage: typeof p.damage === "string" ? p.damage : "",
        misc: typeof p.misc === "string" ? p.misc : "",
        partyText: typeof p.partyText === "string" ? p.partyText : "",
        party: p.party && typeof p.party === "object" ? (p.party as PartyInfo) : null,
        huntQuery: typeof p.huntQuery === "string" ? p.huntQuery : "",
      };
      return memory;
    }
  } catch {
    // sessionStorage bloqueado ou JSON ruim: começa vazio
  }
  return EMPTY_DRAFT;
}

export function saveImportDraft(d: ImportDraft): void {
  memory = isDraftEmpty(d) ? null : d;
  try {
    const s = storage();
    if (!s) return;
    if (isDraftEmpty(d)) s.removeItem(KEY);
    else s.setItem(KEY, JSON.stringify(d));
  } catch {
    // cota cheia ou bloqueado: a cópia em memória continua valendo
  }
}

export function clearImportDraft(): void {
  saveImportDraft(EMPTY_DRAFT);
}

/** Só para teste. */
export function resetImportDraftMemory(): void {
  memory = null;
}
