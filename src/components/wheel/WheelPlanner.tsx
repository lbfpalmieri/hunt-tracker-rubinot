import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Eraser, Gem, Lock, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/GameIcon";
import {
  CONVICTION_INFO,
  DEDICATION_RATE,
  EXTRA_POINTS_MAX,
  MITIGATION_PER_POINT,
  PROMOTION_SCROLLS,
  REVELATION_DMG_HEAL,
  REVELATION_INFO,
  REVELATION_STAGE_POINTS,
  VESSEL_MATCH_BONUS,
  VESSEL_NAME,
  WHEEL_REVELATION_BY_DOMAIN,
  WHEEL_SLICES,
  slicePerk,
  slicePerkIcon,
  type WheelDomain,
} from "@/data/wheel-data";
import {
  availableSlices,
  basicModLabel,
  basicModsFor,
  emptyWheel,
  gemName,
  gemQuality,
  resistLabel,
  setSlicePoints,
  summarizeWheel,
  supremeModLabel,
  supremeModsFor,
  type WheelBuild,
  type WheelGem,
  type WheelSummary,
} from "@/lib/wheel";
import type { SetupVocation } from "@/lib/session-setup";
import {
  DEDICATION_COLOR,
  DOMAIN_COLOR,
  WheelOfDestiny,
  type WheelSelection,
} from "@/components/wheel/WheelOfDestiny";

const ROMAN = ["—", "I", "II", "III"];
const DOMAIN_LABEL: Record<WheelDomain, string> = {
  TL: "Domínio verde",
  TR: "Domínio vermelho",
  BL: "Domínio verde-água",
  BR: "Domínio roxo",
};
const VOC_LABEL: Record<SetupVocation, string> = {
  knight: "Knight",
  paladin: "Paladin",
  sorcerer: "Sorcerer",
  druid: "Druid",
  monk: "Monk",
};
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const shortPerk = (p: string) => p.replace(/^Augmented /, "");

/**
 * Planejador da Wheel of Destiny (estilo do planejador oficial do tibia.com, com dados e desenho
 * nossos): pontos pelo level + scrolls, fatias liberando do centro pra fora, revelações, gemas com
 * mods nos Vessels e o resumo de tudo. Controlado: `value` + `onChange`.
 */
export function WheelPlanner({
  value,
  onChange,
  vocation,
}: {
  value: WheelBuild;
  onChange: (next: WheelBuild) => void;
  /** Vocação do personagem (fixa); null = a pessoa escolhe. */
  vocation: SetupVocation | null;
}) {
  const [sel, setSel] = useState<WheelSelection>(null);
  const select = (next: WheelSelection) => setSel(next);
  const summary = useMemo(() => summarizeWheel(value), [value]);

  const apply = (i: number, v: number) => {
    const r = setSlicePoints(value, i, v);
    // id fixo: arrastar a barra numa fatia bloqueada não empilha dezenas de avisos.
    if (!r.ok) toast.error(r.reason, { id: "wheel-points" });
    else onChange(r.build);
  };
  // Cheia → esvazia; senão enche. Se não dá pra encher (sem pontos sobrando) e ela já tem pontos,
  // o clique esvazia — senão a fatia meio cheia ficava "presa".
  const toggleSlice = (i: number) => {
    const s = WHEEL_SLICES[i];
    const p = value.points[i];
    if (p === s.max) return apply(i, 0);
    const r = setSlicePoints(value, i, s.max);
    if (r.ok && r.build !== value) onChange(r.build);
    else if (p > 0) apply(i, 0);
    else if (!r.ok) toast.error(r.reason, { id: "wheel-points" });
    else
      toast.error("Sem pontos sobrando — suba o level ou tire de outra fatia.", {
        id: "wheel-points",
      });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <div className="min-w-0 space-y-3">
        <PointsBar value={value} summary={summary} onChange={onChange} vocation={vocation} />
        <div className="mx-auto w-full max-w-[560px]">
          <WheelOfDestiny
            build={value}
            selected={sel}
            onSelect={select}
            onToggleSlice={toggleSlice}
            className="h-auto w-full"
          />
        </div>
        <Legend />
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <SelectionPanel
            sel={sel}
            value={value}
            summary={summary}
            onChange={onChange}
            apply={apply}
            onSelect={select}
          />
        </div>
        <SummaryPanel summary={summary} voc={value.voc} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function PointsBar({
  value,
  summary,
  onChange,
  vocation,
}: {
  value: WheelBuild;
  summary: WheelSummary;
  onChange: (b: WheelBuild) => void;
  vocation: SetupVocation | null;
}) {
  const { used, budget } = summary;
  const over = budget != null && used > budget;
  const pct =
    budget == null
      ? Math.min(100, (used / 4000) * 100)
      : budget > 0
        ? Math.min(100, (used / budget) * 100)
        : used > 0
          ? 100
          : 0;
  const numIn = (s: string, max: number) => {
    const n = Number(s.replace(/\D/g, ""));
    return s.trim() === "" ? null : Math.min(max, n);
  };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/60 p-3">
      {!vocation && (
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(VOC_LABEL) as SetupVocation[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => v !== value.voc && onChange(emptyWheel(v, value.level))}
              className={
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors " +
                (value.voc === v
                  ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {VOC_LABEL[v]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Level
          </span>
          <input
            inputMode="numeric"
            value={value.level ?? ""}
            onChange={(e) => onChange({ ...value, level: numIn(e.target.value, 5000) })}
            placeholder="ex. 800"
            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold outline-none focus:border-rubi-gold"
          />
        </label>
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Promotion Scrolls
          </span>
          <div className="flex flex-wrap gap-1">
            {PROMOTION_SCROLLS.map((s, i) => {
              const on = !!(value.scrolls & (1 << i));
              return (
                <button
                  key={s.name}
                  type="button"
                  title={`${s.name} (+${s.points})`}
                  onClick={() => onChange({ ...value, scrolls: value.scrolls ^ (1 << i) })}
                  className={
                    "flex items-center gap-1 rounded-lg border px-1.5 py-1 text-xs font-semibold transition-colors " +
                    (on
                      ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                      : "border-border text-muted-foreground opacity-75 hover:opacity-100")
                  }
                >
                  <GameIcon name={s.name} size={22} className={on ? "" : "grayscale"} />+{s.points}
                </button>
              );
            })}
          </div>
        </div>
        <label className="block">
          <span
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            title="Hunting Task Shop (até 50), The Way of the Monk Quest (10) e mods no Grau IV (até 69)"
          >
            Outros pontos
          </span>
          <input
            inputMode="numeric"
            value={value.extra || ""}
            onChange={(e) =>
              onChange({ ...value, extra: numIn(e.target.value, EXTRA_POINTS_MAX) ?? 0 })
            }
            placeholder="0"
            title="Hunting Task Shop (até 50), The Way of the Monk Quest (10) e mods no Grau IV (até 69)"
            className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:border-rubi-gold"
          />
        </label>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...emptyWheel(value.voc, value.level),
              scrolls: value.scrolls,
              extra: value.extra,
            })
          }
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-rubi-danger/60 hover:text-rubi-danger"
        >
          <RotateCcw className="h-4 w-4" /> Zerar roda
        </button>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
          <span>
            <b
              className={"font-display text-xl " + (over ? "text-rubi-danger" : "text-foreground")}
            >
              {fmt(used)}
            </b>
            <span className="text-muted-foreground">
              {budget != null ? ` de ${fmt(budget)} pontos` : " pontos usados"}
            </span>
          </span>
          <span className={"text-sm " + (over ? "text-rubi-danger" : "text-muted-foreground")}>
            {budget == null
              ? "Informe o level pra limitar"
              : over
                ? `${fmt(used - budget)} acima do limite`
                : `sobram ${fmt(budget - used)}`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={"h-full rounded-full " + (over ? "bg-rubi-danger" : "bg-rubi-gold")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [
    [DEDICATION_COLOR.hp, "Vida"],
    [DEDICATION_COLOR.mana, "Mana"],
    [DEDICATION_COLOR.cap, "Capacidade"],
    [DEDICATION_COLOR.mit, "Mitigação"],
  ];
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {l}
        </span>
      ))}
      <span className="w-full text-center">
        Clique numa fatia (esquerdo ou direito) pra encher · clique de novo pra esvaziar · ajuste
        fino no painel
      </span>
    </p>
  );
}

// ---------------------------------------------------------------------------------------------

function SelectionPanel({
  sel,
  value,
  summary,
  onChange,
  apply,
  onSelect,
}: {
  sel: WheelSelection;
  value: WheelBuild;
  summary: WheelSummary;
  onChange: (b: WheelBuild) => void;
  apply: (i: number, v: number) => void;
  onSelect: (s: WheelSelection) => void;
}) {
  if (!sel)
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Como montar</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            Clique numa fatia pra encher; clique de novo pra esvaziar (o botão direito também
            funciona, como no jogo).
          </li>
          <li>Comece pelas 4 fatias do centro; encher uma libera as vizinhas.</li>
          <li>Pra pôr só alguns pontos, use a barra e os botões +1 / +10 no painel.</li>
          <li>
            O perk (ícone) só liga com a fatia cheia; a bolinha colorida é o bônus de cada ponto.
          </li>
          <li>Os cantos são as Revelações (250 / 500 / 1000 pontos no domínio).</li>
          <li>O círculo ao lado de cada canto é o encaixe da gema.</li>
        </ul>
      </div>
    );
  if (sel.type === "slice") return <SlicePanel i={sel.i} value={value} apply={apply} />;
  if (sel.type === "domain")
    return <DomainPanel d={sel.d} value={value} summary={summary} onSelect={onSelect} />;
  return <GemPanel key={sel.d} d={sel.d} value={value} summary={summary} onChange={onChange} />;
}

function PanelShell({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="space-y-3 rounded-xl border bg-card/70 p-3"
      style={{ borderColor: `${color}66`, boxShadow: `inset 3px 0 0 ${color}` }}
    >
      {children}
    </div>
  );
}

function SlicePanel({
  i,
  value,
  apply,
}: {
  i: number;
  value: WheelBuild;
  apply: (i: number, v: number) => void;
}) {
  const s = WHEEL_SLICES[i];
  const p = value.points[i];
  const perk = slicePerk(value.voc, s);
  const info = CONVICTION_INFO[perk];
  const open = availableSlices(value.points).has(i);
  const full = p === s.max;
  const rate = DEDICATION_RATE[value.voc];
  const color = DOMAIN_COLOR[s.domain];
  // Estágio do "Augmented": I com 1 fatia cheia desse perk, II com as 2.
  const sameFull = WHEEL_SLICES.filter(
    (x) => slicePerk(value.voc, x) === perk && value.points[x.i] === x.max,
  ).length;

  const ded: string[] = [];
  const at = (n: number) => `+${fmt(n * p)} / ${fmt(n * s.max)}`;
  if (s.dedication === "hp" || s.dedication === "hpmana") ded.push(`Vida ${at(rate.hp)}`);
  if (s.dedication === "mana" || s.dedication === "hpmana") ded.push(`Mana ${at(rate.mana)}`);
  if (s.dedication === "cap") ded.push(`Capacidade ${at(rate.cap)}`);
  if (s.dedication === "mit")
    ded.push(
      `Mitigação +${fmt(p * MITIGATION_PER_POINT)}% / ${fmt(s.max * MITIGATION_PER_POINT)}%`,
    );

  const steps: [string, number][] = [
    ["−10", -10],
    ["−1", -1],
    ["+1", 1],
    ["+10", 10],
  ];

  return (
    <PanelShell color={color}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-border bg-background">
          <GameIcon
            name={slicePerkIcon(value.voc, s)}
            size={40}
            className={full ? "" : "opacity-60"}
          />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight">{shortPerk(perk)}</p>
          <p className="text-xs text-muted-foreground">
            {DOMAIN_LABEL[s.domain]} · fatia {s.id}
          </p>
          <p className="mt-1 text-xs font-medium">
            {full ? (
              <span className="text-rubi-success">✓ Convicção ativa</span>
            ) : open ? (
              <span className="text-muted-foreground">Encha a fatia pra ativar o perk</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" /> Bloqueada — encha uma vizinha
              </span>
            )}
          </p>
        </div>
      </div>

      {info && (
        <div className="rounded-lg bg-background/60 p-2 text-sm leading-snug">
          {Array.isArray(info) ? (
            <ul className="space-y-1">
              {info.map((t, k) => (
                <li key={k} className={sameFull > k ? "text-foreground" : "text-muted-foreground"}>
                  <b className="mr-1 text-rubi-gold">{k === 0 ? "I" : "II"}</b>
                  {t}
                  {sameFull > k && " ✓"}
                </li>
              ))}
              <li className="text-xs text-muted-foreground">
                Esse perk aparece em 2 fatias: uma cheia = I, as duas = II.
              </li>
            </ul>
          ) : (
            <p>{info}</p>
          )}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-display text-2xl font-bold">
            {p}
            <span className="text-base text-muted-foreground"> / {s.max}</span>
          </span>
          <span className="text-right text-xs text-muted-foreground">{ded.join(" · ")}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{ width: `${(p / s.max) * 100}%`, background: color }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={s.max}
          value={p}
          onChange={(e) => apply(i, Number(e.target.value))}
          className="mt-2 w-full accent-[var(--rubi-gold)]"
          aria-label="Pontos na fatia"
        />
        <div className="mt-2 grid grid-cols-6 gap-1">
          <button
            type="button"
            onClick={() => apply(i, 0)}
            className="rounded-md border border-border py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Zerar
          </button>
          {steps.map(([l, d]) => (
            <button
              key={l}
              type="button"
              onClick={() => apply(i, p + d)}
              className="rounded-md border border-border py-1.5 text-sm font-semibold hover:border-rubi-gold/60"
            >
              {l}
            </button>
          ))}
          <button
            type="button"
            onClick={() => apply(i, s.max)}
            className="rounded-md border border-rubi-gold/60 bg-rubi-gold/15 py-1.5 text-xs font-semibold text-rubi-gold"
          >
            Encher
          </button>
        </div>
      </div>
    </PanelShell>
  );
}

function DomainPanel({
  d,
  value,
  summary,
  onSelect,
}: {
  d: WheelDomain;
  value: WheelBuild;
  summary: WheelSummary;
  onSelect: (s: WheelSelection) => void;
}) {
  const dom = summary.domains.find((x) => x.domain === d)!;
  const rev = WHEEL_REVELATION_BY_DOMAIN[value.voc][d];
  const color = DOMAIN_COLOR[d];
  const mastery = dom.revelationPoints - Math.min(1000, dom.points);
  return (
    <PanelShell color={color}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-border bg-background">
          <GameIcon name={rev} size={40} className={dom.stage ? "" : "grayscale opacity-60"} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight">{rev}</p>
          <p className="text-xs text-muted-foreground">Revelação · {DOMAIN_LABEL[d]}</p>
          <p className="mt-1 text-sm font-semibold text-rubi-gold">
            {dom.stage
              ? `Estágio ${ROMAN[dom.stage]} · +${REVELATION_DMG_HEAL[dom.stage]} dano e cura`
              : "Bloqueada"}
          </p>
        </div>
      </div>
      {REVELATION_INFO[rev] && <p className="text-sm leading-snug">{REVELATION_INFO[rev]}</p>}
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span>
            <b className="font-display text-lg">{fmt(dom.revelationPoints)}</b>
            <span className="text-muted-foreground"> / 1000 pontos</span>
          </span>
          {mastery > 0 && <span className="text-xs text-rubi-gold">+{mastery} da gema</span>}
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{ width: `${dom.revelationPoints / 10}%`, background: color }}
          />
          {[25, 50].map((t) => (
            <span
              key={t}
              className="absolute top-0 h-full w-0.5 bg-background"
              style={{ left: `${t}%` }}
            />
          ))}
        </div>
        <div className="mt-1 grid grid-cols-3 text-center text-[11px] text-muted-foreground">
          {REVELATION_STAGE_POINTS.map((t, k) => (
            <span
              key={t}
              className={dom.revelationPoints >= t ? "font-semibold text-foreground" : ""}
            >
              {ROMAN[k + 1]} · {t} (+{REVELATION_DMG_HEAL[k + 1]})
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect({ type: "gem", d })}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm hover:border-rubi-gold/60"
      >
        <Gem className="h-4 w-4" /> Gema deste domínio ({dom.vessels}/3 Vessels cheios)
      </button>
    </PanelShell>
  );
}

function GemPanel({
  d,
  value,
  summary,
  onChange,
}: {
  d: WheelDomain;
  value: WheelBuild;
  summary: WheelSummary;
  onChange: (b: WheelBuild) => void;
}) {
  const dom = summary.domains.find((x) => x.domain === d)!;
  const gem: WheelGem = value.gems[d] ?? [null, null, null];
  const q = gemQuality(gem);
  const name = gemName(value.voc, gem);
  const color = DOMAIN_COLOR[d];

  const setMod = (slot: 0 | 1 | 2, id: number | null) => {
    const next: WheelGem = [...gem] as WheelGem;
    next[slot] = id;
    // Mods vão em ordem: sem o 1º não tem 2º, sem o 2º não tem supremo.
    if (next[0] == null) next[1] = next[2] = null;
    if (next[1] == null) next[2] = null;
    if (next[1] != null && next[1] === next[0]) next[1] = next[2] = null;
    const gems = { ...value.gems };
    if (next[0] == null) delete gems[d];
    else gems[d] = next;
    onChange({ ...value, gems });
  };

  const basic0 = basicModsFor(value.voc, 0);
  const basic1 = basicModsFor(value.voc, 1).filter((m) => m.id !== gem[0]);
  const supreme = supremeModsFor(value.voc);

  const status = (slot: number) =>
    dom.vessels > slot ? (
      <span className="text-rubi-success">ativo</span>
    ) : (
      <span className="text-muted-foreground">
        precisa de {VESSEL_NAME[slot + 1]} ({slot + 1} Vessel)
      </span>
    );

  return (
    <PanelShell color={color}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-border bg-background">
          {name ? (
            <GameIcon name={name} size={40} />
          ) : (
            <Gem className="h-6 w-6 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight">{name ?? "Sem gema"}</p>
          <p className="text-xs text-muted-foreground">
            {DOMAIN_LABEL[d]} · {VESSEL_NAME[dom.vessels]} ({dom.vessels}/3 Vessel Resonances
            cheias)
          </p>
          {q > 0 && (
            <p className="mt-1 text-sm">
              {dom.vesselBonus ? (
                <span className="font-semibold text-rubi-gold">
                  +{dom.vesselBonus} dano e cura (Vessels = tamanho da gema)
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Com {q} Vessel{q > 1 ? "s" : ""} cheio{q > 1 ? "s" : ""} ganha +
                  {VESSEL_MATCH_BONUS[q]} de dano e cura
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <ModPicker
        label="Mod básico 1"
        status={status(0)}
        value={gem[0]}
        options={basic0.map((m) => ({ id: m.id, label: basicModLabel(m) }))}
        onPick={(id) => setMod(0, id)}
      />
      <ModPicker
        label="Mod básico 2"
        status={status(1)}
        disabled={gem[0] == null}
        value={gem[1]}
        options={basic1.map((m) => ({ id: m.id, label: basicModLabel(m) }))}
        onPick={(id) => setMod(1, id)}
      />
      <ModPicker
        label="Mod supremo"
        status={status(2)}
        disabled={gem[1] == null}
        value={gem[2]}
        options={supreme.map((m) => ({ id: m[0], label: supremeModLabel(m) }))}
        onPick={(id) => setMod(2, id)}
      />
      <p className="text-xs text-muted-foreground">
        Valores no Grau IV (como no planejador oficial). 1 mod = Lesser, 2 = normal, 3 = Greater.
      </p>
      {q > 0 && (
        <button
          type="button"
          onClick={() => setMod(0, null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-rubi-danger"
        >
          <Trash2 className="h-4 w-4" /> Tirar a gema
        </button>
      )}
    </PanelShell>
  );
}

/**
 * Seletor de mod embutido no painel (lista abre ali mesmo, com busca). Não usa Popover: dentro do
 * Dialog a lista flutuante não rolava (o Dialog trava o scroll fora dele) e abria longe do botão no
 * celular.
 */
function ModPicker({
  label,
  status,
  value,
  options,
  onPick,
  disabled = false,
}: {
  label: string;
  status: React.ReactNode;
  value: number | null;
  options: { id: number; label: string }[];
  onPick: (id: number | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const current = options.find((o) => o.id === value);
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const shown = q.trim() ? options.filter((o) => norm(o.label).includes(norm(q.trim()))) : options;
  const pick = (id: number | null) => {
    onPick(id);
    setOpen(false);
    setQ("");
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {value != null && <span className="normal-case tracking-normal">{status}</span>}
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm disabled:opacity-40 " +
          (open ? "border-rubi-gold" : "border-border")
        }
      >
        <span className={current ? "" : "text-muted-foreground"}>
          {current?.label ?? (disabled ? "Escolha o mod anterior primeiro" : "Sem mod")}
        </span>
        <ChevronsUpDown className="h-4 w-4 flex-none opacity-60" />
      </button>
      {open && !disabled && (
        <div className="mt-1 overflow-hidden rounded-lg border border-rubi-gold/40 bg-surface-elevated">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 flex-none opacity-50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar mod (ex. vida, fogo)..."
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {value != null && (
              <li>
                <button
                  type="button"
                  onClick={() => pick(null)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                >
                  <Eraser className="h-4 w-4" /> Sem mod
                </button>
              </li>
            )}
            {shown.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => pick(o.id)}
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted " +
                    (o.id === value ? "bg-rubi-gold/10 text-rubi-gold" : "")
                  }
                >
                  <Check
                    className={
                      "h-4 w-4 flex-none " + (o.id === value ? "opacity-100" : "opacity-0")
                    }
                  />
                  {o.label}
                </button>
              </li>
            ))}
            {shown.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted-foreground">Nada encontrado.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export function SummaryPanel({ summary, voc }: { summary: WheelSummary; voc: SetupVocation }) {
  const stats: [string, string, string][] = [
    ["Vida", `+${fmt(summary.hp)}`, DEDICATION_COLOR.hp],
    ["Mana", `+${fmt(summary.mana)}`, DEDICATION_COLOR.mana],
    ["Capacidade", `+${fmt(summary.cap)}`, DEDICATION_COLOR.cap],
    ["Mitigação", `+${fmt(summary.mitigation)}%`, DEDICATION_COLOR.mit],
  ];
  const resist = Object.entries(summary.resist).filter(([, v]) => v);
  const extras: string[] = [];
  if (summary.skillBoost) extras.push(`+${summary.skillBoost} skill`);
  if (summary.lifeLeech) extras.push(`+${fmt(summary.lifeLeech)}% Life Leech`);
  if (summary.manaLeech) extras.push(`+${fmt(summary.manaLeech)}% Mana Leech`);
  if (summary.critExtra) extras.push(`+${fmt(summary.critExtra)}% dano crítico extra`);
  if (summary.dodge) extras.push(`+${fmt(summary.dodge)}% esquiva`);
  const perks = summary.conviction.filter((c) => !/Leech$|Skill Boost$/.test(c.perk));

  return (
    <div className="space-y-3 rounded-xl border border-rubi-gold/25 bg-rubi-gold/[0.04] p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-brand text-sm font-bold uppercase tracking-wider text-rubi-gold">
          Resumo
        </span>
        <span className="text-sm">
          Dano e cura <b className="font-display text-2xl text-rubi-gold">+{summary.dmgHeal}</b>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {stats.map(([l, v, c]) => (
          <div
            key={l}
            className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5 text-sm"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: c }} />
              {l}
            </span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Revelação
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {summary.domains.map((d) => (
            <div
              key={d.domain}
              className={
                "flex items-center gap-2 rounded-lg border px-2 py-1.5 " +
                (d.stage ? "border-rubi-gold/40 bg-rubi-gold/10" : "border-border opacity-60")
              }
            >
              <GameIcon name={d.revelation} size={24} className={d.stage ? "" : "grayscale"} />
              <span className="min-w-0 flex-1 truncate text-xs">{d.revelation}</span>
              <b className="text-xs text-rubi-gold">{ROMAN[d.stage]}</b>
            </div>
          ))}
        </div>
      </div>

      {(perks.length > 0 || extras.length > 0) && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Convicção
          </p>
          <div className="flex flex-wrap gap-1.5">
            {perks.map((c) => (
              <span
                key={c.perk}
                className="inline-flex items-center gap-1 rounded-full border border-rubi-gold/40 bg-rubi-gold/10 py-0.5 pl-0.5 pr-2 text-xs"
                title={c.perk}
              >
                <GameIcon name={c.perk} size={20} />
                {shortPerk(c.perk)}
                {c.perk.startsWith("Augmented ") && (
                  <b className="text-rubi-gold">{c.count >= 2 ? "II" : "I"}</b>
                )}
              </span>
            ))}
            {extras.map((t) => (
              <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {(resist.length > 0 || summary.augments.length > 0) && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Gemas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {resist.map(([el, v]) => (
              <span
                key={el}
                className={
                  "rounded-full border px-2 py-0.5 text-xs " +
                  (v! < 0 ? "border-rubi-danger/50 text-rubi-danger" : "border-border")
                }
              >
                {v! > 0 ? "+" : ""}
                {fmt(v!)}% {resistLabel(el as Parameters<typeof resistLabel>[0])}
              </span>
            ))}
          </div>
          {summary.augments.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
              {summary.augments.map((a, k) => (
                <li key={k}>• {a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {voc && summary.used === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum ponto na roda ainda.</p>
      )}
    </div>
  );
}
