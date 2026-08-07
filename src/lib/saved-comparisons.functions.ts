import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CompareHunt } from "./compare";

export interface SavedComparison {
  id: string;
  title: string;
  notes: string;
  huntNotes: Record<string, string>;
  hunts: CompareHunt[];
  includeBounty: boolean;
  includePrey: boolean;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSaved = (r: any): SavedComparison => ({
  id: r.id,
  title: r.title,
  notes: r.notes ?? "",
  huntNotes: (r.hunt_notes ?? {}) as Record<string, string>,
  hunts: (r.hunts ?? []) as CompareHunt[],
  includeBounty: !!r.include_bounty,
  includePrey: !!r.include_prey,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const COLUMNS =
  "id, title, notes, hunt_notes, hunts, include_bounty, include_prey, created_at, updated_at";

export const listSavedComparisons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_comparisons")
      .select(COLUMNS)
      .order("created_at", { ascending: false });
    if (error) return { comparisons: [] as SavedComparison[], error: error.message };
    return { comparisons: (data ?? []).map(toSaved) };
  });

const saveInput = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(4000).optional(),
  huntNotes: z.record(z.string(), z.string().max(2000)).optional(),
  hunts: z.array(z.unknown()).min(2).max(4),
  includeBounty: z.boolean(),
  includePrey: z.boolean(),
});

export const saveComparison = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_comparisons")
      .insert({
        user_id: context.userId,
        title: data.title,
        notes: data.notes ?? "",
        hunt_notes: data.huntNotes ?? {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hunts: data.hunts as any,
        include_bounty: data.includeBounty,
        include_prey: data.includePrey,
      })
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { comparison: toSaved(row) };
  });

const updateInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120).optional(),
  notes: z.string().max(4000).optional(),
  huntNotes: z.record(z.string(), z.string().max(2000)).optional(),
});

export const updateComparison = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateInput.parse(input))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.huntNotes !== undefined) patch.hunt_notes = data.huntNotes;
    const { data: row, error } = await context.supabase
      .from("saved_comparisons")
      .update(patch)
      .eq("id", data.id)
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { comparison: toSaved(row) };
  });

export const deleteComparison = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_comparisons")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
