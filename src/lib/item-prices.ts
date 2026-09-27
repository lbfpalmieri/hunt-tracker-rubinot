import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * "Meus preços": quanto cada item vale PRA MIM, por servidor (tabela user_item_prices). Boss
 * drop, gold/silver token, item de delivery task... quase tudo é vendido no market do RubinOT
 * e não no NPC — e o preço muda de servidor pra servidor. Usado no registro da Rotação de
 * Bosses: a pessoa escolhe calcular com os preços dela ou com o preço de NPC da TibiaWiki.
 * Os preços digitados no registro também são salvos aqui (a tabela vai se enchendo sozinha).
 */

// Tabela nova ainda não está nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface ItemPrice {
  item: string;
  price: number;
  updatedAt: string;
}

const key = (world: string) => ["item-prices", world] as const;

/** Preços do usuário no servidor (world do personagem ativo). Sem a tabela ainda: lista vazia. */
export function useItemPrices(world: string | null) {
  return useQuery({
    queryKey: key(world ?? ""),
    enabled: !!world,
    queryFn: async (): Promise<ItemPrice[]> => {
      const { data, error } = await db
        .from("user_item_prices")
        .select("item, price, updated_at")
        .eq("world", world)
        .order("item");
      if (error) return [];
      return (data ?? []).map((r: { item: string; price: number; updated_at: string }) => ({
        item: r.item,
        price: Number(r.price),
        updatedAt: r.updated_at,
      }));
    },
  });
}

export function priceMap(list: ItemPrice[] | undefined): Map<string, number> {
  return new Map((list ?? []).map((p) => [p.item, p.price]));
}

export function useSaveItemPrices(world: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: { item: string; price: number }[]) => {
      if (!world || entries.length === 0) return;
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) throw new Error("Sessão expirada — entre de novo.");
      const now = new Date().toISOString();
      const { error } = await db.from("user_item_prices").upsert(
        entries.map((e) => ({
          user_id: uid,
          world,
          item: e.item,
          price: Math.max(0, Math.round(e.price)),
          updated_at: now,
        })),
        { onConflict: "user_id,world,item" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(world ?? "") }),
  });
}

export function useDeleteItemPrice(world: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: string) => {
      const { error } = await db
        .from("user_item_prices")
        .delete()
        .eq("world", world)
        .eq("item", item);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(world ?? "") }),
  });
}
