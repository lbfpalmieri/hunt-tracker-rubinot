import type { LevelSnapshot } from "./store";

/**
 * Registro de level mais recente de um personagem — null se nunca foi
 * registrado. Level não é obrigatório (nem toda sessão tem um), então
 * "atual" é sempre o último snapshot por data, não o último inserido.
 */
export function currentLevelSnapshot(
  levelSnapshots: LevelSnapshot[],
  characterId: string,
): LevelSnapshot | null {
  const mine = levelSnapshots.filter((l) => l.characterId === characterId);
  if (!mine.length) return null;
  return mine.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
}

export function currentLevel(levelSnapshots: LevelSnapshot[], characterId: string): number | null {
  return currentLevelSnapshot(levelSnapshots, characterId)?.level ?? null;
}

/**
 * Level que o campo do passo Finalizar da Nova sessão mostra de início: o atual do personagem ou,
 * se a roda do setup foi montada com level maior (a pessoa subiu o level lá), o da roda — assim o
 * level novo não fica só na sessão e chega no personagem ao salvar.
 */
export function suggestedSessionLevel(
  current: number | null,
  wheelLevel: number | null | undefined,
): number | null {
  const wheel = wheelLevel != null && wheelLevel > 0 ? Math.round(wheelLevel) : null;
  if (wheel == null) return current;
  if (current == null || wheel > current) return wheel;
  return current;
}

/**
 * Level a gravar no personagem junto com a sessão: o digitado no Finalizar quando é um número
 * válido e diferente do atual; null = nada pra gravar (vazio, inválido ou igual ao atual).
 */
export function levelToSaveWithSession(typed: string, current: number | null): number | null {
  const text = typed.trim();
  if (!/^\d+$/.test(text)) return null;
  const level = Number(text);
  if (level <= 0 || level === current) return null;
  return level;
}

export interface LevelGain {
  from: number;
  to: number;
  gained: number;
  /** Data do registro de partida. */
  fromAt: string;
  /** Partida é de antes do período (o nível pode ter subido antes do período começar). */
  fromBeforeRange: boolean;
}

/**
 * Quantos níveis subiu num período, pelos registros de nível (que são marcados à mão — nem
 * toda sessão tem nível). Ponto de partida = último registro ANTES do período (o nível com que
 * você entrou nele); sem nenhum antes, o primeiro registro DENTRO do período. Chegada = último
 * registro até o fim do período. null quando não há dois registros pra comparar.
 */
export function levelGainInRange(
  levelSnapshots: LevelSnapshot[],
  characterId: string,
  range: { start: Date | null; end: Date | null },
): LevelGain | null {
  const mine = levelSnapshots
    .filter((l) => l.characterId === characterId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const t = (l: LevelSnapshot) => new Date(l.createdAt).getTime();
  const start = range.start?.getTime() ?? -Infinity;
  const end = range.end?.getTime() ?? Infinity;
  const upToEnd = mine.filter((l) => t(l) <= end);
  const last = upToEnd[upToEnd.length - 1];
  if (!last) return null;
  const before = upToEnd.filter((l) => t(l) < start);
  const base = before[before.length - 1] ?? upToEnd.find((l) => t(l) >= start);
  if (!base || base === last) return null;
  return {
    from: base.level,
    to: last.level,
    gained: last.level - base.level,
    fromAt: base.createdAt,
    fromBeforeRange: t(base) < start,
  };
}
