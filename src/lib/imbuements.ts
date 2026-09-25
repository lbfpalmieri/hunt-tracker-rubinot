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
  // ISO date of the next imbuement applied to the same gear slot, if any — that's the
  // moment this one was replaced in-game, so hours after it stop counting here (they
  // belong to the new one instead). Null when this is still the current one for its slot.
  supersededAt: string | null = null,
): ImbuementBreakdown {
  const totalCost = IMB_TIER_COST[imb.tier] + (imb.goldTokenCost || 0);
  const costPerHour = totalCost / IMB_DURATION_HOURS;
  // "hoursRemaining" registered at creation = how much life the imbuement still had.
  // The actual cost the user still needs to amortize is proportional to that remaining life.
  const budgetHours = Math.max(0, Math.min(IMB_DURATION_HOURS, imb.hoursRemaining));
  const hoursAfter = sessions
    .filter(
      (s) =>
        s.characterId === imb.characterId &&
        s.createdAt >= imb.createdAt &&
        (supersededAt == null || s.createdAt < supersededAt),
    )
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
    // Uma vez substituído (renovado) por um novo imbuement no mesmo slot, este aqui já não
    // está mais ligado no jogo — não deve entrar no burn rate mesmo com horas "sobrando".
    active: supersededAt == null && hoursRemaining > 0,
  };
}

export function aggregateImbuements(
  imbuements: Imbuement[],
  sessions: HuntSession[],
  characterId: string,
) {
  const mine = imbuements.filter((i) => i.characterId === characterId);

  // Pra cada slot, o próximo imbuement (por data) marca quando o anterior foi substituído —
  // sem isso, um imbuement renovado continua "consumindo" as mesmas horas que o novo já está
  // contando, dobrando o custo/hora amortizado durante a sobreposição.
  // Um item aceita vários imbuements ao mesmo tempo (tipos diferentes). Só é "substituído"
  // quando um novo imbuement do MESMO tipo é aplicado no mesmo item (renovação).
  const keyOf = (i: Imbuement) => `${i.gearSlot}::${i.label ?? ""}`;
  const bySlotAsc = new Map<string, Imbuement[]>();
  for (const i of mine) {
    if (!i.gearSlot) continue;
    const arr = bySlotAsc.get(keyOf(i)) ?? [];
    arr.push(i);
    bySlotAsc.set(keyOf(i), arr);
  }
  for (const arr of bySlotAsc.values()) arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const supersededAtOf = (imb: Imbuement): string | null => {
    if (!imb.gearSlot) return null;
    const arr = bySlotAsc.get(keyOf(imb)) ?? [];
    const idx = arr.findIndex((x) => x.id === imb.id);
    return arr[idx + 1]?.createdAt ?? null;
  };

  const rows = mine.map((i) => computeImbuement(i, sessions, supersededAtOf(i)));
  const totalSpent = rows.reduce((a, r) => a + r.amountSpent, 0);
  const activeCostPerHour = rows
    .filter((r) => r.active)
    .reduce((a, r) => a + r.costPerHour, 0);
  return { rows, totalSpent, activeCostPerHour };
}
