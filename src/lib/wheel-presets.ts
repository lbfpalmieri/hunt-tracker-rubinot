import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isEmptyWheel, normalizeWheel, type WheelBuild } from "./wheel";

/**
 * Rodas salvas (Wheel of Destiny) por personagem — tabela wheel_presets. SEPARADAS dos sets
 * (setup-presets.ts): o set guarda equipamento + postura, a roda é cadastrada em /rodas e escolhida
 * à parte na sessão ou na execução de boss. Assim dá pra testar rodas diferentes com o mesmo
 * equipamento sem duplicar set. Na sessão fica uma CÓPIA da roda (hunt_sessions.setup.wheel) —
 * editar ou excluir a roda salva depois não muda sessões antigas.
 */

// Tabela nova ainda não está nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface WheelPreset {
  id: string;
  name: string;
  wheel: WheelBuild;
}

export const WHEEL_PRESET_NAME_MAX = 40;

const key = (characterId: string) => ["wheel-presets", characterId] as const;

/** Mesma roda? (compara o conteúdo, não a referência — a sessão guarda uma cópia). */
export function sameWheel(a: WheelBuild | null | undefined, b: WheelBuild | null | undefined) {
  if (!a || !b) return false;
  return JSON.stringify(normalizeWheel(a)) === JSON.stringify(normalizeWheel(b));
}

/** Linhas do banco → rodas válidas (descarta o que não der pra ler). */
export function rowsToWheelPresets(rows: unknown): WheelPreset[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r: { id?: unknown; name?: unknown; wheel?: unknown }) => ({
      id: String(r?.id ?? ""),
      name: String(r?.name ?? ""),
      wheel: normalizeWheel(r?.wheel),
    }))
    .filter((p): p is WheelPreset => !!p.id && !!p.wheel);
}

/** Nome sugerido: "Roda", "Roda 2"... sem repetir os que já existem. */
export function suggestedWheelName(existing: { name: string }[]): string {
  const taken = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  if (!taken.has("roda")) return "Roda";
  for (let n = 2; ; n++) if (!taken.has(`roda ${n}`)) return `Roda ${n}`;
}

export function useWheelPresets(characterId: string | null) {
  return useQuery({
    queryKey: key(characterId ?? ""),
    enabled: !!characterId,
    queryFn: async (): Promise<WheelPreset[]> => {
      const { data, error } = await db
        .from("wheel_presets")
        .select("id, name, wheel")
        .eq("character_id", characterId)
        .order("name");
      if (error) return []; // tabela ainda não criada: sem rodas salvas, o resto funciona
      return rowsToWheelPresets(data);
    },
  });
}

export function useSaveWheelPreset(characterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, wheel }: { id?: string; name: string; wheel: WheelBuild }) => {
      if (!characterId) throw new Error("Sem personagem ativo.");
      const clean = normalizeWheel(wheel);
      if (!clean || isEmptyWheel(clean)) throw new Error("Monte a roda antes de salvar.");
      const finalName = name.trim().slice(0, WHEEL_PRESET_NAME_MAX);
      if (!finalName) throw new Error("Dê um nome pra roda.");
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) throw new Error("Sessão expirada — entre de novo.");
      const row = {
        user_id: uid,
        character_id: characterId,
        name: finalName,
        wheel: clean,
        updated_at: new Date().toISOString(),
      };
      // Com id = editar aquela roda (inclusive renomear); sem id = cria (nome repetido dá erro).
      const { error } = id
        ? await db.from("wheel_presets").update(row).eq("id", id)
        : await db.from("wheel_presets").insert(row);
      if (error) {
        if (/duplicate|unique/i.test(error.message))
          throw new Error("Já existe uma roda com esse nome nesse personagem.");
        throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(characterId ?? "") }),
  });
}

export function useDeleteWheelPreset(characterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("wheel_presets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(characterId ?? "") }),
  });
}
