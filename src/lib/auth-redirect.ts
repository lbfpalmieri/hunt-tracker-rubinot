/**
 * Destino depois do login. Quem abre uma página do app sem conta (ex.: /tools/linked-tasks) cai na
 * landing com ?redirect=<página>; ao entrar com o Google, volta direto pra ela.
 *
 * O Supabase só aceita voltar pra URL de retorno cadastrada (origin + "/auth"), então o destino NÃO
 * vai na URL do OAuth: fica guardado no navegador (sessionStorage) até a volta.
 *
 * Só aceitamos caminho interno ("/algo"). "//site.com", "/\site.com" e "https://..." viram
 * undefined — sem isso o link de login viraria redirecionamento aberto pra site de phishing.
 */

const KEY = "rubinot-login-redirect";
const MAX_LEN = 512;
const PROBE_ORIGIN = "https://rubinothunt.invalid";

export function safeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const path = value.trim();
  if (!path || path.length > MAX_LEN) return undefined;
  if (!path.startsWith("/") || path.startsWith("//")) return undefined;
  // Barra invertida e caracteres de controle: navegadores tratam "/\x" como "//x".
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return undefined;
  let url: URL;
  try {
    url = new URL(path, PROBE_ORIGIN);
  } catch {
    return undefined;
  }
  if (url.origin !== PROBE_ORIGIN) return undefined;
  // Voltar pra landing ou pro próprio login não leva a lugar nenhum.
  if (url.pathname === "/" || url.pathname === "/auth" || url.pathname.startsWith("/auth/")) {
    return undefined;
  }
  return url.pathname + url.search + url.hash;
}

/** Guarda o destino antes de ir pro Google. Ignora destino inválido. */
export function rememberLoginRedirect(path: unknown): void {
  const safe = safeRedirectPath(path);
  try {
    if (safe) sessionStorage.setItem(KEY, safe);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Navegador sem armazenamento (aba anônima bloqueada): só volta pro Dashboard.
  }
}

/** Lê e apaga o destino guardado (vale uma vez só). */
export function takeLoginRedirect(): string | undefined {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return safeRedirectPath(value);
  } catch {
    return undefined;
  }
}
