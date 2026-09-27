import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSetup, presetPart, type SessionSetup } from "./session-setup";

/**
 * Presets de setup ("sets") por personagem (tabela setup_presets): a pessoa preenche arma,
 * skills, equipamentos (boneco), Wheel e postura uma vez, salva com um nome (normalmente o da
 * arma) e nas próximas sessões só escolhe. (O print do set foi removido em 2026-09-27 — o boneco
 * de equipamentos substitui; a coluna gear_url não é mais lida nem escrita.) Um EK com 3 armas elementais faz 3
 * sets. Charms não entram — dependem das criaturas de cada hunt. Tela dedicada: /equipamentos.
 */

// Tabela nova ainda não está nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SetupPreset {
  id: string;
  name: string;
  setup: SessionSetup;
}

const key = (characterId: string) => ["setup-presets", characterId] as const;

export function useSetupPresets(characterId: string | null) {
  return useQuery({
    queryKey: key(characterId ?? ""),
    enabled: !!characterId,
    queryFn: async (): Promise<SetupPreset[]> => {
      const { data, error } = await db
        .from("setup_presets")
        .select("id, name, setup")
        .eq("character_id", characterId)
        .order("name");
      if (error) return []; // tabela ainda não criada: sem presets, o resto funciona
      return (data ?? [])
        .map((r: { id: string; name: string; setup: unknown }) => ({
          id: r.id,
          name: r.name,
          setup: normalizeSetup(r.setup),
        }))
        .filter((p: { setup: SessionSetup | null }): p is SetupPreset => !!p.setup);
    },
  });
}

export function useSaveSetupPreset(characterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, setup }: { id?: string; name: string; setup: SessionSetup }) => {
      if (!characterId) throw new Error("Sem personagem ativo.");
      const clean = normalizeSetup(presetPart(setup));
      if (!clean) throw new Error("Preencha pelo menos um campo antes de salvar o preset.");
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) throw new Error("Sessão expirada — entre de novo.");
      const row = {
        user_id: uid,
        character_id: characterId,
        name: name.trim().slice(0, 40),
        setup: clean,
        updated_at: new Date().toISOString(),
      };
      // Com id = editar aquele set (inclusive renomear); sem id = cria ou sobrescreve pelo nome.
      const { error } = id
        ? await db.from("setup_presets").update(row).eq("id", id)
        : await db.from("setup_presets").upsert(row, { onConflict: "character_id,name" });
      if (error) {
        if (/duplicate|unique/i.test(error.message))
          throw new Error("Já existe um set com esse nome nesse personagem.");
        throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(characterId ?? "") }),
  });
}

export function useDeleteSetupPreset(characterId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("setup_presets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(characterId ?? "") }),
  });
}

/** Nome sugerido pro preset: "Soulbleeder T0". */
export function suggestedPresetName(s: SessionSetup): string {
  const base = s.weapon ?? s.stance ?? "Meu setup";
  return s.weaponTier != null ? `${base} T${s.weaponTier}` : base;
}
