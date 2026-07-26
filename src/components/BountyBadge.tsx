import { Trophy } from "lucide-react";
import { bountyLabel } from "@/lib/bounty";
import type { BountyInfo } from "@/lib/bounty";
import { fmtNum } from "@/lib/format";

/** Golden marker shown on sessions whose Raw XP includes a Bounty Task bonus. */
export function BountyBadge({
  bounty,
  className = "",
  showXp = false,
}: {
  bounty: { difficulty: string; tier: string; xp?: number | null };
  className?: string;
  showXp?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/50 bg-rubi-gold/10 px-2 py-0.5 text-[11px] font-semibold text-rubi-gold ${className}`}
      title={`Bônus de Bounty Task — ${bountyLabel(bounty)}`}
    >
      <Trophy className="h-3 w-3" />
      Bounty · {bountyLabel(bounty)}
      {showXp && bounty.xp != null && <span className="font-mono">+{fmtNum(bounty.xp)}</span>}
    </span>
  );
}
