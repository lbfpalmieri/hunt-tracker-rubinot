import { useState } from "react";
import { ChevronDown, Flame, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FORGE_SKILLS, fmtPct, tierPct, type ForgeSlot } from "@/lib/forge";

/**
 * Escolha do tier (Exaltation Forge) de um item do boneco — popover no tema do app (o <select>
 * nativo abria a lista com as cores do navegador). Mostra a habilidade do tipo de item e a % de
 * ativação de cada tier, só até o máximo daquele item.
 */
export function TierPicker({
  slot,
  itemName,
  tier,
  max,
  onChange,
}: {
  slot: ForgeSlot;
  itemName: string;
  tier: number;
  max: number;
  onChange: (tier: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const skill = FORGE_SKILLS[slot];
  const pick = (t: number) => {
    onChange(t);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Tier de ${itemName}`}
          className={
            "ml-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 align-baseline text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rubi-gold/50 " +
            (tier > 0
              ? "border-rubi-gold bg-rubi-gold text-background shadow-[0_0_10px_-2px_var(--rubi-gold)] hover:brightness-110"
              : "border-dashed border-rubi-gold/80 bg-rubi-gold/10 text-rubi-gold hover:bg-rubi-gold/20")
          }
        >
          {tier > 0 ? `Tier ${tier}` : `+ Tier (até T${max})`}
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-rubi-gold/40 bg-surface-elevated p-3 text-foreground shadow-xl"
      >
        <div className="flex items-start gap-2">
          {skill.icon ? (
            <img
              src={skill.icon}
              alt=""
              className="h-7 w-7 flex-none [image-rendering:pixelated]"
            />
          ) : (
            <Flame className="h-7 w-7 flex-none text-rubi-gold" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold">
              {skill.name} <span className="font-normal text-muted-foreground">· {itemName}</span>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">{skill.effect}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {Array.from({ length: max }, (_, i) => i + 1).map((t) => {
            const on = t === tier;
            return (
              <button
                key={t}
                type="button"
                onClick={() => pick(t)}
                className={
                  "flex flex-col items-center rounded-md border px-1 py-1.5 transition-colors " +
                  (on
                    ? "border-rubi-gold bg-rubi-gold text-background"
                    : "border-border bg-background/60 hover:border-rubi-gold/60 hover:bg-rubi-gold/10")
                }
              >
                <span className="text-xs font-bold">T{t}</span>
                <span
                  className={"text-[9px] " + (on ? "text-background/80" : "text-muted-foreground")}
                >
                  {slot === "feet" ? "+" : ""}
                  {fmtPct(tierPct(slot, t))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            {slot === "feet" ? "Bônus na chance das outras" : "Chance de ativar"} · até T{max} nesse
            item
          </span>
          {tier > 0 && (
            <button
              type="button"
              onClick={() => pick(0)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-rubi-danger"
            >
              <X className="h-3 w-3" /> Sem tier
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
