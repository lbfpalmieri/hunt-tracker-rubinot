import { useMemo, useRef, useState } from "react";
import { Package, Pencil } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/GameIcon";
import { fmtGold, fmtNum } from "@/lib/format";
import { LOOT_CATEGORY_LABEL } from "@/lib/item-info";
import { priceMap, useDeleteItemPrice, useItemPrices, useSaveItemPrices } from "@/lib/item-prices";
import { groupLoot, valueLoot, type LootRow, type LootSort } from "@/lib/loot-value";
import { parseGoldInput } from "@/lib/rc-calc";

/**
 * Itens lootados agrupados por categoria (imbuement, task, moedas, equipamento...), com o valor de
 * cada item e o subtotal do grupo. O preço de cada item é o do jogador ("Meus preços", dourado)
 * ou, se ele não definiu, o preço de NPC da TibiaWiki (marcado NPC). Clicar no preço troca só
 * aquele item; Enter salva no servidor do personagem e vale pras próximas sessões e pro registro
 * de boss.
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
  const remove = useDeleteItemPrice(world);
  const [sort, setSort] = useState<LootSort>("value");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  // Enter/Esc fecham o campo e o blur que vem junto não pode salvar de novo.
  const open = useRef<string | null>(null);

  const value = useMemo(() => valueLoot(items, priceMap(data)), [items, data]);
  const groups = useMemo(() => groupLoot(value.rows, sort), [value.rows, sort]);

  const startEdit = (r: LootRow) => {
    open.current = r.name;
    setEditing(r.name);
    setDraft(r.unit != null && r.source !== "coin" ? String(r.unit) : "");
  };

  const commit = (name: string) => {
    if (open.current !== name) return;
    open.current = null;
    const n = parseGoldInput(draft);
    setEditing(null);
    if (!world || !n) return;
    save.mutate([{ item: name, price: n }], {
      onSuccess: () => toast.success("Preço salvo", { description: `${name}: ${fmtGold(n)} cada` }),
      onError: () => toast.error("Não consegui salvar o preço"),
    });
  };

  const backToNpc = (r: LootRow) => {
    remove.mutate(r.name, {
      onSuccess: () => toast.success("Voltou pro preço de NPC", { description: r.name }),
      onError: () => toast.error("Não consegui desfazer o preço"),
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>
            Valor do loot{world ? ` em ${world}` : ""}:{" "}
            <b className="text-rubi-gold">{fmtGold(value.pricedTotal)}</b>
            {value.unpriced > 0 && ` · ${value.unpriced} item(ns) sem preço`}
          </p>
          <p className="mt-1">
            <span className="rounded border border-rubi-gold/40 bg-rubi-gold/10 px-1 text-2xs font-semibold text-rubi-gold">
              meu preço
            </span>{" "}
            é o que você definiu (vale nas próximas sessões);{" "}
            <span className="rounded border border-border bg-surface px-1 text-2xs font-semibold">
              NPC
            </span>{" "}
            é o preço de NPC da TibiaWiki, usado até você trocar. Toque no preço pra mudar só aquele
            item.
          </p>
        </div>
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

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.category} aria-label={LOOT_CATEGORY_LABEL[g.category]}>
            <h3 className="mb-2 flex items-baseline justify-between gap-2 border-b border-border/60 pb-1 text-sm font-semibold">
              <span className="min-w-0 truncate">
                {LOOT_CATEGORY_LABEL[g.category]}{" "}
                <span className="font-normal text-muted-foreground">({g.rows.length})</span>
              </span>
              <span className="flex-none font-mono text-rubi-gold">{fmtGold(g.total)}</span>
            </h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.rows.map((r) => (
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
                  <PriceCell
                    row={r}
                    canEdit={!!world}
                    editing={editing === r.name}
                    draft={draft}
                    onDraft={setDraft}
                    onStart={() => startEdit(r)}
                    onCommit={() => commit(r.name)}
                    onCancel={() => {
                      open.current = null;
                      setEditing(null);
                    }}
                    onBackToNpc={() => backToNpc(r)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function PriceCell({
  row: r,
  canEdit,
  editing,
  draft,
  onDraft,
  onStart,
  onCommit,
  onCancel,
  onBackToNpc,
}: {
  row: LootRow;
  canEdit: boolean;
  editing: boolean;
  draft: string;
  onDraft: (v: string) => void;
  onStart: () => void;
  onCommit: () => void;
  onCancel: () => void;
  onBackToNpc: () => void;
}) {
  // Moedas valem sempre o mesmo: nada pra editar.
  if (r.source === "coin") {
    return (
      <span className="flex-none text-right font-mono font-semibold text-rubi-gold">
        {fmtGold(r.total ?? 0)}
      </span>
    );
  }
  if (editing) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        aria-label={`Preço de ${r.name} (cada)`}
        placeholder="ex: 150k"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onCancel();
        }}
        className="min-h-11 w-28 flex-none rounded-md border border-rubi-gold bg-input px-2 text-right font-mono text-xs outline-none sm:min-h-9"
      />
    );
  }
  if (r.total == null) {
    return canEdit ? (
      <button
        type="button"
        onClick={onStart}
        aria-label={`Definir o preço de ${r.name}`}
        className="inline-flex min-h-11 flex-none items-center gap-1 rounded-md border border-dashed border-border px-2 text-xs text-muted-foreground transition-colors hover:border-rubi-gold hover:text-foreground sm:min-h-9"
      >
        <Pencil className="h-3 w-3" /> definir preço
      </button>
    ) : (
      <span className="flex-none text-xs text-muted-foreground">sem preço</span>
    );
  }
  const mine = r.source === "mine";
  return (
    <span className="flex flex-none flex-col items-end">
      <span className="font-mono font-semibold text-rubi-gold">{fmtGold(r.total)}</span>
      {canEdit ? (
        <button
          type="button"
          onClick={onStart}
          aria-label={`Trocar o preço de ${r.name} (${mine ? "seu preço" : "preço de NPC"}, ${fmtNum(r.unit ?? 0)} cada)`}
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 font-mono text-2xs text-muted-foreground transition-colors hover:text-foreground sm:min-h-6"
        >
          {fmtNum(r.unit ?? 0)} cada
          <PriceTag mine={mine} />
          <Pencil className="h-3 w-3 opacity-60" />
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted-foreground">
          {fmtNum(r.unit ?? 0)} cada <PriceTag mine={mine} />
        </span>
      )}
      {mine && r.npc != null && canEdit && (
        <button
          type="button"
          onClick={onBackToNpc}
          className="min-h-11 text-2xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:min-h-6"
        >
          voltar ao NPC ({fmtGold(r.npc)})
        </button>
      )}
    </span>
  );
}

function PriceTag({ mine }: { mine: boolean }) {
  return mine ? (
    <span className="rounded border border-rubi-gold/40 bg-rubi-gold/10 px-1 text-2xs font-semibold text-rubi-gold">
      meu preço
    </span>
  ) : (
    <span className="rounded border border-border bg-surface px-1 text-2xs font-semibold">NPC</span>
  );
}
