/**
 * Filtro de período reutilizado por qualquer tela que precise recortar dados
 * por data (Meu rendimento, Comparar sessões, ...). Um único lugar pra essa
 * lógica evita reimplementar "hoje/semana/mês/personalizado" em cada página.
 */

export type Period = "yesterday" | "today" | "week" | "month" | "all" | "custom";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Tudo" },
  { value: "custom", label: "Personalizado" },
];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Segunda-feira 00:00 da semana de `d`. */
export function startOfWeek(d: Date): Date {
  const start = startOfDay(d);
  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  return start;
}

/** Parses a <input type="date"> value ("YYYY-MM-DD") as a local date, not UTC. */
export function parseDateInput(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Inclusive [start, end] window for a period — null on either side means "sem limite". */
export function periodRange(
  period: Period,
  customStart: string,
  customEnd: string,
): { start: Date | null; end: Date | null } {
  const now = new Date();
  if (period === "all") return { start: null, end: null };
  if (period === "today") return { start: startOfDay(now), end: endOfDay(now) };
  if (period === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end: endOfDay(end) };
  }
  if (period === "week") {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end: endOfDay(end) };
  }
  // custom
  const s = parseDateInput(customStart);
  const e = parseDateInput(customEnd);
  return { start: s ? startOfDay(s) : null, end: e ? endOfDay(e) : null };
}

export const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d);

export function formatRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return "Todo o histórico registrado";
  if (!start || !end) return "Escolha as duas datas";
  if (start.toDateString() === end.toDateString()) return fmtDay(start);
  return `${fmtDay(start)} — ${fmtDay(end)}`;
}

/** Filters items by createdAt falling within a period's [start, end] (inclusive). */
export function filterByPeriod<T>(items: T[], getCreatedAt: (item: T) => string, range: { start: Date | null; end: Date | null }): T[] {
  const { start, end } = range;
  if (!start && !end) return items;
  return items.filter((item) => {
    const t = new Date(getCreatedAt(item));
    if (start && t < start) return false;
    if (end && t > end) return false;
    return true;
  });
}
