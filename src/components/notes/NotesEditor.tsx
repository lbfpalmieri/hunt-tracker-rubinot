import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Bold,
  Eye,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Strikethrough,
} from "lucide-react";
import { CHECK_RE, NOTES_MAX, OL_RE, UL_RE } from "@/lib/notes-format";
import { NotesView } from "@/components/notes/NotesView";

type Tab = "write" | "preview";

/**
 * Caixa da observação com barra de formatação (negrito, itálico, riscado, destaque, título,
 * listas, checklist, citação, separador) e aba "Visualizar". Salva texto com marcações leves
 * (notes-format.ts) — NotesView mostra formatado. Ctrl+B / Ctrl+I; Enter continua a lista.
 */
export function NotesEditor({
  value,
  onChange,
  placeholder = "Ex: testei essa build de runas, rendeu bem no prey de dano",
  minRows = 3,
  initialTab = "write",
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
  initialTab?: Tab;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<Tab>(value.trim() ? initialTab : "write");
  const pendingSel = useRef<[number, number] | null>(null);

  // Cresce com o texto (sem scroll interno) e reaplica a seleção depois de formatar.
  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight + 2}px`;
    if (pendingSel.current) {
      ta.focus();
      ta.setSelectionRange(...pendingSel.current);
      pendingSel.current = null;
    }
  }, [value, tab]);

  const apply = (next: string, selStart: number, selEnd = selStart) => {
    pendingSel.current = [selStart, selEnd];
    onChange(next.slice(0, NOTES_MAX));
  };

  /** Envolve a seleção (ou um texto de exemplo) com as marcas; clicar de novo desfaz. */
  const wrap = (mark: string, sample: string) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const sel = value.slice(a, b);
    const before = value.slice(a - mark.length, a);
    const after = value.slice(b, b + mark.length);
    if (sel && before === mark && after === mark) {
      apply(
        value.slice(0, a - mark.length) + sel + value.slice(b + mark.length),
        a - mark.length,
        b - mark.length,
      );
      return;
    }
    const text = sel || sample;
    apply(
      value.slice(0, a) + mark + text + mark + value.slice(b),
      a + mark.length,
      a + mark.length + text.length,
    );
  };

  /** Prefixo em cada linha da seleção (lista, checklist, título, citação); se todas já têm, tira. */
  const prefixLines = (kind: "ul" | "ol" | "check" | "h" | "quote") => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const start = value.lastIndexOf("\n", a - 1) + 1;
    const endIdx = value.indexOf("\n", b);
    const end = endIdx === -1 ? value.length : endIdx;
    const lines = value.slice(start, end).split("\n");
    const has: Record<typeof kind, RegExp> = {
      ul: /^\s*[-*] (?!\[[ xX]\])/,
      ol: /^\s*\d+[.)] /,
      check: /^\s*[-*] \[[ xX]\] ?/,
      h: /^#{1,3} /,
      quote: /^\s*> ?/,
    };
    const strip = (l: string) =>
      l.replace(/^\s*[-*] \[[ xX]\] ?|^\s*[-*] |^\s*\d+[.)] |^#{1,3} |^\s*> ?/, "");
    const allHave = lines.every((l) => has[kind].test(l));
    const out = lines.map((l, i) => {
      const bare = strip(l);
      if (allHave) return bare;
      const p =
        kind === "ul"
          ? "- "
          : kind === "ol"
            ? `${i + 1}. `
            : kind === "check"
              ? "- [ ] "
              : kind === "h"
                ? "## "
                : "> ";
      return p + bare;
    });
    const joined = out.join("\n");
    apply(value.slice(0, start) + joined + value.slice(end), start + joined.length);
  };

  const separator = () => {
    const ta = ref.current;
    if (!ta) return;
    const a = ta.selectionStart;
    const pre = a > 0 && value[a - 1] !== "\n" ? "\n" : "";
    const ins = `${pre}---\n`;
    apply(value.slice(0, a) + ins + value.slice(a), a + ins.length);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      wrap("**", "negrito");
      return;
    }
    if (mod && e.key.toLowerCase() === "i") {
      e.preventDefault();
      wrap("*", "itálico");
      return;
    }
    if (e.key !== "Enter" || e.shiftKey || mod) return;
    // Enter numa linha de lista continua a lista; numa linha de lista vazia, sai dela.
    const ta = e.currentTarget;
    const a = ta.selectionStart;
    if (a !== ta.selectionEnd) return;
    const start = value.lastIndexOf("\n", a - 1) + 1;
    const line = value.slice(start, a);
    const check = CHECK_RE.exec(line);
    const ol = !check && OL_RE.exec(line);
    const ul = !check && !ol && UL_RE.exec(line);
    const quote = !check && !ol && !ul && /^\s*> ?(.*)$/.exec(line);
    const content = check ? check[2] : ol ? ol[2] : ul ? ul[1] : quote ? quote[1] : null;
    if (content == null) return;
    e.preventDefault();
    if (!content.trim()) {
      apply(value.slice(0, start) + value.slice(a), start);
      return;
    }
    const next = check ? "- [ ] " : ol ? `${Number(ol[1]) + 1}. ` : ul ? "- " : "> ";
    const ins = "\n" + next;
    apply(value.slice(0, a) + ins + value.slice(a), a + ins.length);
  };

  const tools: { icon: ReactNode; label: string; run: () => void; gap?: boolean }[] = [
    { icon: <Bold />, label: "Negrito (Ctrl+B)", run: () => wrap("**", "negrito") },
    { icon: <Italic />, label: "Itálico (Ctrl+I)", run: () => wrap("*", "itálico") },
    { icon: <Strikethrough />, label: "Riscado", run: () => wrap("~~", "riscado") },
    { icon: <Highlighter />, label: "Destaque", run: () => wrap("==", "destaque") },
    { icon: <Heading2 />, label: "Título", run: () => prefixLines("h"), gap: true },
    { icon: <List />, label: "Lista", run: () => prefixLines("ul") },
    { icon: <ListOrdered />, label: "Lista numerada", run: () => prefixLines("ol") },
    { icon: <ListChecks />, label: "Checklist", run: () => prefixLines("check") },
    { icon: <Quote />, label: "Citação", run: () => prefixLines("quote"), gap: true },
    { icon: <Minus />, label: "Separador", run: separator },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/60 transition-colors focus-within:border-rubi-blue/70">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-muted/20 px-1.5 py-1">
        {tab === "write" &&
          tools.map((t) => (
            <span key={t.label} className="contents">
              {t.gap && <span className="mx-1 h-4 w-px bg-border" />}
              <button
                type="button"
                title={t.label}
                aria-label={t.label}
                // mousedown: não tira o foco/seleção do textarea
                onMouseDown={(e) => e.preventDefault()}
                onClick={t.run}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rubi-blue/15 hover:text-rubi-blue [&>svg]:h-3.5 [&>svg]:w-3.5"
              >
                {t.icon}
              </button>
            </span>
          ))}
        <div className="ml-auto flex rounded-md border border-border/70 p-0.5 text-[11px] font-medium">
          {(
            [
              ["write", "Escrever", <PenLine key="w" className="h-3 w-3" />],
              ["preview", "Visualizar", <Eye key="p" className="h-3 w-3" />],
            ] as const
          ).map(([k, label, icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={
                "inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors " +
                (tab === k
                  ? "bg-rubi-blue/20 text-rubi-blue"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value.slice(0, NOTES_MAX))}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={minRows}
          maxLength={NOTES_MAX}
          className="block max-h-80 w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
        />
      ) : (
        <div className="max-h-80 min-h-[5.5rem] overflow-y-auto px-3 py-2.5">
          {value.trim() ? (
            <NotesView value={value} onChange={onChange} />
          ) : (
            <p className="text-sm text-muted-foreground/60">Nada escrito ainda.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/50 px-3 py-1 text-[10px] text-muted-foreground">
        <span className="hidden truncate sm:inline">
          **negrito** · *itálico* · ==destaque== · - lista · - [ ] checklist
        </span>
        <span
          className={
            "ml-auto tabular-nums " + (value.length > NOTES_MAX * 0.9 ? "text-rubi-gold" : "")
          }
        >
          {value.length}/{NOTES_MAX}
        </span>
      </div>
    </div>
  );
}
