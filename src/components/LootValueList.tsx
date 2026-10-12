import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/GameIcon";
import { fmtGold, fmtNum } from "@/lib/format";
import { priceMap, useItemPrices, useSaveItemPrices } from "@/lib/item-prices";
import { sortLoot, valueLoot, type LootSort } from "@/lib/loot-value";

/**
 * Itens lootados com o valor de cada um (preço de "Meus preços" × quantidade), pra ver o que
 * pagou a hunt. Item sem preço mostra um campo pra preencher na hora; o preço fica salvo no
 * servidor do personagem e vale pras próximas sessões e pro registro de boss.
 */
export function LootValueList({
  items,
  world,
}: {
  items: { name: string; count: number }[];
  world: string | null;
}) {
  const { data } = useItemPrices(world);
  const save = useSaveItemPrices(world);
  const [sort, setSort] = useState<LootSort>("value");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const value = useMemo(() => valueLoot(items, priceMap(data)), [items, data]);
  const rows = useMemo(() => sortLoot(value.rows, sort), [value.rows, sort]);

  const commit = (name: string) => {
    const n = Number((drafts[name] ?? "").replace(/\D/g, ""));
    if (!world || !n) return;
    save.mutate([{ item: name, price: n }], {
      onSuccess: () => {
        setDrafts((d) => {
          const { [name]: _gone, ...rest } = d;
          return rest;
        });
        toast.success("Preço salvo", { description: `${name}: ${fmtGold(n)} cada` });
      },
      onError: () => toast.error("Não consegui salvar o preço"),
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Valor com os seus preços (Meus preços){world ? ` em ${world}` : ""}:{" "}
          <b className="text-rubi-gold">{fmtGold(value.pricedTotal)}</b>
          {value.unpriced > 0 && ` · ${value.unpriced} item(ns) sem preço`}
        </p>
        <div role="group" aria-label="Ordenar itens" className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs font-semibold">
          {(["value", "count"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={sort === k}
              onClick={() => setSort(k)}
              className={
                "min-h-9 rounded-md px-3 transition-colors " +
                (sort === k ? "bg-rubi-blue text-primary-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {k === "value" ? "Por valor" : "Por quantidade"}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
          >
            <GameIcon
              name={r.name}
              size={24}
              className="flex-none"
              fallback={<Package className="h-5 w-5 flex-none text-muted-foreground/50" />}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{r.name}</span>
              <span className="block font-mono text-xs text-muted-foreground">×{fmtNum(r.count)}</span>
            </span>
            {r.total != null ? (
              <span className="flex-none text-right">
                <span className="block font-mono font-semibold text-rubi-gold">{fmtGold(r.total)}</span>
                {!r.fromCoins && r.count > 1 && (
                  <span className="block font-mono text-2xs text-muted-foreground">
                    {fmtNum(r.unit ?? 0)} cada
                  </span>
                )}
              </span>
            ) : world ? (
              <input
                inputMode="numeric"
                aria-label={`Preço de ${r.name}`}
                placeholder="preço"
                value={drafts[r.name] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.name]: e.target.value }))}
                onBlur={() => commit(r.name)}
                onKeyDown={(e) => e.key === "Enter" && commit(r.name)}
                className="min-h-9 w-24 flex-none rounded-md border border-border bg-input px-2 text-right font-mono text-xs"
              />
            ) : (
              <span className="flex-none text-xs text-muted-foreground">sem preço</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
