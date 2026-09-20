/**
 * Lê um valor de gold digitado do jeito que jogador escreve: "100000000",
 * "100.000.000", "100kk", "1,5kk", "38k". Retorna null se não for um número > 0.
 */
export function parseGoldInput(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;
  const m = s.match(/^([\d.,]+?)(k{1,2})?$/);
  if (!m) return null;
  const [, num, suffix] = m;
  let n: number;
  if (suffix) {
    // Com sufixo, vírgula/ponto é decimal ("1,5kk").
    n = Number(num.replace(",", "."));
  } else {
    // Sem sufixo, ponto/vírgula são separadores de milhar ("100.000.000").
    n = Number(num.replace(/[.,]/g, ""));
  }
  if (!Number.isFinite(n)) return null;
  const mult = suffix === "kk" ? 1_000_000 : suffix === "k" ? 1_000 : 1;
  const value = Math.round(n * mult);
  return value > 0 ? value : null;
}

/** Quantos RC precisa vender, a `price` gold cada, pra juntar pelo menos `targetGold`. */
export function rcNeeded(targetGold: number, price: number): number {
  return Math.ceil(targetGold / price);
}

/** Data local de hoje como YYYY-MM-DD (não usa UTC pra não virar o dia antes da hora). */
export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
