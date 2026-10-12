/** Tamanho máximo do nome de uma hunt (spot). */
export const HUNT_NAME_MAX = 80;

/** Nome de hunt limpo: sem espaço sobrando nas pontas ou no meio e dentro do limite. */
export function normalizeHuntName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, HUNT_NAME_MAX);
}

/** Duas sessões são da mesma hunt quando o nome é igual sem diferenciar maiúscula nem espaço. */
export function sameHuntName(a: string, b: string): boolean {
  return normalizeHuntName(a).toLowerCase() === normalizeHuntName(b).toLowerCase();
}
