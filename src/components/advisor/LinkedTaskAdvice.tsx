import { useMemo, useState } from "react";
import { Flame, LifeBuoy, Shirt, Sparkles, Target } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import { MixBar, Segmented } from "@/components/advisor/advisor-ui";
import {
  MODE_LABEL,
  charmPicks,
  emergencyItems,
  estimateIncoming,
  recommendSet,
  suggestImbuements,
  weightedProtection,
  type AdvisorMode,
  type HuntMonster,
} from "@/lib/hunt-advisor";
import { findMonster } from "@/lib/monsters";
import { findEquipment, type GearSlot } from "@/lib/equipment";
import { getImbuementType } from "@/lib/imbuement-types";
import { charmIcon, setupVocation, type SetupVocation } from "@/lib/session-setup";
import { useAppStore } from "@/lib/store";
import { currentLevel } from "@/lib/level";
import { fmtNum } from "@/lib/format";

const VOCS: SetupVocation[] = ["knight", "paladin", "sorcerer", "druid", "monk"];
const VOC_LABEL: Record<SetupVocation, string> = {
  knight: "Knight",
  paladin: "Paladin",
  sorcerer: "Sorcerer",
  druid: "Druid",
  monk: "Monk",
};

const SLOT_ORDER: (GearSlot | "weapon")[] = [
  "weapon",
  "shield",
  "head",
  "armor",
  "legs",
  "feet",
  "neck",
  "ring",
  "ammo",
];
const SLOT_LABEL: Record<GearSlot | "weapon", string> = {
  weapon: "Arma",
  head: "Capacete",
  neck: "Amuleto",
  armor: "Armadura",
  legs: "Calça",
  feet: "Bota",
  ring: "Anel",
  shield: "Escudo",
  ammo: "Munição",
};
const IMBUE_SLOT: Record<string, string> = {
  weapon: "Arma",
  head: "Capacete",
  armor: "Armadura",
  shield: "Escudo",
  feet: "Bota",
};

/**
 * Resumo do "conselheiro" dentro da Linked Task: dano que as criaturas da task causam (estimado
 * pela TibiaWiki), set sugerido pra vocação/level do personagem ativo, imbuements, charms e itens
 * de emergência. Motor em src/lib/hunt-advisor.ts (cada criatura da task pesa igual).
 */
export function LinkedTaskAdvice({ creatures }: { creatures: string[] }) {
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const active = characters.find((c) => c.id === activeId) ?? null;
  const level = active ? currentLevel(levelSnapshots, active.id) : null;

  const [voc, setVoc] = useState<SetupVocation>(setupVocation(active?.vocation) ?? "knight");
  const [mode, setMode] = useState<AdvisorMode>("defensive");

  const monsters = useMemo<HuntMonster[]>(
    () => creatures.filter((n) => findMonster(n)).map((name) => ({ name, count: 1 })),
    [creatures],
  );
  const incoming = useMemo(() => estimateIncoming(monsters), [monsters]);
  const input = useMemo(
    () => ({ vocation: voc, level, mode, monsters, incoming }),
    [voc, level, mode, monsters, incoming],
  );
  const result = useMemo(() => recommendSet(input), [input]);
  const imbues = useMemo(() => suggestImbuements(input, result.setup), [input, result.setup]);
  const charms = useMemo(() => charmPicks(monsters), [monsters]);
  const emergency = useMemo(() => emergencyItems(incoming), [incoming]);

  if (!monsters.length) return null;

  const slotItem = (slot: GearSlot | "weapon") =>
    slot === "weapon"
      ? result.setup.weapon
      : slot === "shield"
        ? (result.setup.quiver ?? result.setup.gear?.shield)
        : result.setup.gear?.[slot];

  return (
    <div className="space-y-4">
      <Block icon={Flame} label="Dano que você vai tomar" tone="text-rubi-danger">
        <MixBar mix={incoming} />
        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
          Estimado pelos ataques dessas criaturas na TibiaWiki.
        </p>
      </Block>

      <Block
        icon={Shirt}
        label={`Set sugerido pra ${VOC_LABEL[voc]}${level ? ` ${level}` : ""}`}
        tone="text-rubi-gold"
      >
        <div className="mb-2 space-y-1.5">
          <Segmented
            size="sm"
            value={voc}
            onChange={setVoc}
            options={VOCS.map((v) => ({ value: v, label: VOC_LABEL[v] }))}
          />
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={(["defensive", "balanced", "offensive"] as AdvisorMode[]).map((m) => ({
              value: m,
              label: MODE_LABEL[m],
            }))}
          />
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {SLOT_ORDER.map((slot) => {
            const name = slotItem(slot);
            if (!name) return null;
            const e = findEquipment(name);
            return (
              <li
                key={slot}
                title={e ? [e.skills, e.resist].filter(Boolean).join(" · ") : undefined}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-2 py-1"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center">
                  <GameIcon name={name} size={26} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                    {SLOT_LABEL[slot]}
                  </span>
                  <span className="block truncate text-xs font-medium">{name}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Proteção dos itens contra essas criaturas:{" "}
          <b className="text-rubi-blue">{weightedProtection(result.setup, incoming).toFixed(1)}%</b>
          {level == null && " · registre seu level pra filtrar pelo que você usa"}
        </p>
      </Block>

      <div className="grid gap-4 sm:grid-cols-2">
        <Block icon={Sparkles} label="Imbuements" tone="text-rubi-blue">
          {imbues.length ? (
            <ul className="space-y-1.5">
              {imbues.map((s) => (
                <li key={s.slot}>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="w-16 flex-none text-[11px] font-semibold">
                      {IMBUE_SLOT[s.slot]}
                    </span>
                    {s.ids.map((id) => {
                      const t = getImbuementType(id);
                      return t ? (
                        <span
                          key={id}
                          title={t.description}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 py-0.5 pl-0.5 pr-1.5 text-[11px]"
                        >
                          <img src={t.icon} alt="" className="h-4 w-4" /> {t.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <p className="pl-[68px] text-[10px] text-muted-foreground">{s.why}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Os itens sugeridos não aceitam imbuement.
            </p>
          )}
        </Block>

        <Block icon={Target} label="Charms" tone="text-rubi-success">
          <ul className="space-y-1">
            {charms.map((c) => (
              <li key={c.monster} className="flex items-center gap-1.5 text-xs">
                {charmIcon(c.charm) && <img src={charmIcon(c.charm)} alt="" className="h-4 w-4" />}
                <b className="text-rubi-gold">{c.charm}</b>
                <span className="min-w-0 truncate text-muted-foreground">
                  {c.monster} · ≈ {fmtNum(c.damage)} dano
                </span>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <Block icon={LifeBuoy} label="Pra levar na BP (emergência)" tone="text-rubi-gold">
        <div className="flex flex-wrap gap-1.5">
          {emergency.map((e) => (
            <span
              key={e.name}
              title={e.why}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 py-0.5 pl-0.5 pr-2 text-[11px]"
            >
              <GameIcon name={e.name} size={18} /> {e.name}
            </span>
          ))}
        </div>
      </Block>

      <p className="text-[10px] text-muted-foreground/70">
        Sugestão automática (TibiaWiki): não considera Wheel, tier, Prey nem itens exclusivos do
        RubinOT.
      </p>
    </div>
  );
}

function Block({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: typeof Flame;
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={"h-3.5 w-3.5 " + tone} /> {label}
      </h3>
      {children}
    </section>
  );
}
