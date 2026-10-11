import type { SetupCharm } from "./session-setup";

/**
 * Lembra, por personagem, em qual criatura cada charm estava. Na sessão seguinte, se o charm
 * ativou de novo e a criatura foi morta, o vínculo já vem preenchido — a pessoa só mexe se mudou.
 * Fica no localStorage do navegador (não é dado da sessão, só atalho de preenchimento).
 */
export type CharmMemory = Record<string, { creature: string; level: 1 | 2 | 3 }>;

const key = (characterId: string) => `rubinot:charm-memory:${characterId}`;

export function loadCharmMemory(characterId: string | null): CharmMemory {
  if (!characterId) return {};
  try {
    const raw = JSON.parse(localStorage.getItem(key(characterId)) ?? "{}");
    const out: CharmMemory = {};
    for (const [charm, v] of Object.entries(raw ?? {})) {
      const m = v as { creature?: unknown; level?: unknown };
      if (typeof m?.creature !== "string") continue;
      out[charm] = { creature: m.creature, level: m.level === 1 || m.level === 3 ? m.level : 2 };
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCharmMemory(characterId: string | null, memory: CharmMemory) {
  if (!characterId) return;
  try {
    localStorage.setItem(key(characterId), JSON.stringify(memory));
  } catch {
    // sem localStorage (aba privada): só não lembra.
  }
}

/** Memória nova a partir dos vínculos escolhidos: charm sem criatura sai da memória. */
export function updateMemory(memory: CharmMemory, charms: SetupCharm[]): CharmMemory {
  const next = { ...memory };
  for (const c of charms) {
    if (c.creature) next[c.charm] = { creature: c.creature, level: c.level };
    else delete next[c.charm];
  }
  return next;
}

/**
 * Preenche os charms que ativaram, ainda sem nenhuma escolha, com o que foi lembrado — só se a
 * criatura lembrada foi morta nesta sessão. Charm que a pessoa já mexeu (mesmo desmarcado) não é tocado.
 */
export function prefillCharms(
  current: SetupCharm[],
  activated: string[],
  creatures: string[],
  memory: CharmMemory,
): SetupCharm[] | null {
  const add: SetupCharm[] = [];
  for (const charm of activated) {
    if (current.some((c) => c.charm === charm)) continue;
    const m = memory[charm];
    if (m && creatures.includes(m.creature)) add.push({ charm, level: m.level, creature: m.creature });
  }
  return add.length ? [...current, ...add] : null;
}
