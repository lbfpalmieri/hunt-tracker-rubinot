import { useMemo, useRef, useState } from "react";
import { Flame, Search, X } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  equipmentForSlot,
  equipmentSummary,
  findEquipment,
  gearBonuses,
  gearMaxTier,
  shortSkills,
  TIER_GEAR_SLOTS,
  type GearSlot,
  type TierGearSlot,
} from "@/lib/equipment";
import { fmtPct, forgeLines } from "@/lib/forge";
import type { SessionSetup, SetupVocation } from "@/lib/session-setup";
import { WEAPON_KIND_LABEL, findWeapon, weaponSummary, weaponsForVocation } from "@/lib/weapons";

/** Quadros do boneco = inventário do jogo (3 colunas). "bag" é só decorativo. */
type DollSlot = GearSlot | "weapon" | "bag";

// prettier-ignore
const GRID: (DollSlot | null)[] = [
  "neck", "head", "bag",
  "weapon", "armor", "shield",
  "ring", "legs", "ammo",
  null, "feet", null,
];

const LIST_LIMIT = 80;

function slotLabel(slot: DollSlot, voc: SetupVocation | null): string {
  switch (slot) {
    case "head":
      return "Capacete";
    case "neck":
      return "Amuleto";
    case "bag":
      return "Mochila";
    case "weapon":
      return "Arma";
    case "armor":
      return "Armadura";
    case "shield":
      return voc === "paladin"
        ? "Aljava / escudo"
        : voc === "sorcerer" || voc === "druid"
          ? "Spellbook"
          : "Escudo";
    case "ring":
      return "Anel";
    case "legs":
      return "Calça";
    case "ammo":
      return voc === "paladin" ? "Munição" : "Extra";
    case "feet":
      return "Bota";
  }
}

/** Silhueta apagada do slot vazio — um item comum daquele tipo, em cinza (como no jogo). */
function placeholder(slot: DollSlot, voc: SetupVocation | null): string {
  switch (slot) {
    case "head":
      return "Steel Helmet";
    case "neck":
      return "Bronze Amulet";
    case "bag":
      return "Backpack";
    case "weapon":
      return voc === "paladin"
        ? "Bow"
        : voc === "sorcerer"
          ? "Wand of Vortex"
          : voc === "druid"
            ? "Snakebite Rod"
            : "Sword";
    case "armor":
      return "Plate Armor";
    case "shield":
      return voc === "paladin"
        ? "Quiver"
        : voc === "sorcerer" || voc === "druid"
          ? "Spellbook"
          : "Wooden Shield";
    case "ring":
      return "Gold Ring";
    case "legs":
      return "Plate Legs";
    case "ammo":
      return voc === "paladin" ? "Arrow" : "Torch";
    case "feet":
      return "Leather Boots";
  }
}

interface PickItem {
  name: string;
  icon: string;
  level: number;
  summary: string;
  tag?: string;
}

/**
 * Boneco de equipamentos do set, no layout do inventário do RubinOT: toca no quadrado e escolhe o
 * item — cada quadrado só lista o que encaixa nele e o que a vocação usa (item sem vocação na wiki
 * aparece pra todos). Arma → setup.weapon; aljava → setup.quiver; o resto → setup.gear.
 * Tier (Exaltation Forge): arma → setup.weaponTier; capacete/armadura/calça/bota → setup.gearTier,
 * até o máximo de cada item; o bloco "Forja" mostra a habilidade e a % de cada um (forge.ts).
 * `onChange` ausente = só leitura (Comunidade, comparação).
 */
export function EquipmentDoll({
  value,
  onChange,
  vocation,
  size = 52,
  showSummary = true,
  aside,
}: {
  value: SessionSetup;
  onChange?: (patch: Partial<SessionSetup>) => void;
  vocation: SetupVocation | null;
  size?: number;
  showSummary?: boolean;
  /** Conteúdo extra na coluna da direita, abaixo do resumo (ex.: tier/skills/postura no setup). */
  aside?: React.ReactNode;
}) {
  const [editing, setEditing] = useState<DollSlot | null>(null);
  const weapon = findWeapon(value.weapon);
  const twoHanded = weapon?.hands === 2;
  const gear = useMemo(() => value.gear ?? {}, [value.gear]);

  const itemIn = (slot: DollSlot): { name: string; icon: string } | null => {
    if (slot === "bag") return null;
    if (slot === "weapon")
      return value.weapon ? { name: value.weapon, icon: weapon?.icon ?? value.weapon } : null;
    if (slot === "shield" && value.quiver) return { name: value.quiver, icon: value.quiver };
    const name = gear[slot];
    return name ? { name, icon: findEquipment(name)?.icon ?? name } : null;
  };

  const shieldBlocked = twoHanded && vocation !== "paladin";

  // ---------- tier (Exaltation Forge) ----------
  const gearTier = value.gearTier ?? {};
  const isTierSlot = (s: DollSlot): s is TierGearSlot | "weapon" =>
    s === "weapon" || (TIER_GEAR_SLOTS as string[]).includes(s);
  const tierOf = (s: DollSlot): number =>
    s === "weapon" ? (value.weaponTier ?? 0) : isTierSlot(s) ? (gearTier[s] ?? 0) : 0;
  const maxTierOf = (s: DollSlot): number =>
    s === "weapon" ? (weapon?.maxTier ?? 0) : isTierSlot(s) ? gearMaxTier(s, gear[s]) : 0;
  const setTier = (s: DollSlot, t: number) => {
    if (!onChange) return;
    if (s === "weapon") onChange({ weaponTier: t > 0 ? t : null });
    else if (isTierSlot(s)) onChange({ gearTier: { ...gearTier, [s]: t > 0 ? t : undefined } });
  };
  const forge = forgeLines({
    weapon: tierOf("weapon"),
    head: tierOf("head"),
    armor: tierOf("armor"),
    legs: tierOf("legs"),
    feet: tierOf("feet"),
  });

  const pick = (slot: DollSlot, name: string | null) => {
    if (!onChange || slot === "bag") return;
    if (slot === "weapon") {
      const w = findWeapon(name);
      const max = w?.maxTier;
      const patch: Partial<SessionSetup> = {
        weapon: name,
        weaponTier: max != null && (value.weaponTier ?? 0) > max ? null : value.weaponTier,
      };
      // Arma de duas mãos: sai o escudo (a aljava do paladino fica).
      if (w?.hands === 2 && gear.shield) patch.gear = { ...gear, shield: undefined };
      onChange(patch);
    } else if (slot === "shield") {
      const e = findEquipment(name);
      if (e?.isQuiver) onChange({ quiver: e.name, gear: { ...gear, shield: undefined } });
      else onChange({ quiver: null, gear: { ...gear, shield: name ?? undefined } });
    } else {
      const patch: Partial<SessionSetup> = { gear: { ...gear, [slot]: name ?? undefined } };
      // Item novo aceita tier menor (ou nenhum)? Ajusta.
      if (isTierSlot(slot)) {
        const max = gearMaxTier(slot, name);
        if ((gearTier[slot] ?? 0) > max) patch.gearTier = { ...gearTier, [slot]: undefined };
      }
      onChange(patch);
    }
    setEditing(null);
  };

  const bonuses = useMemo(
    () => gearBonuses([...Object.values(gear), value.quiver]),
    [gear, value.quiver],
  );
  const equipped = GRID.filter((s): s is DollSlot => !!s && !!itemIn(s));

  const cell = size + 8;
  return (
    <div className={showSummary ? "flex min-w-0 flex-col gap-4 md:flex-row md:items-start" : ""}>
      <div
        className="inline-grid flex-none gap-1.5 self-start rounded-xl border border-border bg-[linear-gradient(180deg,oklch(0.24_0.02_260),oklch(0.18_0.02_260))] p-2 shadow-inner"
        style={{ gridTemplateColumns: `repeat(3, ${cell}px)` }}
      >
        {GRID.map((slot, i) => {
          if (!slot) return <span key={i} />;
          const item = itemIn(slot);
          const blocked = slot === "shield" && shieldBlocked;
          const clickable = !!onChange && slot !== "bag" && !blocked;
          const label = slotLabel(slot, vocation);
          return (
            <button
              key={slot}
              type="button"
              disabled={!clickable}
              onClick={() => setEditing(slot)}
              title={
                blocked
                  ? "Arma de duas mãos — sem escudo"
                  : item
                    ? `${label}: ${item.name}`
                    : clickable
                      ? `${label} — escolher`
                      : label
              }
              className={
                "group relative flex items-center justify-center rounded-md border transition-colors " +
                "border-black/60 bg-[oklch(0.14_0.015_260)] shadow-[inset_1px_1px_0_rgba(0,0,0,0.6),inset_-1px_-1px_0_rgba(255,255,255,0.06)] " +
                (clickable ? "cursor-pointer hover:border-rubi-gold/70 " : "cursor-default ") +
                (item ? "ring-1 ring-rubi-gold/25" : "")
              }
              style={{ width: cell, height: cell }}
            >
              {item ? (
                <GameIcon name={item.icon} size={size} />
              ) : (
                <span
                  className={
                    "grayscale " + (blocked ? "opacity-10" : "opacity-35 group-hover:opacity-50")
                  }
                >
                  <GameIcon name={placeholder(slot, vocation)} size={size} />
                </span>
              )}
              {blocked && (
                <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] font-bold uppercase text-muted-foreground">
                  2 mãos
                </span>
              )}
              {item && tierOf(slot) > 0 && (
                <span className="absolute right-0.5 top-0.5 rounded bg-rubi-gold/90 px-1 text-[9px] font-bold leading-tight text-background">
                  T{tierOf(slot)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showSummary && (
        <div className="min-w-0 flex-1 space-y-3">
          {equipped.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {onChange
                ? "Toque num quadrado pra escolher o item. Cada um só mostra o que encaixa nele e o que a sua vocação usa."
                : "Sem equipamentos registrados."}
            </p>
          ) : (
            <ul className="grid gap-x-4 gap-y-1.5 lg:grid-cols-2">
              {equipped.map((slot) => {
                const it = itemIn(slot)!;
                const e = findEquipment(it.name);
                const summary =
                  slot === "weapon" && weapon
                    ? weaponSummary(weapon)
                    : e
                      ? equipmentSummary(e)
                      : "";
                const max = maxTierOf(slot);
                const tier = tierOf(slot);
                return (
                  <li key={slot} className="min-w-0 text-xs leading-snug">
                    <span className="mr-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {slotLabel(slot, vocation)}
                    </span>
                    <b className="font-semibold">{it.name}</b>
                    {max > 0 && onChange ? (
                      <select
                        aria-label={`Tier de ${it.name}`}
                        title={`Tier (Exaltation Forge) — esse item vai até T${max}`}
                        value={tier}
                        onChange={(ev) => setTier(slot, Number(ev.target.value))}
                        className={
                          "ml-1.5 rounded border px-1 py-px align-baseline text-[10px] font-bold outline-none " +
                          (tier > 0
                            ? "border-rubi-gold/60 bg-rubi-gold/15 text-rubi-gold"
                            : "border-border bg-background text-muted-foreground")
                        }
                      >
                        {Array.from({ length: max + 1 }, (_, t) => (
                          <option key={t} value={t}>
                            {t === 0 ? "sem tier" : `T${t}`}
                          </option>
                        ))}
                      </select>
                    ) : tier > 0 ? (
                      <span className="ml-1.5 rounded bg-rubi-gold/15 px-1 text-[10px] font-bold text-rubi-gold">
                        T{tier}
                      </span>
                    ) : null}
                    {summary && (
                      <span className="block break-words text-[11px] text-muted-foreground">
                        {summary}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {(bonuses.skills.length > 0 || bonuses.resist.length > 0 || bonuses.armor > 0) && (
            <div className="flex flex-wrap gap-1 border-t border-border/60 pt-2">
              {bonuses.armor > 0 && <Chip tone="muted">Arm {bonuses.armor}</Chip>}
              {bonuses.skills.map(([k, v]) => (
                <Chip key={k} tone="blue">
                  {k} {v > 0 ? "+" : ""}
                  {v}
                </Chip>
              ))}
              {bonuses.resist.map(([k, v]) => (
                <Chip key={k} tone={v >= 0 ? "gold" : "danger"}>
                  {k} {v > 0 ? "+" : ""}
                  {v}%
                </Chip>
              ))}
            </div>
          )}
          {forge.length > 0 && <ForgeBlock lines={forge} />}
          {aside}
        </div>
      )}

      {onChange && (
        <SlotPicker
          slot={editing}
          vocation={vocation}
          twoHanded={twoHanded}
          current={editing ? (itemIn(editing)?.name ?? null) : null}
          onPick={(name) => editing && pick(editing, name)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/** Habilidades de tier do set (Exaltation Forge) com a chance de cada uma. */
function ForgeBlock({ lines }: { lines: ReturnType<typeof forgeLines> }) {
  const amp = lines.find((l) => l.slot === "feet");
  return (
    <div className="rounded-lg border border-rubi-gold/30 bg-rubi-gold/[0.05] p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rubi-gold">
        <Flame className="h-3.5 w-3.5" /> Forja (tier)
      </div>
      <ul className="space-y-1.5">
        {lines.map((l) => (
          <li key={l.slot} className="flex gap-2 text-xs leading-snug">
            {l.skill.icon ? (
              <img
                src={l.skill.icon}
                alt=""
                className="h-5 w-5 flex-none [image-rendering:pixelated]"
              />
            ) : (
              <Flame className="h-5 w-5 flex-none text-rubi-gold" />
            )}
            <span className="min-w-0">
              <b>{l.skill.name}</b>{" "}
              <span className="text-muted-foreground">
                ({l.skill.item} T{l.tier}) ·{" "}
              </span>
              <b className="text-rubi-gold">{fmtPct(l.base)}</b>
              {l.slot === "feet" ? (
                <span className="text-muted-foreground"> a mais na chance das outras</span>
              ) : (
                <span className="text-muted-foreground"> de chance</span>
              )}
              {l.amplified != null && (
                <span className="text-muted-foreground">
                  {" "}
                  → <b className="text-foreground">{fmtPct(l.amplified)}</b> com a bota
                </span>
              )}
              <span className="block text-[11px] text-muted-foreground">{l.skill.effect}</span>
            </span>
          </li>
        ))}
      </ul>
      {amp == null && lines.length > 0 && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Bota com tier (Amplification) aumenta essas chances.
        </p>
      )}
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "gold" | "danger" | "muted";
}) {
  const c = {
    blue: "border-rubi-blue/40 bg-rubi-blue-soft text-rubi-blue",
    gold: "border-rubi-gold/40 bg-rubi-gold/10 text-rubi-gold",
    danger: "border-rubi-danger/40 bg-rubi-danger/10 text-rubi-danger",
    muted: "border-border bg-background/40 text-muted-foreground",
  }[tone];
  return (
    <span className={"rounded-full border px-2 py-0.5 text-[10px] font-semibold " + c}>
      {children}
    </span>
  );
}

function SlotPicker({
  slot,
  vocation,
  twoHanded,
  current,
  onPick,
  onClose,
}: {
  slot: DollSlot | null;
  vocation: SetupVocation | null;
  twoHanded: boolean;
  current: string | null;
  onPick: (name: string | null) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  // Durante a animação de fechar o slot já é null — segura o último pra lista não piscar vazia.
  const last = useRef<DollSlot | null>(null);
  if (slot) last.current = slot;
  const shown = slot ?? last.current;
  const items: PickItem[] = useMemo(() => {
    if (!shown || shown === "bag") return [];
    if (shown === "weapon") {
      return weaponsForVocation(vocation).map((w) => ({
        name: w.name,
        icon: w.icon,
        level: w.level,
        summary: weaponSummary(w),
        tag:
          WEAPON_KIND_LABEL[w.kind] + (w.hands ? ` · ${w.hands === 2 ? "2 mãos" : "1 mão"}` : ""),
      }));
    }
    return equipmentForSlot(shown, vocation, { twoHanded }).map((e) => ({
      name: e.name,
      icon: e.icon,
      level: e.level,
      summary: equipmentSummary(e),
      tag: e.isQuiver
        ? "Aljava"
        : e.slot === "k"
          ? "Spellbook"
          : e.slot === "e"
            ? "Extra slot"
            : undefined,
    }));
  }, [shown, vocation, twoHanded]);

  const term = q.trim().toLowerCase();
  const list = term
    ? items.filter(
        (i) => i.name.toLowerCase().includes(term) || i.summary.toLowerCase().includes(term),
      )
    : items;

  return (
    <Dialog
      open={!!slot}
      onOpenChange={(o) => {
        if (!o) {
          setQ("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {shown ? slotLabel(shown, vocation) : ""}
          </DialogTitle>
          <DialogDescription>
            {items.length} itens que encaixam aqui{vocation ? " e que a sua vocação usa" : ""} ·
            dados da TibiaWiki
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar pelo nome ou bônus (ex: magic, fire)"
              className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-2 text-sm outline-none focus:border-rubi-blue"
            />
          </label>
          {current && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                onPick(null);
              }}
              className="inline-flex flex-none items-center gap-1 rounded-md border border-border px-2 py-2 text-xs text-muted-foreground hover:border-rubi-danger/60 hover:text-rubi-danger"
            >
              <X className="h-3.5 w-3.5" /> Tirar
            </button>
          )}
        </div>
        <ul className="-mx-1 max-h-[55vh] divide-y divide-border/40 overflow-y-auto">
          {list.slice(0, LIST_LIMIT).map((it) => (
            <li key={it.name}>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  onPick(it.name);
                }}
                className={
                  "flex w-full items-center gap-2.5 px-2 py-1.5 text-left hover:bg-accent " +
                  (it.name === current ? "bg-rubi-blue-soft" : "")
                }
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-black/50 bg-[oklch(0.14_0.015_260)]">
                  <GameIcon name={it.icon} size={32} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{it.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {shortSkills(it.summary) || it.tag || "—"}
                  </span>
                </span>
                <span className="flex-none text-right text-[10px] text-muted-foreground">
                  {it.level ? `Lv ${it.level}` : "—"}
                  {it.tag && <span className="block">{it.tag}</span>}
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nada encontrado.
            </li>
          )}
        </ul>
        {list.length > LIST_LIMIT && (
          <p className="text-[10px] text-muted-foreground">
            Mostrando {LIST_LIMIT} de {list.length} (do maior level pro menor) — busque pelo nome.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
