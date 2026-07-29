import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: "blue" | "gold" | "success" | "danger" | "muted";
  /** Marca sutil no canto do card, ex. valor influenciado por Prey. */
  mark?: string | null;
  markTitle?: string;
}

const accentClass: Record<NonNullable<Props["accent"]>, string> = {
  blue: "text-rubi-blue",
  gold: "text-rubi-gold",
  success: "text-rubi-success",
  danger: "text-rubi-danger",
  muted: "text-muted-foreground",
};

export function StatCard({ label, value, hint, icon: Icon, accent = "blue", mark, markTitle }: Props) {
  return (
    <div
      className={
        "card-surface relative overflow-hidden p-5 " +
        (mark ? "border-rubi-gold/60 pt-7 shadow-[0_0_0_1px_var(--rubi-gold)_inset]" : "")
      }
    >
      {mark && (
        <span
          title={markTitle}
          className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-bl-lg bg-rubi-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-gold"
        >
          <Sparkles className="h-2.5 w-2.5" />
          {mark}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div
            className={
              "flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent/60 " +
              accentClass[accent]
            }
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

