import { Sparkles } from "lucide-react";
import { preySlotLabel, type PreySlot } from "@/lib/prey";

/** Marker shown on sessions played with active Prey Creature bonuses. */
export function PreyBadge({
  prey,
  className = "",
  detailed = false,
}: {
  prey: PreySlot[];
  className?: string;
  detailed?: boolean;
}) {
  if (!prey.length) return null;
  const full = prey.map(preySlotLabel).join(" · ");

  if (detailed) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        {prey.map((slot, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full border border-rubi-blue/50 bg-rubi-blue/10 px-2 py-0.5 text-[11px] font-semibold text-rubi-blue"
          >
            <Sparkles className="h-3 w-3" />
            {preySlotLabel(slot)}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-rubi-blue/50 bg-rubi-blue/10 px-2 py-0.5 text-[11px] font-semibold text-rubi-blue ${className}`}
      title={`Prey ativa — ${full}`}
    >
      <Sparkles className="h-3 w-3" />
      Prey · {prey.length}
    </span>
  );
}
