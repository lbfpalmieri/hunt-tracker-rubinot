import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAppStore } from "./store";
import { aggregateImbuements, IMB_TIER_LABEL } from "./imbuements";
import { getImbuementType } from "./imbuement-types";

const LOW_THRESHOLD_HOURS = 1;

export interface LowImbuementInfo {
  id: string;
  name: string;
  tier: string;
  hoursRemaining: number;
  characterId: string;
}

export function useLowImbuements(characterId: string | null): LowImbuementInfo[] {
  const imbuements = useAppStore((s) => s.imbuements);
  const sessions = useAppStore((s) => s.sessions);

  return useMemo(() => {
    if (!characterId) return [];
    const agg = aggregateImbuements(imbuements, sessions, characterId);
    return agg.rows
      .filter((r) => r.active && r.hoursRemaining <= LOW_THRESHOLD_HOURS)
      .map((r) => ({
        id: r.imb.id,
        tier: IMB_TIER_LABEL[r.imb.tier],
        name: getImbuementType(r.imb.label)?.name ?? r.imb.label ?? "Imbuement",
        hoursRemaining: r.hoursRemaining,
        characterId: r.imb.characterId,
      }));
  }, [imbuements, sessions, characterId]);
}

/** Fires a toast once per (imbuement id + threshold crossing). */
export function useLowImbuementToasts(items: LowImbuementInfo[]) {
  const notified = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    for (const item of items) {
      if (!notified.current.has(item.id)) {
        notified.current.add(item.id);
        const mins = Math.max(1, Math.round(item.hoursRemaining * 60));
        toast.warning(`Imbuement acabando: ${item.tier} ${item.name}`, {
          description: `Restam ~${mins} min de hunt. Renove antes que expire.`,
          duration: 8000,
        });
      }
    }
    // Reset dedup when imbuement is no longer low (renewed / expired / removed)
    for (const id of notified.current) {
      if (!currentIds.has(id)) notified.current.delete(id);
    }
  }, [items]);
}
