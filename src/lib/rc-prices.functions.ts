import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RcPriceEntry {
  id: string;
  world: string;
  /** Gold que 1 Rubini Coin vale nesse servidor, nesse dia. */
  price: number;
  targetGold: number | null;
  /** YYYY-MM-DD */
  recordedOn: string;
}

const COLUMNS = "id, world, price, target_gold, recorded_on";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toEntry = (r: any): RcPriceEntry => ({
  id: r.id,
  world: r.world,
  price: Number(r.price),
  targetGold: r.target_gold == null ? null : Number(r.target_gold),
  recordedOn: r.recorded_on,
});

export const listRcPrices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (context.supabase as any)
      .from("rc_price_entries")
      .select(COLUMNS)
      .order("recorded_on", { ascending: true });
    if (error) return { entries: [] as RcPriceEntry[], error: error.message as string };
    return { entries: (data ?? []).map(toEntry) as RcPriceEntry[] };
  });

const saveInput = z.object({
  world: z.string().trim().min(1).max(40),
  price: z.number().int().positive().max(1_000_000_000_000),
  targetGold: z.number().int().positive().max(1_000_000_000_000).nullable(),
  recordedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const saveRcPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (context.supabase as any)
      .from("rc_price_entries")
      .upsert(
        {
          user_id: context.userId,
          world: data.world,
          price: data.price,
          target_gold: data.targetGold,
          recorded_on: data.recordedOn,
        },
        { onConflict: "user_id,world,recorded_on" },
      )
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { entry: toEntry(row) };
  });

export const deleteRcPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any)
      .from("rc_price_entries")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
