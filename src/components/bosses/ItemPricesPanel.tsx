import { useMemo, useState } from "react";
import { Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/GameIcon";
import type { BossCatalog } from "@/lib/boss-catalog";
import { fmtGold } from "@/lib/format";
import { useDeleteItemPrice, useItemPrices, useSaveItemPrices } from "@/lib/item-prices";
import { parseGoldInput } from "@/lib/rc-calc";

const cleanItem = (s: string) =>
  s
    .replace(/[^\p{L}\p{N} '-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);

/**
 * "Meus preços" do servidor: quanto cada item vale no market do RubinOT pra mim. É o que o
 * registro da rotação usa em "Meus preços" (o preço de NPC da TibiaWiki fica de referência).
 */
export function ItemPricesPanel({
  catalog,
  world,
}: {
  catalog: BossCatalog;
  world: string | null;
}) {
  const { data: list = [], isLoading } = useItemPrices(world);
  const save = useSaveItemPrices(world);
  const remove = useDeleteItemPrice(world);
  const [q, setQ] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const itemNames = useMemo(() => [...catalog.items.keys()].sort(), [catalog]);
  const shown = list.filter(
    (p) => !q.trim() || p.item.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const add = async () => {
    const item = cleanItem(newItem);
    const price = parseGoldInput(newPrice);
    if (!item || !price) {
      toast.error("Informe o item e o preço (ex: 150k, 1,5kk)");
      return;
    }
    try {
      await save.mutateAsync([{ item, price }]);
      setNewItem("");
      setNewPrice("");
    } catch (e) {
      toast.error("Não consegui salvar", { description: (e as Error).message });
    }
  };

  const commit = (item: string) => {
    const raw = edits[item];
    if (raw == null) return;
    const price = parseGoldInput(raw);
    setEdits(({ [item]: _, ...rest }) => rest);
    if (!price) return;
    save.mutate([{ item, price }], {
      onError: (e) => toast.error("Não consegui salvar", { description: e.message }),
    });
  };

  if (!world) {
    return (
      <div className="card-surface p-8 text-center text-sm text-muted-foreground">
        Selecione um personagem — os preços ficam salvos por servidor.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-surface p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Tag className="h-5 w-5 text-rubi-gold" /> Meus preços · {world}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quanto cada item vale pra você no market do seu servidor (drops raros, gold/silver token,
          item de delivery task...). Ao registrar uma rotação você escolhe calcular com esses preços
          ou com o preço de NPC. O que você digitar no registro também entra aqui.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            list="boss-item-names"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Item (ex: Gold Token, Falcon Plate)"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
          />
          <datalist id="boss-item-names">
            {itemNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <input
            inputMode="decimal"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Preço (ex: 45k)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold sm:w-40"
          />
          <button
            type="button"
            onClick={add}
            disabled={save.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="card-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{list.length} itens com preço</span>
          {list.length > 8 && (
            <label className="relative w-48">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar"
                className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-sm outline-none"
              />
            </label>
          )}
        </div>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/30" />
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum preço ainda. Adicione acima ou registre uma rotação digitando o preço dos drops.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {shown.map((p) => {
              const ref = catalog.items.get(p.item);
              return (
                <li key={p.item} className="flex items-center gap-3 py-2">
                  <GameIcon name={p.item} size={28} className="flex-none" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.item}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {ref?.npc ? `NPC ${fmtGold(ref.npc)}` : "sem preço de NPC"}
                      {ref?.marketMax
                        ? ` · Tibia oficial ${fmtGold(ref.marketMin)}–${fmtGold(ref.marketMax)}`
                        : ""}
                    </span>
                  </span>
                  <input
                    inputMode="decimal"
                    aria-label={`Preço de ${p.item}`}
                    value={edits[p.item] ?? String(p.price)}
                    onChange={(e) => setEdits((m) => ({ ...m, [p.item]: e.target.value }))}
                    onBlur={() => commit(p.item)}
                    onKeyDown={(e) => e.key === "Enter" && commit(p.item)}
                    className="w-28 rounded-md border border-border bg-background px-2 py-1 text-right text-sm outline-none focus:border-rubi-gold"
                  />
                  <span className="hidden w-16 text-right text-xs font-semibold text-rubi-gold sm:block">
                    {fmtGold(p.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(p.item)}
                    aria-label={`Remover ${p.item}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
