import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: "blue" | "gold" | "success" | "danger" | "muted";
}

const accentClass: Record<NonNullable<Props["accent"]>, string> = {
  blue: "text-rubi-blue",
  gold: "text-rubi-gold",
  success: "text-rubi-success",
  danger: "text-rubi-danger",
  muted: "text-muted-foreground",
};

export function StatCard({ label, value, hint, icon: Icon, accent = "blue" }: Props) {
  return (
    <div className="card-surface relative overflow-hidden p-5">
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
