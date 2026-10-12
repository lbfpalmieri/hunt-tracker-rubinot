import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: "/import" | "/characters" | "/sessions" | "/";
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaTo }: Props) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rubi-blue-soft text-rubi-blue">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold transition-transform active:scale-[0.98] text-background hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
