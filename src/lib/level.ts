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
