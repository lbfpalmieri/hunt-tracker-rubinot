import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ferramentas de admin para corrigir nomes de hunt de TODOS os usuários.
 * Segurança: o papel admin é conferido pelo cliente do próprio usuário (RLS: só lê o
 * próprio papel em user_roles); só depois disso o cliente privilegiado é carregado.
 */
const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Apenas o administrador pode fazer isso.");
}

async function fetchAllSessions(admin: any) {
  const rows: { id: string; hunt_name: string; user_id: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("hunt_sessions")
      .select("id, hunt_name, user_id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export const listAllHuntNames = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = await fetchAllSessions(supabaseAdmin);
    const map = new Map<string, { name: string; sessions: number; players: Set<string>; spellings: Map<string, number> }>();
    for (const r of rows) {
      const key = norm(r.hunt_name ?? "");
      if (!key) continue;
      let e = map.get(key);
      if (!e) map.set(key, (e = { name: r.hunt_name.trim(), sessions: 0, players: new Set(), spellings: new Map() }));
      e.sessions++;
      e.players.add(r.user_id);
      const sp = r.hunt_name.trim();
      e.spellings.set(sp, (e.spellings.get(sp) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([key, e]) => {
        const name = [...e.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0];
        return { key, name, sessions: e.sessions, players: e.players.size, variants: e.spellings.size };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  });

export const renameHuntGlobal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ from: z.string().trim().min(1).max(120), to: z.string().trim().min(2).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const fromKey = norm(data.from);
    let target = data.to.trim().replace(/\s+/g, " ");
    const toKey = norm(target);

    const rows = await fetchAllSessions(supabaseAdmin);
    // Se o novo nome já existe (em qualquer grafia), usa a grafia mais comum — assim junta
    // tudo numa hunt só em vez de criar "Asura" e "asura" separadas.
    const counts = new Map<string, number>();
    for (const r of rows) if (norm(r.hunt_name) === toKey && norm(r.hunt_name) !== fromKey) {
      const sp = r.hunt_name.trim();
      counts.set(sp, (counts.get(sp) ?? 0) + 1);
    }
    const merged = counts.size > 0;
    if (merged && fromKey !== toKey) target = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

    const ids = rows.filter((r) => norm(r.hunt_name) === fromKey).map((r) => r.id);
    if (ids.length === 0) throw new Error("Nenhuma sessão com esse nome.");
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabaseAdmin
        .from("hunt_sessions")
        .update({ hunt_name: target })
        .in("id", ids.slice(i, i + 200));
      if (error) throw new Error(error.message);
    }

    // Lista de hunts salvas (autocomplete) de cada personagem: renomeia, ou apaga a antiga
    // quando o personagem já tinha a hunt de destino (evita duplicata).
    const { data: huntRows, error: hErr } = await supabaseAdmin.from("hunts").select("id, character_id, name");
    if (hErr) throw new Error(hErr.message);
    const all = huntRows ?? [];
    const toDelete: string[] = [];
    const toRename: string[] = [];
    for (const h of all) {
      if (norm(h.name) !== fromKey) continue;
      const hasTarget = all.some(
        (o) => o.id !== h.id && o.character_id === h.character_id && norm(o.name) === toKey && norm(o.name) !== fromKey,
      );
      (hasTarget ? toDelete : toRename).push(h.id);
    }
    if (toDelete.length) {
      const { error } = await supabaseAdmin.from("hunts").delete().in("id", toDelete);
      if (error) throw new Error(error.message);
    }
    if (toRename.length) {
      const { error } = await supabaseAdmin.from("hunts").update({ name: target }).in("id", toRename);
      if (error) throw new Error(error.message);
    }
    return { updated: ids.length, merged: merged && fromKey !== toKey, finalName: target };
  });
