/**
 * Extrai uma mensagem legível de qualquer coisa lançada num catch. `Error`
 * instances têm `.message`, mas erros do Supabase/Postgrest (o mais comum
 * nesse app) são objetos simples `{ message, details, hint, code }` — sem
 * isso, `String(e)` vira o inútil "[object Object]" na tela.
 */
export function errorMessage(e: unknown): string {
  if (e == null) return "Erro desconhecido";
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  try {
    const s = String(e);
    return s === "[object Object]" ? "Erro desconhecido" : s;
  } catch {
    return "Erro desconhecido";
  }
}
