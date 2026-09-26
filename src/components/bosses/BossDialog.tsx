import { Clock, Heart, MapPin, Sparkles, Swords, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fmtCooldown,
  LOOT_TIERS,
  LOOT_TIER_LABEL,
  type Boss,
  type BossCatalog,
  type PartyKind,
  tierItems,
} from "@/lib/boss-catalog";
import { damageElementInfo } from "@/lib/damage-elements";
import { fmtNum } from "@/lib/format";
import { RECOMMENDABLE_ELEMENTS } from "@/lib/monster-weakness";
import { BossPortrait, BossTypeBadge, LootTierBadge, PartyBadge } from "./BossUi";
import { LootHighlightList } from "./LootHighlightList";

interface Props {
  boss: Boss | null;
  catalog: BossCatalog;
  party: PartyKind;
  partyEstimated: boolean;
  onPartyChange: (party: PartyKind | null) => void;
  onOpenChange: (open: boolean) => void;
}

/** Ficha do boss: vida, XP, cooldown, onde fica, fraquezas e loot por raridade. */
export function BossDialog({
  boss,
  catalog,
  party,
  partyEstimated,
  onPartyChange,
  onOpenChange,
}: Props) {
  if (!boss) return null;
  const elements = RECOMMENDABLE_ELEMENTS.map((el) => ({ el, mod: boss.mods[el] ?? 100 })).sort(
    (a, b) => b.mod - a.mod,
  );
  const perTier = LOOT_TIERS.map((tier) => ({
    tier,
    items: tierItems(boss, tier, catalog),
  })).filter((x) => x.items.length > 0);

  return (
    <Dialog open={!!boss} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-rubi-danger/40 sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <BossPortrait boss={boss} size={64} />
            <div className="min-w-0 text-left">
              <DialogTitle className="font-display text-2xl">{boss.name}</DialogTitle>
              <DialogDescription asChild>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <BossTypeBadge type={boss.type} />
                  <PartyBadge party={party} estimated={partyEstimated} />
                  {boss.locations.slice(0, 2).map((l) => (
                    <span
                      key={l}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                    >
                      <MapPin className="h-3 w-3" /> {l}
                    </span>
                  ))}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Info icon={Heart} label="Vida" value={boss.hp ? fmtNum(boss.hp) : "—"} />
          <Info icon={Sparkles} label="Experiência" value={boss.xp ? fmtNum(boss.xp) : "—"} />
          <Info icon={Clock} label="Cooldown" value={fmtCooldown(boss.cooldownSec)} />
        </div>

        <div className="rounded-xl border border-border bg-surface/60 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Solo ou time?
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["solo", "team"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPartyChange(p)}
                className={
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " +
                  (party === p && !partyEstimated
                    ? "border-rubi-danger bg-rubi-danger/15 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {p === "solo" ? <Swords className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {p === "solo" ? "Faço solo" : "Preciso de time"}
              </button>
            ))}
            {!partyEstimated && (
              <button
                type="button"
                onClick={() => onPartyChange(null)}
                className="text-xs text-muted-foreground hover:underline"
              >
                voltar pra estimativa
              </button>
            )}
          </div>
          {partyEstimated && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              A wiki não diz quantos jogadores precisa — estimamos pela vida do boss. Marque o que
              vale pra você.
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dano por elemento
          </div>
          <div className="flex flex-wrap gap-1.5">
            {elements.map(({ el, mod }) => {
              const info = damageElementInfo(el);
              return (
                <span
                  key={el}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs " +
                    (mod > 100
                      ? "bg-rubi-success/15 text-rubi-success"
                      : mod < 100
                        ? "bg-rubi-danger/10 text-rubi-danger"
                        : "bg-accent/70")
                  }
                >
                  {info.emoji} {info.label} · {mod}%
                </span>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {perTier.map(({ tier, items }) => (
            <div key={tier}>
              <div className="mb-1 flex items-center gap-2">
                <LootTierBadge tier={tier} />
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "itens"} ·{" "}
                  {LOOT_TIER_LABEL[tier].toLowerCase()}
                </span>
              </div>
              <LootHighlightList items={items} empty="" showBosses={false} initial={6} />
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/70">
            Raridade, loot e resistências: TibiaWiki (Tibia oficial). Valor = média do mercado do
            Tibia oficial ou preço de NPC — no RubinOT os preços podem ser outros; o lucro real vem
            do seu Hunting Analyser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-2.5">
      <Icon className="mx-auto h-4 w-4 text-rubi-danger" />
      <div className="mt-1 text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
