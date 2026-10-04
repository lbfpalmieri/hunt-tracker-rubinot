import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookmarkPlus,
  Flame,
  LifeBuoy,
  RotateCcw,
  Shield,
  Shirt,
  Skull,
  Sparkles,
  Swords,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/GameIcon";
import { EquipmentDoll } from "@/components/setup/EquipmentDoll";
import { AdvisorCard, ELEMENT_COLOR, MixBar, elementLabel } from "@/components/advisor/advisor-ui";
import {
  ELEMENT_PT,
  charmPicks,
  emergencyItems,
  recommendSet,
  setProtection,
  setSkills,
  suggestImbuements,
  weightedProtection,
  type AdvisorInput,
} from "@/lib/hunt-advisor";
import type { CommunityUsage, VocationStats } from "@/lib/hunt-advisor-community";
import { findMonster, type AttackElement, type Element } from "@/lib/monsters";
import type { GearSlot } from "@/lib/equipment";
import { getImbuementType } from "@/lib/imbuement-types";
import { charmIcon } from "@/lib/session-setup";
import { fmtGold, fmtNum } from "@/lib/format";
import { useSaveSetupPreset } from "@/lib/setup-presets";

const SLOT_LABEL: Record<GearSlot | "weapon", string> = {
  weapon: "Arma",
  head: "Capacete",
  neck: "Amuleto",
  armor: "Armadura",
  legs: "Calça",
  feet: "Bota",
  ring: "Anel",
  shield: "Escudo / mão esquerda",
  ammo: "Munição / extra",
};

const IMBUE_SLOT_LABEL = {
  weapon: "Arma",
  head: "Capacete",
  armor: "Armadura",
  shield: "Escudo",
  feet: "Bota",
};

export function AdvisorResults({
  input,
  huntName,
  incomingSource,
  stats,
  usage,
  characterId,
}: {
  input: AdvisorInput;
  huntName: string;
  /** De onde veio o dano recebido: sessões da comunidade (n) ou estimativa da wiki. */
  incomingSource: { kind: "community"; sessions: number } | { kind: "wiki" };
  stats: VocationStats | null;
  usage: CommunityUsage | null;
  /** Personagem logado (salvar como set). Null = visitante. */
  characterId: string | null;
}) {
  const [overrides, setOverrides] = useState<Partial<Record<GearSlot | "weapon", string>>>({});
  const result = useMemo(() => recommendSet(input, overrides), [input, overrides]);
  const imbues = useMemo(() => suggestImbuements(input, result.setup), [input, result.setup]);
  const charms = useMemo(() => charmPicks(input.monsters), [input.monsters]);
  const emergency = useMemo(() => emergencyItems(input.incoming), [input.incoming]);
  const prot = setProtection(result.setup);
  const effective = weightedProtection(result.setup, input.incoming);
  const skills = setSkills(result.setup);
  const save = useSaveSetupPreset(characterId);
  const totalKills = input.monsters.reduce((a, m) => a + m.count, 0) || 1;

  const weak = result.weakness.filter((w) => w.mod >= 103);
  const strong = result.weakness.filter((w) => w.mod <= 97).reverse();
  const neutral = result.weakness.filter((w) => w.mod > 97 && w.mod < 103);

  const saveAsSet = async () => {
    try {
      await save.mutateAsync({
        name: `${huntName} · ${input.mode === "defensive" ? "Def" : input.mode === "offensive" ? "Ofe" : "Equi"}`.slice(
          0,
          40,
        ),
        setup: result.setup,
      });
      toast.success("Set salvo", {
        description: "Está em Meus sets — dá pra ajustar tier, Wheel e postura lá.",
      });
    } catch (e) {
      toast.error("Não consegui salvar", { description: (e as Error).message });
    }
  };

  const protElements = (
    ["physical", "fire", "earth", "energy", "ice", "holy", "death"] as AttackElement[]
  ).map((el) => ({
    el,
    prot: prot[el] ?? 0,
    share: input.incoming.find((e) => e.element === el)?.pct ?? 0,
  }));

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ raio-x */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdvisorCard
          icon={Skull}
          title="Raio-X da hunt"
          subtitle={`${input.monsters.length} criaturas · peso pelas kills`}
        >
          <ul className="space-y-1.5">
            {input.monsters.slice(0, 10).map((m) => {
              const info = findMonster(m.name);
              const share = (m.count / totalKills) * 100;
              const bestEl = info
                ? (Object.entries(info.mods) as [Element, number][]).sort((a, b) => b[1] - a[1])[0]
                : null;
              return (
                <li key={m.name} className="flex items-center gap-2 text-sm">
                  <GameIcon name={m.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{m.name}</span>
                      <span className="flex-none text-xs tabular-nums text-muted-foreground">
                        {share.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted/30">
                      <div
                        className="h-full rounded-full bg-rubi-gold/70"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {info ? (
                        <>
                          {fmtNum(info.hp)} HP · {fmtNum(info.exp)} XP
                          {bestEl && bestEl[1] > 100 && (
                            <>
                              {" "}
                              · fraca a {elementLabel(bestEl[0]).emoji} {ELEMENT_PT[bestEl[0]]} (
                              {bestEl[1]}%)
                            </>
                          )}
                        </>
                      ) : (
                        "Sem dados na TibiaWiki (criatura do RubinOT?)"
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </AdvisorCard>

        <div className="space-y-4">
          <AdvisorCard
            icon={Flame}
            title="Dano que você toma"
            subtitle={
              incomingSource.kind === "community"
                ? `Real — Input Analyser de ${incomingSource.sessions} ${incomingSource.sessions === 1 ? "sessão" : "sessões"} da comunidade`
                : "Estimado pelos ataques das criaturas na TibiaWiki (sem Input Analyser na comunidade)"
            }
          >
            <MixBar mix={input.incoming} />
          </AdvisorCard>

          <AdvisorCard
            icon={Target}
            title="Fraquezas da hunt"
            subtitle="Média ponderada por kills × vida de cada criatura (100% = dano normal)"
          >
            <WeakRow label="Fraca a" tone="text-rubi-success" items={weak} />
            <WeakRow label="Neutra" tone="text-muted-foreground" items={neutral} />
            <WeakRow label="Resiste a" tone="text-rubi-danger" items={strong} />
            <p className="mt-2 rounded-lg border border-rubi-gold/30 bg-rubi-gold/[0.06] px-2.5 py-1.5 text-xs">
              Melhor elemento pra sua vocação:{" "}
              <b className="text-rubi-gold">
                {elementLabel(result.bestElement).emoji} {ELEMENT_PT[result.bestElement]}
              </b>
            </p>
          </AdvisorCard>
        </div>
      </div>

      {/* ------------------------------------------------ set */}
      <AdvisorCard
        icon={Shirt}
        title="Set recomendado"
        subtitle="Melhor item de cada slot pra sua vocação e level, pesando o dano dessa hunt. Toque numa alternativa pra trocar."
        right={
          <div className="flex flex-wrap gap-2">
            {Object.keys(overrides).length > 0 && (
              <button
                type="button"
                onClick={() => setOverrides({})}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Recomendação original
              </button>
            )}
            {characterId ? (
              <button
                type="button"
                onClick={saveAsSet}
                disabled={save.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rubi-gold px-3 py-1.5 text-xs font-semibold text-background shadow-glow-gold hover:opacity-90 disabled:opacity-50"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />{" "}
                {save.isPending ? "Salvando..." : "Salvar como set"}
              </button>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-lg border border-rubi-gold/50 px-3 py-1.5 text-xs font-semibold text-rubi-gold hover:bg-rubi-gold/10"
              >
                <BookmarkPlus className="h-3.5 w-3.5" /> Entre pra salvar como set
              </Link>
            )}
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
          <div className="min-w-0">
            <EquipmentDoll
              value={result.setup}
              vocation={input.vocation}
              size={46}
              showSummary={false}
            />
          </div>
          <div className="min-w-0 space-y-3">
            <div className="rounded-xl border border-rubi-blue/30 bg-rubi-blue-soft/40 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proteção contra essa hunt
                </span>
                <span className="font-display text-2xl font-bold tabular-nums text-rubi-blue">
                  {effective.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Resistência dos itens × quanto cada elemento bate (sem imbuement, charm e Wheel).
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {protElements.map(({ el, prot: p, share }) => (
                  <div
                    key={el}
                    className={
                      "flex items-center justify-between gap-2 text-xs " +
                      (share < 1 ? "opacity-50" : "")
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: ELEMENT_COLOR[el] }}
                      />
                      {elementLabel(el).label}
                    </span>
                    <b
                      className={
                        "tabular-nums " +
                        (p > 0 ? "text-rubi-success" : p < 0 ? "text-rubi-danger" : "")
                      }
                    >
                      {p > 0 ? "+" : ""}
                      {p}%
                    </b>
                  </div>
                ))}
              </div>
            </div>
            {Object.keys(skills).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(skills)
                  .filter(([, v]) => v !== 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-[11px] capitalize"
                    >
                      {k.replace(" fighting", "")}{" "}
                      <b className="text-rubi-gold">
                        {v > 0 ? "+" : ""}
                        {v}
                      </b>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {result.picks
            .filter((p) => p.options.length > 0)
            .map((p) => (
              <div
                key={p.slot}
                className="min-w-0 rounded-xl border border-border/60 bg-background/30 p-2.5"
              >
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {SLOT_LABEL[p.slot]}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.options.map((o) => {
                    const active = o.name === p.best;
                    return (
                      <button
                        key={o.name}
                        type="button"
                        title={o.summary}
                        onClick={() => setOverrides((cur) => ({ ...cur, [p.slot]: o.name }))}
                        className={
                          "inline-flex max-w-full items-center gap-1.5 rounded-lg border py-1 pl-1 pr-2 text-left text-xs transition-colors " +
                          (active
                            ? "border-rubi-gold bg-rubi-gold/10 font-semibold text-foreground"
                            : "border-border/60 text-muted-foreground hover:border-rubi-gold/50 hover:text-foreground")
                        }
                      >
                        <GameIcon name={o.name} size={22} />
                        <span className="truncate">{o.name}</span>
                      </button>
                    );
                  })}
                </div>
                {p.best && (
                  <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                    {p.options.find((o) => o.name === p.best)?.summary}
                  </p>
                )}
              </div>
            ))}
        </div>
      </AdvisorCard>

      {/* ------------------------------------------------ imbuements, charms, emergência */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AdvisorCard
          icon={Sparkles}
          title="Imbuements"
          subtitle="Pros slots que aceitam, no set acima"
        >
          {imbues.length ? (
            <ul className="space-y-2.5">
              {imbues.map((s) => (
                <li key={s.slot}>
                  <div className="text-xs font-semibold">{IMBUE_SLOT_LABEL[s.slot]}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {s.ids.map((id) => {
                      const t = getImbuementType(id);
                      return t ? (
                        <span
                          key={id}
                          title={t.description}
                          className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 py-0.5 pl-0.5 pr-2 text-xs"
                        >
                          <img src={t.icon} alt="" className="h-5 w-5" /> {t.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{s.why}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Os itens escolhidos não aceitam imbuement.
            </p>
          )}
        </AdvisorCard>

        <AdvisorCard
          icon={Target}
          title="Charms"
          subtitle="Elemento em que cada criatura é mais fraca"
        >
          <ul className="space-y-2">
            {charms.slice(0, 6).map((c) => (
              <li key={c.monster} className="flex items-center gap-2 text-sm">
                <GameIcon name={c.monster} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">
                    {c.monster}{" "}
                    <span className="text-muted-foreground">· {c.share.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {charmIcon(c.charm) && (
                      <img src={charmIcon(c.charm)} alt="" className="h-4 w-4" />
                    )}
                    <b className="text-rubi-gold">{c.charm}</b>
                    <span className="text-muted-foreground">
                      ≈ {fmtNum(c.damage)} de dano ({c.mod}%)
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Dano ≈ 5% da vida da criatura × fraqueza (estimativa). Menores sugeridos:{" "}
            {input.mode === "offensive" ? "Low Blow / Savage Blow (crítico)" : "Dodge / Parry"} e
            Vampiric Embrace + Void's Call.
          </p>
        </AdvisorCard>

        <AdvisorCard
          icon={LifeBuoy}
          title="Pra levar na BP"
          subtitle="Itens de carga — pro aperto, não pro set fixo"
        >
          <ul className="space-y-2">
            {emergency.map((e) => (
              <li key={e.name} className="flex items-start gap-2">
                <GameIcon name={e.name} size={26} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{e.name}</div>
                  <div className="text-[10px] text-muted-foreground">{e.why}</div>
                </div>
              </li>
            ))}
          </ul>
        </AdvisorCard>
      </div>

      {/* ------------------------------------------------ comunidade */}
      {stats && (
        <AdvisorCard
          icon={Users}
          title="Na comunidade"
          subtitle={
            stats.sessions
              ? `${stats.sessions} ${stats.sessions === 1 ? "sessão pública" : "sessões públicas"} dessa vocação nessa hunt`
              : "Ninguém dessa vocação compartilhou sessão nessa hunt ainda"
          }
        >
          {stats.sessions > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="Level médio"
                value={stats.avgLevel != null ? fmtNum(Math.round(stats.avgLevel)) : "—"}
              />
              <Stat
                label="Raw XP/h"
                value={stats.rawXpH != null ? fmtNum(Math.round(stats.rawXpH)) : "—"}
              />
              <Stat
                label="Lucro/h"
                value={stats.profitH != null ? fmtGold(Math.round(stats.profitH)) : "—"}
              />
            </div>
          )}
          {usage && usage.sessions > 0 ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> O que usaram ({usage.sessions} com setup
                registrado)
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <UsageList label="Arma" items={usage.weapons} total={usage.sessions} />
                {(["head", "armor", "legs", "feet", "neck", "ring", "shield"] as GearSlot[]).map(
                  (s) =>
                    usage.gear[s]?.length ? (
                      <UsageList
                        key={s}
                        label={SLOT_LABEL[s]}
                        items={usage.gear[s]!}
                        total={usage.sessions}
                      />
                    ) : null,
                )}
                {usage.stances.length > 0 && (
                  <UsageList label="Postura" items={usage.stances} total={usage.sessions} />
                )}
                {usage.charms.length > 0 && (
                  <UsageList
                    label="Charms"
                    items={usage.charms}
                    total={usage.sessions}
                    icons="charm"
                  />
                )}
              </div>
            </div>
          ) : stats.sessions > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Ninguém registrou o setup (equipamento, postura, charms) nessas sessões ainda.
            </p>
          ) : null}
        </AdvisorCard>
      )}

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Swords className="mt-px h-3.5 w-3.5 flex-none" />
        Recomendação automática a partir da TibiaWiki e das sessões públicas — não considera Wheel,
        tier, bônus de Prey nem itens exclusivos do RubinOT. Use como ponto de partida e ajuste no
        seu set.
      </p>
    </div>
  );
}

function WeakRow({
  label,
  tone,
  items,
}: {
  label: string;
  tone: string;
  items: { element: Element; mod: number }[];
}) {
  if (!items.length) return null;
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
      <span className={"w-16 flex-none text-[11px] font-semibold " + tone}>{label}</span>
      {items.map((w) => (
        <span
          key={w.element}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px]"
        >
          {elementLabel(w.element).emoji} {ELEMENT_PT[w.element]}
          <b className="tabular-nums">{Math.round(w.mod)}%</b>
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate font-display text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function UsageList({
  label,
  items,
  total,
  icons,
}: {
  label: string;
  items: { name: string; count: number }[];
  total: number;
  icons?: "charm";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-background/30 p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.name} className="flex items-center gap-1.5 text-xs">
            {icons === "charm" ? (
              charmIcon(i.name) ? (
                <img src={charmIcon(i.name)} alt="" className="h-5 w-5" />
              ) : null
            ) : (
              <GameIcon name={i.name} size={20} />
            )}
            <span className="min-w-0 flex-1 truncate">{i.name}</span>
            <span className="flex-none tabular-nums text-muted-foreground">
              {Math.round((i.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
