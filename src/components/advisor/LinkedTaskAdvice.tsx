import { useMemo, useState } from "react";
import { Flame, LifeBuoy, Sparkles, Target } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import { MixBar, Segmented } from "@/components/advisor/advisor-ui";
import { EquipmentDoll } from "@/components/setup/EquipmentDoll";
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
import { getImbuementType } from "@/lib/imbuement-types";
import { charmIcon, setupVocation, type SetupVocation } from "@/lib/session-setup";
import { useAppStore } from "@/lib/store";
import { currentLevel } from "@/lib/level";
import { fmtNum } from "@/lib/format";

/**
 * "Conselheiro" da Linked Task, dividido pelas abas do LinkedTaskDialog: Combate (dano que você
 * toma + charms), Set (boneco do inventário pra vocação/level do personagem ativo) e Imbuements
 * (+ itens de emergência). Motor em src/lib/hunt-advisor.ts (cada criatura da task pesa igual).
 * Vocação e estilo ficam no hook pra Set e Imbuements usarem o mesmo set.
 */

const VOCS: SetupVocation[] = ["knight", "paladin", "sorcerer", "druid", "monk"];
const VOC_LABEL: Record<SetupVocation, string> = {
  knight: "Knight",
  paladin: "Paladin",
  sorcerer: "Sorcerer",
  druid: "Druid",
  monk: "Monk",
};
const IMBUE_SLOT: Record<string, string> = {
  weapon: "Arma",
  head: "Capacete",
  armor: "Armadura",
  shield: "Escudo",
  feet: "Bota",
};

export function useTaskAdvice(creatures: string[]) {
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

  return {
    hasData: monsters.length > 0,
    voc,
    setVoc,
    mode,
    setMode,
    level,
    incoming,
    result,
    imbues,
    charms,
    emergency,
  };
}

export type TaskAdvice = ReturnType<typeof useTaskAdvice>;

const NO_DATA = (
  <p className="text-sm text-muted-foreground">Sem dados dessas criaturas na TibiaWiki.</p>
);

/** Aba Combate: o dano que as criaturas causam + o charm certo pra cada uma. */
export function AdviceCombat({ advice }: { advice: TaskAdvice }) {
  if (!advice.hasData) return NO_DATA;
  return (
    <div className="space-y-5">
      <Block icon={Flame} label="Dano que você vai tomar" tone="text-rubi-danger">
        <MixBar mix={advice.incoming} />
        <p className="mt-2 text-xs text-muted-foreground">
          Estimado pelos ataques dessas criaturas na TibiaWiki.
        </p>
      </Block>

      <Block icon={Target} label="Charms" tone="text-rubi-success">
        <ul className="space-y-2">
          {advice.charms.map((c) => (
            <li
              key={c.monster}
              className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/30 px-2.5 py-1.5"
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center">
                <GameIcon name={c.monster} size={30} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{c.monster}</span>
              <span className="flex flex-none items-center gap-1.5 text-sm">
                {charmIcon(c.charm) && <img src={charmIcon(c.charm)} alt="" className="h-5 w-5" />}
                <b className="text-rubi-gold">{c.charm}</b>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  ≈ {fmtNum(c.damage)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Elemento em que cada criatura é mais fraca · dano ≈ 5% da vida dela.
        </p>
      </Block>
    </div>
  );
}

/** Aba Set: vocação + estilo e o set no boneco do inventário do jogo. */
export function AdviceSet({ advice }: { advice: TaskAdvice }) {
  if (!advice.hasData) return NO_DATA;
  return (
    <div className="space-y-3">
      <Segmented
        size="sm"
        value={advice.voc}
        onChange={advice.setVoc}
        options={VOCS.map((v) => ({ value: v, label: VOC_LABEL[v] }))}
      />
      <Segmented
        size="sm"
        value={advice.mode}
        onChange={advice.setMode}
        options={(["defensive", "balanced", "offensive"] as AdvisorMode[]).map((m) => ({
          value: m,
          label: MODE_LABEL[m],
        }))}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-rubi-blue/30 bg-rubi-blue-soft/40 px-3 py-2">
        <span className="text-sm">
          {VOC_LABEL[advice.voc]}
          {advice.level ? ` ${advice.level}` : ""} · proteção contra essas criaturas
        </span>
        <b className="font-display text-xl tabular-nums text-rubi-blue">
          {weightedProtection(advice.result.setup, advice.incoming).toFixed(1)}%
        </b>
      </div>
      <EquipmentDoll value={advice.result.setup} vocation={advice.voc} size={38} />
      {advice.level == null && (
        <p className="text-xs text-muted-foreground">
          Registre o level do personagem pra sugestão só com o que você já usa.
        </p>
      )}
      <Footnote />
    </div>
  );
}

/** Aba Imbuements: por slot do set sugerido + itens de carga pra levar na BP. */
export function AdviceImbues({ advice }: { advice: TaskAdvice }) {
  if (!advice.hasData) return NO_DATA;
  return (
    <div className="space-y-5">
      <Block
        icon={Sparkles}
        label={`Imbuements · set ${MODE_LABEL[advice.mode].toLowerCase()}`}
        tone="text-rubi-blue"
      >
        {advice.imbues.length ? (
          <ul className="space-y-2">
            {advice.imbues.map((s) => (
              <li
                key={s.slot}
                className="rounded-lg border border-border/50 bg-background/30 px-2.5 py-2"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-20 flex-none text-sm font-semibold">{IMBUE_SLOT[s.slot]}</span>
                  {s.ids.map((id) => {
                    const t = getImbuementType(id);
                    return t ? (
                      <span
                        key={id}
                        title={t.description}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/50 py-0.5 pl-0.5 pr-2 text-sm"
                      >
                        <img src={t.icon} alt="" className="h-6 w-6" /> {t.name}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.why}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Os itens sugeridos não aceitam imbuement.</p>
        )}
      </Block>

      <Block icon={LifeBuoy} label="Pra levar na BP (emergência)" tone="text-rubi-gold">
        <ul className="space-y-2">
          {advice.emergency.map((e) => (
            <li key={e.name} className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center">
                <GameIcon name={e.name} size={30} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{e.name}</span>
                <span className="block text-xs text-muted-foreground">{e.why}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>
      <Footnote />
    </div>
  );
}

function Footnote() {
  return (
    <p className="text-xs text-muted-foreground/70">
      Sugestão automática (TibiaWiki): não considera Wheel, tier, Prey nem itens exclusivos do
      RubinOT.
    </p>
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
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <Icon className={"h-4 w-4 " + tone} /> {label}
      </h3>
      {children}
    </section>
  );
}
