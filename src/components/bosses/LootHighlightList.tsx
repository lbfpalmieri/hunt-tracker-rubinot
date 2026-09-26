import { useState } from "react";
import { GameIcon } from "@/components/GameIcon";
import type { LootHighlight } from "@/lib/boss-catalog";
import { fmtGold } from "@/lib/format";
import { LootTierBadge } from "./BossUi";

/** Lista de itens de loot (ícone, raridade, valor de referência, de qual boss cai). */
export function LootHighlightList({
  items,
  empty,
  showBosses = true,
  initial = 8,
}: {
  items: LootHighlight[];
  empty: string;
  showBosses?: boolean;
  initial?: number;
}) {
  const [all, setAll] = useState(false);
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const shown = all ? items : items.slice(0, initial);
  return (
    <div>
      <ul className="divide-y divide-border/50">
        {shown.map((it) => (
          <li key={it.item} className="flex items-center gap-3 py-2">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-background/60">
              <GameIcon name={it.item} size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-medium">{it.item}</span>
                <LootTierBadge tier={it.tier} />
              </div>
              {showBosses && (
                <div className="truncate text-[11px] text-muted-foreground">
                  {it.bosses.join(", ")}
                </div>
              )}
            </div>
            <div className="flex-none text-right">
              <div className="text-sm font-semibold text-rubi-gold">
                {it.value > 0 ? fmtGold(it.value) : "—"}
              </div>
              {it.npc > 0 && (
                <div className="text-[10px] text-muted-foreground">NPC {fmtGold(it.npc)}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length > initial && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 text-xs font-medium text-rubi-gold hover:underline"
        >
          {all ? "Mostrar menos" : `Ver todos (${items.length})`}
        </button>
      )}
    </div>
  );
}
