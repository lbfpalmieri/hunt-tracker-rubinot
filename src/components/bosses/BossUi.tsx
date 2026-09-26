import { Crown, Flame, Skull, Swords, Users } from "lucide-react";
import type { ReactNode } from "react";
import { GameIcon } from "@/components/GameIcon";
import {
  BOSS_TYPE_LABEL,
  LOOT_TIER_LABEL,
  type Boss,
  type BossType,
  type LootTier,
  type PartyKind,
} from "@/lib/boss-catalog";
import { BOSS_TYPE_COLOR, LOOT_TIER_COLOR } from "./boss-theme";

/**
 * Peças visuais da Rotação de Bosses — tema próprio (sangue/carmesim + dourado) pra área ter
 * cara de "covil", diferente do azul do resto do app.
 */

export function BossHero({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-rubi-danger/40 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--rubi-danger)_30%,transparent),transparent_60%),radial-gradient(ellipse_at_bottom_right,color-mix(in_oklab,var(--rubi-gold)_14%,transparent),transparent_55%)] bg-surface p-5 shadow-[0_0_60px_-20px_var(--rubi-danger)] sm:p-7">
      <Skull
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-44 w-44 rotate-12 text-rubi-danger/10 sm:h-56 sm:w-56"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rubi-danger">
            <Flame className="h-3.5 w-3.5" /> {eyebrow}
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function BossPortrait({
  boss,
  size = 56,
  className = "",
}: {
  boss: Pick<Boss, "name" | "type">;
  size?: number;
  className?: string;
}) {
  const color = BOSS_TYPE_COLOR[boss.type];
  return (
    <div
      className={
        "relative flex flex-none items-center justify-center rounded-xl border-2 " + className
      }
      style={{
        width: size + 16,
        height: size + 16,
        borderColor: `color-mix(in oklab, ${color} 70%, transparent)`,
        background: `radial-gradient(circle at 50% 60%, color-mix(in oklab, ${color} 28%, transparent), color-mix(in oklab, var(--background) 90%, transparent) 70%)`,
        boxShadow: `0 0 18px -6px ${color}`,
      }}
    >
      <GameIcon
        name={boss.name}
        size={size}
        fallback={<Skull className="h-1/2 w-1/2 text-muted-foreground/60" />}
      />
    </div>
  );
}

export function BossTypeBadge({ type }: { type: BossType }) {
  if (!type) return null;
  const color = BOSS_TYPE_COLOR[type];
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ color, background: `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      {BOSS_TYPE_LABEL[type]}
    </span>
  );
}

export function PartyBadge({ party, estimated }: { party: PartyKind; estimated: boolean }) {
  const solo = party === "solo";
  return (
    <span
      title={
        estimated
          ? "Estimado pela vida do boss — você pode corrigir nos detalhes"
          : "Definido por você"
      }
      className={
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold " +
        (solo ? "bg-rubi-success/15 text-rubi-success" : "bg-rubi-blue-soft text-rubi-blue")
      }
    >
      {solo ? <Swords className="h-3 w-3" /> : <Users className="h-3 w-3" />}
      {solo ? "Solo" : "Time"}
      {estimated && <span className="opacity-60">*</span>}
    </span>
  );
}

export function LootTierBadge({ tier }: { tier: LootTier }) {
  const color = LOOT_TIER_COLOR[tier];
  return (
    <span
      className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ color, background: `color-mix(in oklab, ${color} 15%, transparent)` }}
    >
      {LOOT_TIER_LABEL[tier]}
    </span>
  );
}

export function SectionTitle({
  icon: Icon = Crown,
  children,
}: {
  icon?: typeof Crown;
  children: ReactNode;
}) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
      <Icon className="h-5 w-5 text-rubi-danger" />
      {children}
    </h2>
  );
}
