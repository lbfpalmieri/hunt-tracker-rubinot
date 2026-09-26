import { supabase } from "@/integrations/supabase/client";
import type { PartyKind } from "./boss-catalog";

/**
 * Rotações de bosses do usuário e as execuções registradas (Hunting Analyser colado depois de
 * fazer a rotação). Tabelas: boss_rotations, boss_rotation_runs, user_boss_prefs — todas com RLS
 * por user_id, acessadas direto do cliente (mesmo padrão de linked_task_progress).
 */

// Tabelas novas ainda não estão nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface BossRotation {
  id: string;
  name: string;
  bosses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BossDrop {
  name: string;
  count: number;
}

export interface BossRotationRun {
  id: string;
  rotationId: string;
  characterId: string | null;
  ranAt: string;
  durationSec: number;
  loot: number;
  supplies: number;
  balance: number;
  xp: number;
  partySize: number;
  bossesKilled: string[];
  drops: BossDrop[];
  notes: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowRotation = (r: any): BossRotation => ({
  id: r.id,
  name: r.name,
  bosses: r.bosses ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowRun = (r: any): BossRotationRun => ({
  id: r.id,
  rotationId: r.rotation_id,
  characterId: r.character_id,
  ranAt: r.ran_at,
  durationSec: r.duration_sec,
  loot: Number(r.loot),
  supplies: Number(r.supplies),
  balance: Number(r.balance),
  xp: Number(r.xp),
  partySize: r.party_size,
  bossesKilled: r.bosses_killed ?? [],
  drops: Array.isArray(r.drops) ? r.drops : [],
  notes: r.notes,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check({ data, error }: { data: any; error: { message: string } | null }): any {
  if (error) throw new Error(error.message);
  return data;
}

export async function listRotations(): Promise<BossRotation[]> {
  const rows = check(
    await db.from("boss_rotations").select("*").order("updated_at", { ascending: false }),
  );
  return (rows ?? []).map(rowRotation);
}

export async function createRotation(name: string, bosses: string[]): Promise<BossRotation> {
  return rowRotation(
    check(await db.from("boss_rotations").insert({ name, bosses }).select().single()),
  );
}

export async function updateRotation(id: string, patch: { name?: string; bosses?: string[] }) {
  check(
    await db
      .from("boss_rotations")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id),
  );
}

export async function deleteRotation(id: string) {
  check(await db.from("boss_rotations").delete().eq("id", id));
}

/** Todas as execuções do usuário (ou só de uma rotação). */
export async function listRuns(rotationId?: string): Promise<BossRotationRun[]> {
  let q = db.from("boss_rotation_runs").select("*").order("ran_at", { ascending: true });
  if (rotationId) q = q.eq("rotation_id", rotationId);
  const rows = check(await q);
  return (rows ?? []).map(rowRun);
}

export type NewRun = Omit<BossRotationRun, "id">;

export async function addRun(run: NewRun): Promise<BossRotationRun> {
  const row = check(
    await db
      .from("boss_rotation_runs")
      .insert({
        rotation_id: run.rotationId,
        character_id: run.characterId,
        ran_at: run.ranAt,
        duration_sec: run.durationSec,
        loot: run.loot,
        supplies: run.supplies,
        balance: run.balance,
        xp: run.xp,
        party_size: run.partySize,
        bosses_killed: run.bossesKilled,
        drops: run.drops,
        notes: run.notes,
      })
      .select()
      .single(),
  );
  // "Mexeu por último" = rotação sobe na lista.
  await db
    .from("boss_rotations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", run.rotationId);
  return rowRun(row);
}

export async function deleteRun(id: string) {
  check(await db.from("boss_rotation_runs").delete().eq("id", id));
}

export async function loadPartyOverrides(): Promise<Record<string, PartyKind>> {
  const { data, error } = await db.from("user_boss_prefs").select("party").maybeSingle();
  if (error || !data) return {};
  return (data.party ?? {}) as Record<string, PartyKind>;
}

export async function savePartyOverrides(party: Record<string, PartyKind>) {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user?.id;
  if (!uid) return;
  check(
    await db
      .from("user_boss_prefs")
      .upsert(
        { user_id: uid, party, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      ),
  );
}

export interface RunStats {
  runs: number;
  totalBalance: number;
  avgBalance: number;
  /** Lucro por hora somando todas as execuções (total ÷ horas totais). */
  balancePerHour: number;
  avgDurationSec: number;
  best: BossRotationRun | null;
}

export function runStats(runs: BossRotationRun[]): RunStats {
  const totalBalance = runs.reduce((a, r) => a + r.balance, 0);
  const totalSec = runs.reduce((a, r) => a + r.durationSec, 0);
  return {
    runs: runs.length,
    totalBalance,
    avgBalance: runs.length ? totalBalance / runs.length : 0,
    balancePerHour: totalSec > 0 ? totalBalance / (totalSec / 3600) : 0,
    avgDurationSec: runs.length ? totalSec / runs.length : 0,
    best: runs.reduce<BossRotationRun | null>(
      (b, r) => (!b || r.balance > b.balance ? r : b),
      null,
    ),
  };
}

/** Última vez que cada boss morreu pra esse personagem (pelas execuções registradas). */
export function lastKills(
  runs: BossRotationRun[],
  characterId: string | null,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of runs) {
    if (characterId && r.characterId !== characterId) continue;
    for (const b of r.bossesKilled) {
      const prev = out.get(b);
      if (!prev || r.ranAt > prev) out.set(b, r.ranAt);
    }
  }
  return out;
}

/** ms até o boss voltar (0 = disponível). null = a wiki não informa o cooldown. */
export function msUntilAvailable(
  lastKill: string | undefined,
  cooldownSec: number,
  now = Date.now(),
): number | null {
  if (!lastKill) return 0;
  if (!cooldownSec) return null;
  return Math.max(0, new Date(lastKill).getTime() + cooldownSec * 1000 - now);
}

export function fmtWait(ms: number): string {
  const min = Math.ceil(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h >= 48) return `${Math.round(h / 24)} dias`;
  if (h === 0) return `${m}min`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}
