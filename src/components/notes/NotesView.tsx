import { Fragment, useMemo, type ReactNode } from "react";
import { Check } from "lucide-react";
import { parseNotes, toggleCheckLine, type NotesInline } from "@/lib/notes-format";

function Inline({ nodes }: { nodes: NotesInline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.t === "text") return <Fragment key={i}>{n.v}</Fragment>;
        const inner = <Inline nodes={n.c} />;
        if (n.t === "b")
          return (
            <strong key={i} className="font-semibold text-foreground">
              {inner}
            </strong>
          );
        if (n.t === "i") return <em key={i}>{inner}</em>;
        if (n.t === "s")
          return (
            <s key={i} className="opacity-70">
              {inner}
            </s>
          );
        return (
          <mark key={i} className="rounded bg-rubi-gold/25 px-0.5 text-rubi-gold">
            {inner}
          </mark>
        );
      })}
    </>
  );
}

/**
 * Mostra a observação formatada (ver notes-format.ts). Com `onChange`, os itens de checklist
 * viram clicáveis e devolvem o texto com o [ ]/[x] trocado.
 */
export function NotesView({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange?: (next: string) => void;
  className?: string;
}) {
  const blocks = useMemo(() => parseNotes(value), [value]);
  const lines = (ls: NotesInline[][]): ReactNode =>
    ls.map((l, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        <Inline nodes={l} />
      </Fragment>
    ));

  return (
    <div className={"space-y-2 text-sm leading-relaxed text-foreground/90 " + className}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h":
            return (
              <h4 key={i} className="font-display text-base font-semibold text-rubi-gold">
                <Inline nodes={b.c} />
              </h4>
            );
          case "p":
            return <p key={i}>{lines(b.lines)}</p>;
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-0.5 pl-5 marker:text-rubi-blue">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline nodes={it} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-0.5 pl-5 marker:text-rubi-blue">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline nodes={it} />
                  </li>
                ))}
              </ol>
            );
          case "check":
            return (
              <ul key={i} className="space-y-1">
                {b.items.map((it) => (
                  <li key={it.line} className="flex items-start gap-2">
                    <button
                      type="button"
                      disabled={!onChange}
                      onClick={() => onChange?.(toggleCheckLine(value, it.line))}
                      aria-label={it.checked ? "Desmarcar" : "Marcar"}
                      className={
                        "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border transition-colors disabled:cursor-default " +
                        (it.checked
                          ? "border-rubi-success bg-rubi-success text-background"
                          : "border-muted-foreground/50 enabled:hover:border-rubi-success")
                      }
                    >
                      {it.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </button>
                    <span className={it.checked ? "text-muted-foreground line-through" : ""}>
                      <Inline nodes={it.c} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-rubi-blue/60 pl-3 italic text-muted-foreground"
              >
                {lines(b.lines)}
              </blockquote>
            );
          case "hr":
            return <hr key={i} className="border-border/70" />;
        }
      })}
    </div>
  );
}
