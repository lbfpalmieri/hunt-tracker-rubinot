import { Link } from "@tanstack/react-router";
import {
  Globe2,
  User,
  Percent,
  TrendingDown,
  TrendingUp,
  History,
  ChevronsRight,
  Crown,
  Zap,
  Coins,
  Package,
  ShoppingBag,
  Swords,
  Flame,
  HeartPulse,
  Shield,
  Skull,
  GitCompareArrows,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CompareHunt } from "@/lib/compare";
import { perHour, topKills } from "@/lib/compare";
import { fmtDate, fmtGold, fmtNum } from "@/lib/format";
import { preyMarkLabel, preyMarkTitle, type PreyBonus } from "@/lib/prey";
import { BountyBadge } from "@/components/BountyBadge";
import { patchDeltaIndex, patchImpactFor, MIN_RELEVANT_PCT, type PatchMetricDelta } from "@/lib/patch-impact";
import { formatPatchDate, isPrePatch, latestPatch, type BalancePatch } from "@/lib/patches";

type Better = "high" | "low" | "none";

interface Row {
  label: string;
  icon: LucideIcon;
  better: Better;
  /** Numeric value used for the best/worst highlight. Null = sem dado. */
  value: (h: CompareHunt) => number | null;
  render: (h: CompareHunt) => React.ReactNode;
  /** Prey bonus that influences this metric. */
  prey?: PreyBonus;
  /** true = formata em gold (fmtGold), false/ausente = número simples (fmtNum). */
  gold?: boolean;
}

const ROWS: Row[] = [
  {
    label: "Raw XP (sem bounty)",
    icon: Zap,
    better: "high",
    value: (h) => perHour(h.rawXpHunt, h.durationSec),
    render: (h) => {
      const v = perHour(h.rawXpHunt, h.durationSec);
      return v == null ? "—" : fmtNum(v);
    },
    prey: "xp",
  },
  {
    label: "Lucro",
    icon: Coins,
    better: "high",
    value: (h) => perHour(h.balance, h.durationSec),
    render: (h) => fmtGold(perHour(h.balance, h.durationSec) ?? 0),
    prey: "loot",
    gold: true,
  },
  {
    label: "Loot",
    icon: Package,
    better: "high",
    value: (h) => perHour(h.loot, h.durationSec),
    render: (h) => fmtGold(perHour(h.loot, h.durationSec) ?? 0),
    prey: "loot",
    gold: true,
  },
  {
    label: "Supplies",
    icon: ShoppingBag,
    better: "low",
    value: (h) => perHour(h.supplies, h.durationSec),
    render: (h) => fmtGold(perHour(h.supplies, h.durationSec) ?? 0),
    gold: true,
  },
  {
    label: "Kills",
    icon: Swords,
    better: "high",
    value: (h) => perHour(h.killsTotal, h.durationSec),
    render: (h) => fmtNum(perHour(h.killsTotal, h.durationSec) ?? 0),
  },
  {
    label: "Dano causado",
    icon: Flame,
    better: "high",
    value: (h) => perHour(h.damageDealt, h.durationSec),
    render: (h) => fmtNum(perHour(h.damageDealt, h.durationSec) ?? 0),
    prey: "damage",
  },
  {
    label: "Cura",
    icon: HeartPulse,
    better: "none",
    value: (h) => perHour(h.healing, h.durationSec),
    render: (h) => fmtNum(perHour(h.healing, h.durationSec) ?? 0),
  },
  {
    label: "Dano recebido",
    icon: Shield,
    better: "low",
    value: (h) => perHour(h.damageReceived, h.durationSec),
    render: (h) => {
      const v = perHour(h.damageReceived, h.durationSec);
      return v == null ? "—" : fmtNum(v);
    },
    prey: "defense",
  },
  {
    label: "Top 3 monstros",
    icon: Skull,
    better: "none",
    value: () => null,
    render: (h) => {
      const top = topKills(h);
      if (!top.length) return "—";
      return (
        <span className="inline-flex flex-col gap-0.5 text-xs">
          {top.map((k) => (
            <span key={k.name}>
              {k.name}{" "}
              <span className="font-mono text-rubi-gold">
                ×{fmtNum(perHour(k.count, h.durationSec) ?? 0)}
              </span>
            </span>
          ))}
        </span>
      );
    },
  },
];

/** Rows com vencedor/perdedor claro — usadas no placar e no destaque de maior diferença. */
const SCORABLE_ROWS = ROWS.filter((r) => r.better !== "none");

function toneFor(row: Row, hunts: CompareHunt[], h: CompareHunt): string {
  if (row.better === "none" || hunts.length < 2) return "";
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return "";
  const v = row.value(h);
  if (v == null) return "";
  const best = row.better === "high" ? Math.max(...values) : Math.min(...values);
  const worst = row.better === "high" ? Math.min(...values) : Math.max(...values);
  if (best === worst) return "";
  if (v === best) return "text-rubi-success font-semibold";
  if (v === worst) return "text-rubi-danger";
  return "";
}

function barToneFor(row: Row, hunts: CompareHunt[], h: CompareHunt): string {
  if (row.better === "none" || hunts.length < 2) return "bg-muted-foreground/25";
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return "bg-muted-foreground/25";
  const v = row.value(h);
  if (v == null) return "bg-muted-foreground/25";
  const best = row.better === "high" ? Math.max(...values) : Math.min(...values);
  const worst = row.better === "high" ? Math.min(...values) : Math.max(...values);
  if (best === worst) return "bg-muted-foreground/25";
  if (v === best) return "bg-rubi-success";
  if (v === worst) return "bg-rubi-danger";
  return "bg-rubi-blue/50";
}

/**
 * Largura da barrinha de proporção de cada célula, relativa ao maior |valor|
 * da linha — dá uma leitura visual instantânea de "quanto maior" sem precisar
 * ler os números. Piso de 4% pra barra não desaparecer quando o valor é baixo
 * mas ainda existe.
 */
function barWidthFor(row: Row, hunts: CompareHunt[], h: CompareHunt): number | null {
  if (row.better === "none") return null;
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const v = row.value(h);
  if (v == null) return null;
  const maxAbs = Math.max(...values.map((x) => Math.abs(x)));
  if (maxAbs <= 0) return null;
  return Math.max(4, Math.round((Math.abs(v) / maxAbs) * 100));
}

function winnersOf(row: Row, hunts: CompareHunt[]): Set<string> {
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return new Set();
  const best = row.better === "high" ? Math.max(...values) : Math.min(...values);
  const winners = new Set<string>();
  for (const h of hunts) {
    if (row.value(h) === best) winners.add(h.key);
  }
  return winners;
}

/**
 * Sessões individuais da mesma hunt têm o mesmo huntName — marcamos com a data
 * pra diferenciar quando isso acontece.
 */
function isAmbiguousName(h: CompareHunt, hunts: CompareHunt[]): boolean {
  if ((h.sessionCount ?? 1) > 1) return false;
  return hunts.filter(
    (x) => (x.sessionCount ?? 1) <= 1 && x.huntName.trim().toLowerCase() === h.huntName.trim().toLowerCase(),
  ).length > 1;
}

const fmtRowValue = (row: Row, v: number) => (row.gold ? fmtGold(v) : fmtNum(v));

const fmtPct = (pct: number) => (pct >= 10 ? Math.round(pct) : Number(pct.toFixed(1))).toLocaleString("pt-BR");

const GAP_MIN_PCT = 5;

interface Gap {
  row: Row;
  best: CompareHunt;
  worst: CompareHunt;
  bestValue: number;
  worstValue: number;
  pct: number;
}

/**
 * A métrica com a maior diferença percentual entre a melhor e a pior hunt
 * comparada — o destaque automático que o usuário pediu pra não precisar
 * garimpar a tabela inteira atrás do que mais mudou. Ignora métricas sem
 * vencedor claro e diferenças pequenas demais pra serem o destaque (GAP_MIN_PCT).
 */
function biggestGap(hunts: CompareHunt[]): Gap | null {
  if (hunts.length < 2) return null;
  let top: Gap | null = null;
  for (const row of SCORABLE_ROWS) {
    const entries = hunts
      .map((h) => ({ h, v: row.value(h) }))
      .filter((e): e is { h: CompareHunt; v: number } => e.v != null);
    if (entries.length < 2) continue;
    entries.sort((a, b) => (row.better === "high" ? b.v - a.v : a.v - b.v));
    const bestE = entries[0];
    const worstE = entries[entries.length - 1];
    if (bestE.v === worstE.v) continue;
    // Sinais diferentes (ex.: lucro positivo vs. negativo) tornam a % pouco confiável — pula.
    if (Math.sign(bestE.v) !== Math.sign(worstE.v) && bestE.v !== 0 && worstE.v !== 0) continue;
    const base = Math.abs(worstE.v);
    if (base < 1e-6) continue;
    const pct = (Math.abs(bestE.v - worstE.v) / base) * 100;
    if (pct < GAP_MIN_PCT) continue;
    if (!top || pct > top.pct) {
      top = { row, best: bestE.h, worst: worstE.h, bestValue: bestE.v, worstValue: worstE.v, pct };
    }
  }
  return top;
}

function GapSpotlight({ gap }: { gap: Gap }) {
  const Icon = gap.row.icon;
  return (
    <div className="card-surface relative overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rubi-blue/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-rubi-blue/15 text-rubi-blue">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Maior diferença encontrada
          </div>
          <p className="mt-1 text-sm leading-snug">
            Em <span className="font-semibold">{gap.row.label}</span>,{" "}
            <span className="font-semibold text-rubi-gold">{gap.best.huntName}</span> ficou{" "}
            <span className="font-mono font-semibold text-rubi-success">{fmtPct(gap.pct)}%</span>{" "}
            {gap.row.better === "low" ? "menor" : "maior"} que{" "}
            <span className="font-semibold">{gap.worst.huntName}</span>{" "}
            <span className="text-muted-foreground">
              ({fmtRowValue(gap.row, gap.bestValue)} vs {fmtRowValue(gap.row, gap.worstValue)}/h)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function PatchSpotlight({
  patch,
  huntName,
  delta,
}: {
  patch: BalancePatch;
  huntName: string;
  delta: PatchMetricDelta;
}) {
  const good = delta.lowerIsBetter ? delta.pct < 0 : delta.pct > 0;
  const Icon = delta.pct > 0 ? TrendingUp : TrendingDown;
  const fmtV = (v: number) =>
    delta.label === "Lucro" || delta.label === "Loot" || delta.label === "Supplies" ? fmtGold(v) : fmtNum(v);
  return (
    <div className="card-surface relative overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rubi-gold/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-rubi-gold/15 text-rubi-gold">
          <History className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Efeito do {patch.label}
          </div>
          <p className="mt-1 text-sm leading-snug">
            Em <span className="font-semibold">{huntName}</span>, <span className="font-semibold">{delta.label}</span>{" "}
            por hora {good ? "melhorou" : "piorou"}{" "}
            <span
              className={
                "inline-flex items-center gap-0.5 font-mono font-semibold " +
                (good ? "text-rubi-success" : "text-rubi-danger")
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {fmtPct(Math.abs(delta.pct))}%
            </span>{" "}
            desde {formatPatchDate(patch)}{" "}
            <span className="text-muted-foreground">
              ({fmtV(delta.before)} → {fmtV(delta.after)}/h)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function FighterChip({
  hunt,
  index,
  isBest,
  ambiguous,
}: {
  hunt: CompareHunt;
  index: number;
  isBest: boolean;
  ambiguous: boolean;
}) {
  return (
    <div
      className={
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors " +
        (isBest ? "border-rubi-gold bg-rubi-gold/10 shadow-glow-gold" : "border-border/60 bg-muted/10")
      }
    >
      {isBest && <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" />}
      <span className="rounded bg-rubi-blue/20 px-1.5 py-0.5 font-mono text-[10px] text-rubi-blue">
        #{index + 1}
      </span>
      {hunt.source === "community" ? (
        <Globe2 className="h-3.5 w-3.5 flex-none text-rubi-blue" />
      ) : (
        <User className="h-3.5 w-3.5 flex-none text-rubi-gold" />
      )}
      <span className="font-display text-sm font-semibold">{hunt.huntName}</span>
      {ambiguous && <span className="text-xs font-normal text-muted-foreground">{fmtDate(hunt.createdAt)}</span>}
    </div>
  );
}

/**
 * Selo de variação pós-atualização, exibido só quando o usuário liga o botão
 * de porcentagem. Só renderiza pra variações relevantes (ver `deltaFor` mais
 * abaixo, que já filtra pelo piso de MIN_RELEVANT_PCT) — um "≈0%" cinza em
 * toda métrica que não mudou nada era ruído puro, não informação.
 */
function DeltaBadge({ delta, patchLabel }: { delta: PatchMetricDelta; patchLabel: string }) {
  const good = delta.lowerIsBetter ? delta.pct < 0 : delta.pct > 0;
  const tone = good ? "text-rubi-success border-rubi-success/40" : "text-rubi-danger border-rubi-danger/40";
  const Icon = delta.pct > 0 ? TrendingUp : TrendingDown;
  const fmtV = (v: number) =>
    delta.label === "Lucro" || delta.label === "Loot" || delta.label === "Supplies" ? fmtGold(v) : fmtNum(v);
  return (
    <span
      title={`${patchLabel}: ${fmtV(delta.before)}/h antes → ${fmtV(delta.after)}/h depois`}
      className={"mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold " + tone}
    >
      <Icon className="h-3 w-3 flex-none" />
      {`${delta.pct > 0 ? "+" : "−"}${fmtPct(Math.abs(delta.pct))}%`}
    </span>
  );
}

export function CompareTable({ hunts, pool }: { hunts: CompareHunt[]; pool?: CompareHunt[] }) {
  const patch = latestPatch();
  const [showDelta, setShowDelta] = useState(false);
  const deltaIndex = useMemo(
    (): Map<string, Map<string, PatchMetricDelta>> =>
      pool && pool.length ? patchDeltaIndex(pool, hunts.map((h) => h.huntName), patch) : new Map(),
    [pool, hunts, patch],
  );
  const hasDelta = deltaIndex.size > 0;
  const deltaFor = (h: CompareHunt, label: string) => {
    if (!showDelta) return null;
    const delta = deltaIndex.get(h.huntName.trim().toLowerCase())?.get(label);
    // Abaixo do piso de relevância é flutuação normal, não efeito do balanceamento — não vale um selo.
    return delta && Math.abs(delta.pct) >= MIN_RELEVANT_PCT ? delta : null;
  };

  /** Manchete automática do efeito do patch: a maior variação encontrada, com o quê/quanto/desde quando. */
  const patchImpacts = useMemo(
    () => (pool && pool.length && patch ? patchImpactFor(pool, hunts.map((h) => h.huntName), patch) : []),
    [pool, hunts, patch],
  );
  const topPatchDelta = useMemo(() => {
    let top: { huntName: string; delta: PatchMetricDelta } | null = null;
    for (const imp of patchImpacts) {
      for (const d of imp.deltas) {
        if (!top || Math.abs(d.pct) > Math.abs(top.delta.pct)) top = { huntName: imp.huntName, delta: d };
      }
    }
    return top;
  }, [patchImpacts]);

  /** Placar compacto: quantas métricas com vencedor claro cada hunt ganhou. */
  const scoreboard = useMemo(() => {
    const scores = new Map<string, number>(hunts.map((h) => [h.key, 0]));
    let decided = 0;
    for (const row of SCORABLE_ROWS) {
      const w = winnersOf(row, hunts);
      if (w.size !== 1) continue;
      decided++;
      for (const key of w) scores.set(key, (scores.get(key) ?? 0) + 1);
    }
    const ranked = hunts
      .map((h) => ({ hunt: h, score: scores.get(h.key) ?? 0 }))
      .sort((a, b) => b.score - a.score);
    const tie = ranked.length > 1 && ranked[0].score === ranked[1].score;
    return { ranked, decided, bestKey: !tie && ranked.length > 1 && ranked[0].score > 0 ? ranked[0].hunt.key : null };
  }, [hunts]);
  const bestKey = scoreboard.bestKey;

  const gap = useMemo(() => biggestGap(hunts), [hunts]);

  /** Frase de veredito em português claro — o resumo que substitui "ler a tabela inteira pra entender o que rolou". */
  const verdictText = useMemo(() => {
    if (scoreboard.decided === 0) {
      return "Nenhuma métrica teve vencedor claro entre essas hunts — poucas com dado nos dois lados, ou empate exato. Os números completos estão logo abaixo.";
    }
    if (!bestKey) {
      return `Empate técnico: nenhuma hunt dominou a maioria das ${scoreboard.decided} métrica${scoreboard.decided > 1 ? "s" : ""} comparadas.`;
    }
    const winner = scoreboard.ranked[0];
    const base = `${winner.hunt.huntName} levou a melhor, vencendo ${winner.score} de ${scoreboard.decided} métricas comparadas`;
    if (gap && gap.best.key === winner.hunt.key) {
      return `${base} — o maior salto foi em ${gap.row.label.toLowerCase()}, ${fmtPct(gap.pct)}% ${gap.row.better === "low" ? "menor" : "maior"} que ${gap.worst.huntName}.`;
    }
    return `${base}.`;
  }, [scoreboard, bestKey, gap]);

  // No celular a tabela quase sempre não cabe inteira — sem essa pista, a segunda
  // hunt fica escondida fora da tela e parece que só existe uma coluna pra ver.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [hunts]);

  return (
    <div className="space-y-4">
      {/* Veredito: quem venceu e por quê, em português claro, antes de qualquer tabela crua. */}
      <div className="card-surface relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rubi-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-rubi-blue/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <GitCompareArrows className="h-3.5 w-3.5" /> Resultado do comparativo
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hunts.map((h, i) => (
              <FighterChip
                key={h.key}
                hunt={h}
                index={i}
                isBest={bestKey === h.key}
                ambiguous={isAmbiguousName(h, hunts)}
              />
            ))}
          </div>
          <p className="mt-4 max-w-2xl font-display text-lg font-semibold leading-snug sm:text-xl">{verdictText}</p>
          {scoreboard.decided > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {scoreboard.ranked.map(({ hunt, score }) => (
                <span
                  key={hunt.key}
                  title={`${hunt.huntName}: ${score} de ${scoreboard.decided} métricas`}
                  className={
                    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-mono " +
                    (hunt.key === bestKey ? "border-rubi-gold/50 text-rubi-gold" : "border-border/60 text-muted-foreground")
                  }
                >
                  #{hunts.indexOf(hunt) + 1}
                  <span className="font-semibold">{score}</span>
                  <span className="opacity-60">/{scoreboard.decided}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {(gap || topPatchDelta) && (
        <div className={"grid gap-3 " + (gap && topPatchDelta ? "sm:grid-cols-2" : "")}>
          {gap && <GapSpotlight gap={gap} />}
          {topPatchDelta && patch && (
            <PatchSpotlight patch={patch} huntName={topPatchDelta.huntName} delta={topPatchDelta.delta} />
          )}
        </div>
      )}

      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Por hora de caça</div>
          {patch && (
            <button
              type="button"
              onClick={() => setShowDelta((v) => !v)}
              aria-pressed={showDelta}
              disabled={!hasDelta}
              title={
                hasDelta
                  ? `Mostra, em cada métrica, quanto o ritmo por hora mudou depois do ${patch.label} (${formatPatchDate(patch)}).`
                  : `Nenhuma hunt selecionada tem histórico suficiente dos dois lados de ${formatPatchDate(patch)}.`
              }
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
                (!hasDelta
                  ? "cursor-not-allowed border-border/50 text-muted-foreground/50"
                  : showDelta
                    ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                    : "border-border/60 text-muted-foreground hover:border-rubi-gold/40")
              }
            >
              <Percent className="h-3.5 w-3.5 flex-none" />
              Variação desde o {patch.label}
            </button>
          )}
        </div>

        {showDelta && hasDelta && patch && (
          <div className="border-b border-border/60 bg-rubi-gold/5 px-4 py-2 text-xs text-muted-foreground">
            Comparando o ritmo por hora de antes e depois do{" "}
            <span className="font-medium text-foreground">{patch.label}</span> ({formatPatchDate(patch)}) — variações
            abaixo de {MIN_RELEVANT_PCT}% não aparecem, são flutuação normal.
          </div>
        )}

        <div className="relative">
          <div ref={scrollRef} className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    Métrica
                  </th>
                  {hunts.map((h, i) => {
                    const agg = (h.sessionCount ?? 1) > 1;
                    const pre = patch && !agg && isPrePatch(h.createdAt, patch);
                    return (
                      <th key={h.key} className="px-4 py-3 text-left align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-rubi-blue/20 px-1.5 py-0.5 font-mono text-[10px] text-rubi-blue">
                            #{i + 1}
                          </span>
                          {h.source === "community" ? (
                            <Globe2 className="h-3.5 w-3.5 flex-none text-rubi-blue" />
                          ) : (
                            <User className="h-3.5 w-3.5 flex-none text-rubi-gold" />
                          )}
                          {agg ? (
                            <span className="font-display text-sm font-semibold">{h.huntName}</span>
                          ) : (
                            <Link
                              to={h.source === "own" ? "/sessions/$id" : "/community/$id"}
                              params={{ id: h.id }}
                              className="font-display text-sm font-semibold hover:text-rubi-blue"
                            >
                              {h.huntName}
                            </Link>
                          )}
                          {bestKey === h.key && (
                            <span title="Melhor resultado geral" className="inline-flex flex-none text-rubi-gold">
                              <Crown className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                          {h.charName} · {h.vocation}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {agg ? `Média de ${h.sessionCount} sessões` : fmtDate(h.createdAt)}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {pre && patch && (
                            <span
                              title={`Sessão de antes do ${patch.label} (${formatPatchDate(patch)}) — o balanceamento do servidor era outro.`}
                              className="inline-flex items-center gap-1 rounded-full border border-rubi-gold/40 px-1.5 py-0.5 text-[10px] font-semibold text-rubi-gold"
                            >
                              <History className="h-3 w-3 flex-none" /> pré-nerf
                            </span>
                          )}
                          {!agg && h.bounty && <BountyBadge bounty={h.bounty} />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/40 last:border-0">
                    <th className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <row.icon className="h-3.5 w-3.5 flex-none text-muted-foreground/70" />
                        {row.label}
                      </span>
                    </th>
                    {hunts.map((h) => {
                      const mark = row.prey ? preyMarkLabel(h.prey, row.prey) : null;
                      const delta = deltaFor(h, row.label);
                      const barWidth = barWidthFor(row, hunts, h);
                      return (
                        <td key={h.key} className="px-4 py-2.5 align-top">
                          <div className={"font-mono " + toneFor(row, hunts, h)}>{row.render(h)}</div>
                          {barWidth != null && (
                            <div className="mt-1.5 h-1 w-full max-w-[110px] overflow-hidden rounded-full bg-muted-foreground/15">
                              <div
                                className={"h-full rounded-full " + barToneFor(row, hunts, h)}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          )}
                          {delta && patch && <DeltaBadge delta={delta} patchLabel={patch.label} />}
                          {mark && (
                            <div
                              title={row.prey ? preyMarkTitle(h.prey, row.prey) : undefined}
                              className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-gold"
                            >
                              {mark}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canScrollRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center justify-end bg-gradient-to-l from-card to-transparent pr-1.5">
              <ChevronsRight className="h-4 w-4 flex-none animate-pulse text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-rubi-success">Verde</span> = melhor ·{" "}
          <span className="font-semibold text-rubi-danger">vermelho</span> = pior · barra = proporção em relação ao maior
          valor da linha · dourado = bônus de Prey.
        </div>
      </div>
    </div>
  );
}
