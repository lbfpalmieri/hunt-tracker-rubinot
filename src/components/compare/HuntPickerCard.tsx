import { Check, Globe2, Timer, User } from "lucide-react";
import type { CompareHunt } from "@/lib/compare";
import { fmtDate, fmtDuration, fmtGold, fmtNum } from "@/lib/format";
import { BountyBadge } from "@/components/BountyBadge";
import { PreyBadge } from "@/components/PreyBadge";

interface Props {
  hunt: CompareHunt;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function HuntPickerCard({ hunt, selected, disabled, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={
        "card-surface relative w-full p-3 text-left transition-all " +
        (selected
          ? "border-rubi-gold shadow-[0_0_0_1px_var(--rubi-gold)_inset]"
          : "hover:border-rubi-blue/60") +
        (disabled && !selected ? " cursor-not-allowed opacity-40" : "")
      }
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rubi-gold text-background">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div className="flex flex-wrap items-start gap-2 pr-6">
        <span className="font-display text-sm font-semibold leading-snug">{hunt.huntName}</span>
        {agg ? (
          <span className="flex-none rounded-full border border-rubi-blue/50 bg-rubi-blue/10 px-2 py-0.5 text-[11px] font-semibold text-rubi-blue">
            Média de {hunt.sessionCount} sessões
          </span>
        ) : (
          <>
            {hunt.bounty && <BountyBadge bounty={hunt.bounty} className="flex-none" />}
            {hunt.prey && <PreyBadge prey={hunt.prey} className="flex-none" />}
          </>
        )}
        {agg && (hunt.preySessions ?? 0) > 0 && (
          <span className="flex-none rounded-full border border-rubi-gold/50 bg-rubi-gold/10 px-2 py-0.5 text-[11px] font-semibold text-rubi-gold">
            Prey em {hunt.preySessions}/{hunt.sessionCount}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {hunt.source === "community" ? (
          <Globe2 className="h-3 w-3 text-rubi-blue" />
        ) : (
          <User className="h-3 w-3 text-rubi-gold" />
        )}
        <span className="truncate">
          {hunt.charName} · {hunt.vocation}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Timer className="h-3 w-3" />
        {fmtDuration(hunt.durationSec)}
        {agg ? " em média" : ` · ${fmtDate(hunt.createdAt)}`}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Raw XP{" "}
          <span className="font-semibold text-rubi-blue">
            {hunt.rawXpHunt == null ? "—" : fmtNum(hunt.rawXpHunt)}
          </span>
        </span>
        <span className={"font-semibold " + (hunt.balance >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
          {fmtGold(hunt.balance)}
        </span>
      </div>
    </button>
  );
}
