import type { HuntSession, Imbuement, ImbuementTier } from "./store";


export const IMB_TIER_COST: Record<ImbuementTier, number> = {
  basic: 7500,
  intricate: 60000,
  powerful: 250000,
};

export const IMB_TIER_LABEL: Record<ImbuementTier, string> = {
  basic: "Basic",
  intricate: "Intricate",
  powerful: "Powerful",
};

export const IMB_DURATION_HOURS = 20;

export interface ImbuementBreakdown {
  imb: Imbuement;
  totalCost: number;
  costPerHour: number;
  hoursConsumed: number;
  hoursRemaining: number;
  amountSpent: number;
  active: boolean;
}

export function computeImbuement(
  imb: Imbuement,
  sessions: HuntSession[],
): ImbuementBreakdown {
  const totalCost = IMB_TIER_COST[imb.tier] + (imb.goldTokenCost || 0);
  const costPerHour = totalCost / IMB_DURATION_HOURS;
  // "hoursRemaining" registered at creation = how much life the imbuement still had.
  // The actual cost the user still needs to amortize is proportional to that remaining life.
  const budgetHours = Math.max(0, Math.min(IMB_DURATION_HOURS, imb.hoursRemaining));
  const hoursAfter = sessions
    .filter((s) => s.characterId === imb.characterId && s.createdAt >= imb.createdAt)
    .reduce((a, s) => a + s.hunting.durationSec / 3600, 0);
  const hoursConsumed = Math.min(hoursAfter, budgetHours);
  const hoursRemaining = Math.max(0, budgetHours - hoursConsumed);
  const amountSpent = costPerHour * hoursConsumed;
  return {
    imb,
    totalCost,
    costPerHour,
    hoursConsumed,
    hoursRemaining,
    amountSpent,
    active: hoursRemaining > 0,
  };
}

export function aggregateImbuements(
  imbuements: Imbuement[],
  sessions: HuntSession[],
  characterId: string,
) {
  const rows = imbuements
    .filter((i) => i.characterId === characterId)
    .map((i) => computeImbuement(i, sessions));
  const totalSpent = rows.reduce((a, r) => a + r.amountSpent, 0);
  const activeCostPerHour = rows
    .filter((r) => r.active)
    .reduce((a, r) => a + r.costPerHour, 0);
  return { rows, totalSpent, activeCostPerHour };
}
