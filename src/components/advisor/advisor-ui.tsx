import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { damageElementInfo } from "@/lib/damage-elements";
import type { AttackElement } from "@/lib/monsters";
import type { MixEntry } from "@/lib/hunt-advisor";

/** Cor de cada elemento (barras e chips do Hunt Advisor). */
export const ELEMENT_COLOR: Record<AttackElement, string> = {
  physical: "#a3a3a3",
  fire: "#f97316",
  earth: "#22c55e",
  energy: "#a855f7",
  ice: "#38bdf8",
  holy: "#facc15",
  death: "#8b5cf6",
  lifedrain: "#ef4444",
  manadrain: "#3b82f6",
  drown: "#14b8a6",
};

export const elementLabel = (el: string) => {
  const i = damageElementInfo(el === "drown" ? "drown" : el);
  return { emoji: i.emoji, label: i.label || el };
};

/** Barra empilhada do dano por elemento + legenda. */
export function MixBar({ mix }: { mix: MixEntry[] }) {
  if (!mix.length) return <p className="text-sm text-muted-foreground">Sem dados de dano.</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted/30">
        {mix.map((e) => (
          <div
            key={e.element}
            title={`${elementLabel(e.element).label}: ${e.pct.toFixed(1)}%`}
            style={{ width: `${e.pct}%`, background: ELEMENT_COLOR[e.element] }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {mix.map((e) => {
          const l = elementLabel(e.element);
          return (
            <span key={e.element} className="inline-flex items-center gap-1 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: ELEMENT_COLOR[e.element] }}
              />
              {l.emoji} {l.label}
              <b className="tabular-nums">{e.pct.toFixed(1)}%</b>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Card de seção do Advisor: ícone + título + subtítulo opcional. */
export function AdvisorCard({
  icon: Icon,
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"card-surface min-w-0 p-4 sm:p-5 " + className}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <Icon className="h-4 w-4 flex-none text-rubi-gold" /> {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Botões tipo "segmented control" (vocação, modo, tipo de arma). */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  size = "md",
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-background/40 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors " +
            (size === "sm" ? "px-2 py-1 text-xs " : "px-3 py-1.5 text-sm ") +
            (value === o.value
              ? "bg-rubi-gold text-background shadow-glow-gold"
              : "text-muted-foreground hover:bg-accent hover:text-foreground")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
