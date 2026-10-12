import type { Character } from "./store";

export const CHARACTER_NAME_MAX = 40;
export const CHARACTER_WORLD_MAX = 40;

export interface CharacterEditInput {
  name: string;
  vocation: string;
  world: string;
}

export type CharacterEditResult =
  | { status: "ok"; patch: Partial<Pick<Character, "name" | "vocation" | "world">> }
  | { status: "nada-mudou" }
  | { status: "erro"; message: string };

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Confere a edição de um personagem e devolve só o que mudou (o histórico de sessões fica intacto:
 * o store atualiza as sessões pelo character_id, não apaga nada). Nome e mundo não podem ficar vazios.
 */
export function buildCharacterPatch(
  current: Pick<Character, "name" | "vocation" | "world">,
  input: CharacterEditInput,
): CharacterEditResult {
  const name = clean(input.name).slice(0, CHARACTER_NAME_MAX);
  const world = clean(input.world).slice(0, CHARACTER_WORLD_MAX);
  const vocation = clean(input.vocation);
  if (!name) return { status: "erro", message: "Informe o nome do personagem." };
  if (!world) return { status: "erro", message: "Informe o mundo do personagem." };
  if (!vocation) return { status: "erro", message: "Escolha a vocação." };

  const patch: Partial<Pick<Character, "name" | "vocation" | "world">> = {};
  if (name !== current.name) patch.name = name;
  if (vocation !== current.vocation) patch.vocation = vocation;
  if (world !== current.world) patch.world = world;
  return Object.keys(patch).length ? { status: "ok", patch } : { status: "nada-mudou" };
}

/** Outro personagem seu já usa esse nome (sem diferenciar maiúscula)? */
export function nameTaken(
  characters: Pick<Character, "id" | "name">[],
  id: string,
  name: string,
): boolean {
  const n = clean(name).toLowerCase();
  return characters.some((c) => c.id !== id && c.name.trim().toLowerCase() === n);
}
