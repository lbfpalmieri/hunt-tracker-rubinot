import { z } from "zod";
import type { HuntSession, Imbuement, ImbuementStoredPeriod, ImbuementTier } from "./store";


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

/**
 * Mais de um item do mesmo tipo (pedido de jogador: 2 rods, cada uma com o seu imbuement).
 * imbuements.gear_slot guarda o ITEM: "weapon" = 1ª arma (todo dado antigo), "weapon#2" = 2ª arma...
 * Assim keyOf (`${gearSlot}::${label}`) já separa a renovação por item, sem mexer no que existe.
 */
export const MAX_ITEMS_PER_SLOT = 4;

export function gearItemKey(slot: string, n: number): string {
  return n <= 1 ? slot : `${slot}#${n}`;
}

export function parseGearItem(key: string | null | undefined): { slot: string; n: number } | null {
  if (!key) return null;
  const [slot, raw] = key.split("#");
  const n = Number(raw);
  return { slot, n: Number.isInteger(n) && n >= 2 ? n : 1 };
}

const StoredPeriodsSchema = z.array(z.object({ from: z.string(), to: z.string().nullable() }));

/** imbuements.stored_periods (jsonb) → lista; null ou formato estranho = nunca guardado. */
export function parseStoredPeriods(raw: unknown): ImbuementStoredPeriod[] {
  const parsed = StoredPeriodsSchema.safeParse(raw ?? []);
  return parsed.success ? parsed.data : [];
}

const isOpen = (imb: Imbuement) => (imb.storedPeriods ?? []).some((p) => p.to == null);

// Datas do banco ("...+00:00") e do navegador ("...Z") têm formatos diferentes: comparar por número.
const wasStoredAt = (imb: Imbuement, at: string) => {
  const t = Date.parse(at);
  return (imb.storedPeriods ?? []).some(
    (p) => Date.parse(p.from) <= t && (p.to == null || t < Date.parse(p.to)),
  );
};

export interface ImbuementBreakdown {
  imb: Imbuement;
  totalCost: number;
  costPerHour: number;
  hoursConsumed: number;
  hoursRemaining: number;
  amountSpent: number;
  active: boolean;
  /** Item guardado agora (na mochila, com tempo sobrando): não gasta e não entra no custo/h. */
  stored: boolean;
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
        (supersededAt == null || s.createdAt < supersededAt) &&
        // No jogo o tempo só corre com o item equipado: hunt feita com o item guardado não gasta.
        !wasStoredAt(imb, s.createdAt),
    )
    .reduce((a, s) => a + s.hunting.durationSec / 3600, 0);
  const hoursConsumed = Math.min(hoursAfter, budgetHours);
  const hoursRemaining = Math.max(0, budgetHours - hoursConsumed);
  const amountSpent = costPerHour * hoursConsumed;
  const current = supersededAt == null && hoursRemaining > 0;
  return {
    imb,
    totalCost,
    costPerHour,
    hoursConsumed,
    hoursRemaining,
    amountSpent,
    // Uma vez substituído (renovado) por um novo imbuement no mesmo slot, este aqui já não
    // está mais ligado no jogo — não deve entrar no burn rate mesmo com horas "sobrando".
    active: current && !isOpen(imb),
    stored: current && isOpen(imb),
  };
}

// Um item aceita vários imbuements ao mesmo tempo (tipos diferentes). Só é "substituído"
// quando um novo imbuement do MESMO tipo é aplicado no mesmo item (renovação).
const keyOf = (i: Imbuement) => `${i.gearSlot}::${i.label ?? ""}`;

/**
 * Pra cada item, o próximo imbuement do mesmo tipo (por data) marca quando o anterior foi
 * substituído — sem isso, um imbuement renovado continua "consumindo" as mesmas horas que o novo
 * já está contando, dobrando o custo/hora amortizado durante a sobreposição.
 */
function supersededAtFn(mine: Imbuement[]) {
  const byKeyAsc = new Map<string, Imbuement[]>();
  for (const i of mine) {
    if (!i.gearSlot) continue;
    const arr = byKeyAsc.get(keyOf(i)) ?? [];
    arr.push(i);
    byKeyAsc.set(keyOf(i), arr);
  }
  for (const arr of byKeyAsc.values()) arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (imb: Imbuement): string | null => {
    if (!imb.gearSlot) return null;
    const arr = byKeyAsc.get(keyOf(imb)) ?? [];
    const idx = arr.findIndex((x) => x.id === imb.id);
    return arr[idx + 1]?.createdAt ?? null;
  };
}

export function aggregateImbuements(
  imbuements: Imbuement[],
  sessions: HuntSession[],
  characterId: string,
) {
  const mine = imbuements.filter((i) => i.characterId === characterId);
  const supersededAtOf = supersededAtFn(mine);
  const rows = mine.map((i) => computeImbuement(i, sessions, supersededAtOf(i)));
  const totalSpent = rows.reduce((a, r) => a + r.amountSpent, 0);
  const activeCostPerHour = rows
    .filter((r) => r.active)
    .reduce((a, r) => a + r.costPerHour, 0);
  return { rows, totalSpent, activeCostPerHour };
}

/**
 * "Usar este item": só um item por slot fica equipado no jogo. Abre um período guardado nos
 * imbuements atuais dos OUTROS itens do mesmo slot e fecha o do item escolhido, em `now`.
 * Devolve só as linhas que mudam (o que gravar em imbuements.stored_periods).
 */
export function planEquipItem(
  imbuements: Imbuement[],
  characterId: string,
  itemKey: string,
  now: string,
): { id: string; storedPeriods: ImbuementStoredPeriod[] }[] {
  const slot = parseGearItem(itemKey)?.slot;
  if (!slot) return [];
  const mine = imbuements.filter((i) => i.characterId === characterId);
  const supersededAtOf = supersededAtFn(mine);
  const updates: { id: string; storedPeriods: ImbuementStoredPeriod[] }[] = [];
  for (const i of mine) {
    if (parseGearItem(i.gearSlot)?.slot !== slot || supersededAtOf(i) != null) continue;
    const periods = i.storedPeriods ?? [];
    if (i.gearSlot === itemKey) {
      if (isOpen(i)) {
        updates.push({ id: i.id, storedPeriods: periods.map((p) => (p.to == null ? { ...p, to: now } : p)) });
      }
    } else if (!isOpen(i)) {
      updates.push({ id: i.id, storedPeriods: [...periods, { from: now, to: null }] });
    }
  }
  return updates;
}

/**
 * Imbuement novo (ou renovado) num item: começa guardado se o item está guardado, ou se outro
 * item do mesmo slot é o que está em uso (ex.: cadastrou a 2ª rod enquanto usa a 1ª).
 */
export function itemStartsStored(rows: ImbuementBreakdown[], itemKey: string): boolean {
  const slot = parseGearItem(itemKey)?.slot;
  const live = rows.filter((r) => (r.active || r.stored) && parseGearItem(r.imb.gearSlot)?.slot === slot);
  const own = live.filter((r) => r.imb.gearSlot === itemKey);
  if (own.length > 0) return own.some((r) => r.stored);
  return live.some((r) => r.active);
}
