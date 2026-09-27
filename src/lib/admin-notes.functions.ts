import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Leitura das observações (notes) das sessões de TODOS os usuários — só admin.
 * As observações continuam privadas para os demais jogadores: esta função
 * confere o papel admin pelo cliente do próprio usuário (RLS) e só então
 * carrega o cliente privilegiado. Nunca expõe e-mail — identifica pelo
 * personagem (char_name) gravado na sessão.
 */
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Apenas o administrador pode fazer isso.");
}

export interface AdminNoteRow {
  sessionId: string;
  huntName: string;
  charName: string | null;
  notes: string;
  createdAt: string;
}

export const listAllSessionNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminNoteRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows: AdminNoteRow[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabaseAdmin
        .from("hunt_sessions")
        .select("id, hunt_name, char_name, notes, created_at")
        .not("notes", "is", null)
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      for (const r of data ?? []) {
        const notes = (r.notes ?? "").trim();
        if (!notes) continue;
        rows.push({
          sessionId: r.id,
          huntName: r.hunt_name,
          charName: r.char_name ?? null,
          notes,
          createdAt: r.created_at,
        });
      }
      if (!data || data.length < 1000) break;
    }
    return rows;
  });
