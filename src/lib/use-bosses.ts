import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { estimatedParty, loadBossCatalog, type Boss, type PartyKind } from "./boss-catalog";
import { listRotations, listRuns, loadPartyOverrides, savePartyOverrides } from "./boss-rotations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const bossKeys = {
  catalog: ["boss-catalog"] as const,
  party: ["boss-party"] as const,
  rotations: ["boss-rotations"] as const,
  runs: ["boss-runs"] as const,
  admin: ["is-admin"] as const,
};

export function useBossCatalog() {
  return useQuery({
    queryKey: bossKeys.catalog,
    queryFn: loadBossCatalog,
    staleTime: 60 * 60 * 1000,
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: bossKeys.admin,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) return false;
      const { data } = await db.from("user_roles").select("role").eq("user_id", uid);
      return (data ?? []).some((r: { role: string }) => r.role === "admin");
    },
  });
}

export function useRotations() {
  return useQuery({ queryKey: bossKeys.rotations, queryFn: listRotations });
}

/** Todas as execuções do usuário (a gente filtra por rotação/personagem no cliente). */
export function useRuns() {
  return useQuery({ queryKey: bossKeys.runs, queryFn: () => listRuns() });
}

const EMPTY: Record<string, PartyKind> = {};

/** Solo/time por boss: ajuste do usuário, senão a estimativa pela vida. */
export function useBossParty() {
  const qc = useQueryClient();
  const { data: overrides = EMPTY } = useQuery({
    queryKey: bossKeys.party,
    queryFn: loadPartyOverrides,
  });
  const mutation = useMutation({
    mutationFn: savePartyOverrides,
    onMutate: (next) => {
      const prev = qc.getQueryData(bossKeys.party);
      qc.setQueryData(bossKeys.party, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(bossKeys.party, ctx?.prev),
  });
  const partyOf = useCallback(
    (b: Boss): { party: PartyKind; estimated: boolean } => {
      const o = overrides[b.name];
      return o ? { party: o, estimated: false } : { party: estimatedParty(b), estimated: true };
    },
    [overrides],
  );
  const setParty = (name: string, party: PartyKind | null) => {
    const next = { ...overrides };
    if (party) next[name] = party;
    else delete next[name];
    mutation.mutate(next);
  };
  return { partyOf, setParty };
}
