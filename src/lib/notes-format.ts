/**
 * Formatação da observação da sessão — um "markdown" pequeno, salvo como texto puro em
 * hunt_sessions.notes (sem HTML: NotesView monta elementos React, nada de innerHTML).
 *   **negrito**  *itálico*  ~~riscado~~  ==destaque==
 *   # Título   - lista   1. lista numerada   - [ ] / - [x] checklist   > citação   --- separador
 */

export const NOTES_MAX = 2000;

export type NotesInline =
  { t: "text"; v: string } | { t: "b" | "i" | "s" | "mark"; c: NotesInline[] };

export type NotesBlock =
  | { t: "h"; c: NotesInline[] }
  | { t: "p"; lines: NotesInline[][] }
  | { t: "ul" | "ol"; items: NotesInline[][] }
  | { t: "check"; items: { checked: boolean; line: number; c: NotesInline[] }[] }
  | { t: "quote"; lines: NotesInline[][] }
  | { t: "hr" };

const INLINE_RE = /\*\*(.+?)\*\*|~~(.+?)~~|==(.+?)==|\*(?!\s)(.+?)\*/;

export function parseInline(text: string): NotesInline[] {
  const out: NotesInline[] = [];
  let rest = text;
  while (rest) {
    const m = INLINE_RE.exec(rest);
    if (!m) {
      out.push({ t: "text", v: rest });
      break;
    }
    if (m.index > 0) out.push({ t: "text", v: rest.slice(0, m.index) });
    const [, b, s, mark, i] = m;
    if (b != null) out.push({ t: "b", c: parseInline(b) });
    else if (s != null) out.push({ t: "s", c: parseInline(s) });
    else if (mark != null) out.push({ t: "mark", c: parseInline(mark) });
    else out.push({ t: "i", c: parseInline(i) });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

export const CHECK_RE = /^\s*[-*] \[( |x|X)\] ?(.*)$/;
export const UL_RE = /^\s*[-*] (.*)$/;
export const OL_RE = /^\s*(\d+)[.)] (.*)$/;

export function parseNotes(src: string): NotesBlock[] {
  const lines = src.replace(/\r/g, "").split("\n");
  const blocks: NotesBlock[] = [];
  const last = () => blocks[blocks.length - 1];
  let blankBefore = true;
  lines.forEach((raw, line) => {
    const l = raw.trimEnd();
    if (!l.trim()) {
      blankBefore = true;
      return;
    }
    const check = CHECK_RE.exec(l);
    const ul = !check && UL_RE.exec(l);
    const ol = !check && !ul && OL_RE.exec(l);
    const prev = last();
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) blocks.push({ t: "hr" });
    else if (/^#{1,3} /.test(l)) blocks.push({ t: "h", c: parseInline(l.replace(/^#{1,3} /, "")) });
    else if (check) {
      const item = { checked: check[1] !== " ", line, c: parseInline(check[2]) };
      if (prev?.t === "check" && !blankBefore) prev.items.push(item);
      else blocks.push({ t: "check", items: [item] });
    } else if (ul) {
      if (prev?.t === "ul" && !blankBefore) prev.items.push(parseInline(ul[1]));
      else blocks.push({ t: "ul", items: [parseInline(ul[1])] });
    } else if (ol) {
      if (prev?.t === "ol" && !blankBefore) prev.items.push(parseInline(ol[2]));
      else blocks.push({ t: "ol", items: [parseInline(ol[2])] });
    } else if (/^\s*> ?/.test(l)) {
      const c = parseInline(l.replace(/^\s*> ?/, ""));
      if (prev?.t === "quote" && !blankBefore) prev.lines.push(c);
      else blocks.push({ t: "quote", lines: [c] });
    } else if (prev?.t === "p" && !blankBefore) prev.lines.push(parseInline(l));
    else blocks.push({ t: "p", lines: [parseInline(l)] });
    blankBefore = false;
  });
  return blocks;
}

/** Marca/desmarca o item de checklist da linha `line` (NotesView interativo). */
export function toggleCheckLine(src: string, line: number): string {
  const lines = src.split("\n");
  const l = lines[line];
  if (l == null || !CHECK_RE.test(l)) return src;
  lines[line] = l.replace(/\[( |x|X)\]/, (m) => (m === "[ ]" ? "[x]" : "[ ]"));
  return lines.join("\n");
}

/** Texto sem as marcações (tooltip, busca). */
export function notesPlainText(src: string): string {
  return src
    .replace(/\r/g, "")
    .split("\n")
    .map((l) =>
      l
        .replace(/^\s*[-*] \[( |x|X)\] ?/, (m) => (/\[ \]/.test(m) ? "☐ " : "☑ "))
        .replace(/^#{1,3} /, "")
        .replace(/^\s*> ?/, "")
        .replace(/^\s*[-*] /, "• ")
        .replace(/^\s*(-{3,}|\*{3,})\s*$/, "—"),
    )
    .join("\n")
    .replace(
      /\*\*(.+?)\*\*|~~(.+?)~~|==(.+?)==|\*(?!\s)(.+?)\*/g,
      (_, a, b, c, d) => a ?? b ?? c ?? d,
    )
    .trim();
}
