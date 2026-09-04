import { Link } from "@tanstack/react-router";
import {
  Globe2,
  User,
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
import { formatPatchDate, isPrePatch, latestPatch } from "@/lib/patches";
import { PositionBadge, fmtPct } from "@/components/compare/shared";

type Better = "high" | "low" | "none";

interface Row {
  label: string;
  icon: LucideIcon;
  /** Cor do ícone e do fundinho atrás dele — dá identidade própria pra cada métrica. */
  iconColor: string;
  iconBg: string;
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
    iconColor: "text-sky-400",
    iconBg: "bg-sky-400/15",
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
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/15",
    better: "high",
    value: (h) => perHour(h.balance, h.durationSec),
    render: (h) => fmtGold(perHour(h.balance, h.durationSec) ?? 0),
    prey: "loot",
    gold: true,
  },
  {
    label: "Loot",
    icon: Package,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/15",
    better: "high",
    value: (h) => perHour(h.loot, h.durationSec),
    render: (h) => fmtGold(perHour(h.loot, h.durationSec) ?? 0),
    prey: "loot",
    gold: true,
  },
  {
    label: "Supplies",
    icon: ShoppingBag,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-400/15",
    better: "low",
    value: (h) => perHour(h.supplies, h.durationSec),
    render: (h) => fmtGold(perHour(h.supplies, h.durationSec) ?? 0),
    gold: true,
  },
  {
    label: "Kills",
    icon: Swords,
    iconColor: "text-fuchsia-400",
    iconBg: "bg-fuchsia-400/15",
    better: "high",
    value: (h) => perHour(h.killsTotal, h.durationSec),
    render: (h) => fmtNum(perHour(h.killsTotal, h.durationSec) ?? 0),
  },
  {
    label: "Dano causado",
    icon: Flame,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-400/15",
    better: "high",
    value: (h) => perHour(h.damageDealt, h.durationSec),
    render: (h) => fmtNum(perHour(h.damageDealt, h.durationSec) ?? 0),
    prey: "damage",
  },
  {
    label: "Cura",
    icon: HeartPulse,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/15",
    better: "none",
    value: (h) => perHour(h.healing, h.durationSec),
    render: (h) => fmtNum(perHour(h.healing, h.durationSec) ?? 0),
  },
  {
    label: "Dano recebido",
    icon: Shield,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/15",
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
    iconColor: "text-violet-400",
    iconBg: "bg-violet-400/15",
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

/**
 * Nomes de hunt costumam ser longos e parecidos entre si (ex.: "Darashia -
 * Ferumbras Plague -1" vs. "Darashia - Ferumbras Jugger Seal - 1") — enfiar
 * os dois numa frase corrida ficava ilegível. Aqui cada hunt vira sua própria
 * linha (posição colorida + nome à esquerda, valor à direita), como um
 * mini-placar, então dá pra comparar sem precisar "separar" os nomes dentro
 * do texto.
 */
function GapSpotlight({ gap, bestIndex, worstIndex }: { gap: Gap; bestIndex: number; worstIndex: number }) {
  const Icon = gap.row.icon;
  return (
    <div className="card-surface relative overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rubi-blue/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-rubi-blue/15 text-rubi-blue">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate">Maior diferença encontrada · {gap.row.label}</span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <PositionBadge index={bestIndex} />
              <span className="min-w-0 truncate text-sm font-semibold text-rubi-gold" title={gap.best.huntName}>
                {gap.best.huntName}
              </span>
            </span>
            <span className="flex-none font-mono text-sm font-semibold text-rubi-success">
              {fmtRowValue(gap.row, gap.bestValue)}/h
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <PositionBadge index={worstIndex} />
              <span className="min-w-0 truncate text-sm text-muted-foreground" title={gap.worst.huntName}>
                {gap.worst.huntName}
              </span>
            </span>
            <span className="flex-none font-mono text-sm text-muted-foreground">
              {fmtRowValue(gap.row, gap.worstValue)}/h
            </span>
          </div>
        </div>
        <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-rubi-success/40 bg-rubi-success/10 px-2 py-0.5 text-xs font-semibold text-rubi-success">
          <TrendingUp className="h-3 w-3 flex-none" />
          {fmtPct(gap.pct)}% {gap.row.better === "low" ? "menor" : "maior"}
        </div>
      </div>
    </div>
  );
}

/**
 * Card de resultado por hunt dentro do hero — posição, nome e placar juntos
 * no mesmo lugar. A mesma cor de #N usada aqui, no cabeçalho da tabela e no
 * card de maior diferença ajuda a "casar" as hunts entre os diferentes
 * blocos da tela, mesmo quando duas têm o mesmo nome.
 */
function FighterCard({
  hunt,
  index,
  isBest,
  ambiguous,
  score,
  decided,
}: {
  hunt: CompareHunt;
  index: number;
  isBest: boolean;
  ambiguous: boolean;
  score: number | null;
  decided: number;
}) {
  const pct = decided > 0 && score != null ? Math.round((score / decided) * 100) : null;
  return (
    <div
      className={
        "rounded-xl border p-3 transition-colors " +
        (isBest ? "border-rubi-gold bg-rubi-gold/10 shadow-glow-gold" : "border-border/60 bg-muted/10")
      }
    >
      <div className="flex items-center gap-1.5">
        <PositionBadge index={index} />
        {isBest && <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" />}
        {hunt.source === "community" ? (
          <Globe2 className="h-3.5 w-3.5 flex-none text-rubi-blue" />
        ) : (
          <User className="h-3.5 w-3.5 flex-none text-rubi-gold" />
        )}
        <span className="min-w-0 truncate font-display text-sm font-semibold">{hunt.huntName}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {ambiguous ? fmtDate(hunt.createdAt) : `${hunt.charName} · ${hunt.vocation}`}
      </div>
      {pct != null && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {score} de {decided} métricas
            </span>
            <span className={"font-mono font-semibold " + (isBest ? "text-rubi-gold" : "text-muted-foreground")}>
              {pct}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted-foreground/15">
            <div
              className={"h-full rounded-full " + (isBest ? "bg-rubi-gold" : "bg-rubi-blue/50")}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Selo padrão de diferença — número absoluto e percentual, sempre visível
 * (não é mais um recurso amarrado a um patch específico: são muitas
 * atualizações ao longo do tempo, então o jeito certo é a comparação entre
 * as hunts selecionadas ser sempre exibida, de forma genérica). Mostra
 * quanto essa hunt fica atrás da melhor da linha em valor absoluto E em %
 * juntos — ex.: uma fez 100 de dano/h, a outra 70 de dano/h, o selo mostra
 * "−30 (−30%)" na de 70. A própria melhor não ganha selo (ela é a
 * referência). Sem piso de relevância: mesmo diferenças pequenas aparecem.
 */
function DiffBadge({ row, hunts, h }: { row: Row; hunts: CompareHunt[]; h: CompareHunt }) {
  if (row.better === "none" || hunts.length < 2) return null;
  const values = hunts.map(row.value).filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const v = row.value(h);
  if (v == null) return null;
  const best = row.better === "high" ? Math.max(...values) : Math.min(...values);
  const worst = row.better === "high" ? Math.min(...values) : Math.max(...values);
  if (v === best) return null;
  const diff = v - best;
  const sign = diff > 0 ? "+" : "−";
  const absDiffFmt = fmtRowValue(row, Math.abs(diff));
  const pct = Math.abs(best) > 1e-9 ? (Math.abs(diff) / Math.abs(best)) * 100 : null;
  const tone =
    v === worst
      ? "border-rubi-danger/40 bg-rubi-danger/10 text-rubi-danger"
      : "border-border/50 bg-muted/30 text-muted-foreground";
  return (
    <span
      title={`Comparado à melhor desta métrica: ${sign}${absDiffFmt}${pct != null ? ` (${sign}${fmtPct(pct)}%)` : ""}`}
      className={"inline-flex flex-none items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold " + tone}
    >
      {sign}
      {absDiffFmt}
      {pct != null && ` (${sign}${fmtPct(pct)}%)`}
    </span>
  );
}

export function CompareTable({ hunts }: { hunts: CompareHunt[] }) {
  const patch = latestPatch();

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
  const gapBestIndex = gap ? hunts.findIndex((h) => h.key === gap.best.key) : -1;
  const gapWorstIndex = gap ? hunts.findIndex((h) => h.key === gap.worst.key) : -1;

  /** Frase de veredito em português claro — o resumo que substitui "ler a tabela inteira pra entender o que rolou". */
  const verdictText = useMemo(() => {
    if (scoreboard.decided === 0) {
      return "Nenhuma métrica teve vencedor claro entre essas hunts — poucas com dado nos dois lados, ou empate exato. Os números completos estão logo abaixo.";
    }
    if (!bestKey) {
      return `Empate técnico: nenhuma hunt dominou a maioria das ${scoreboard.decided} métrica${scoreboard.decided > 1 ? "s" : ""} comparadas.`;
    }
    const winner = scoreboard.ranked[0];
    // O nome da 2ª hunt fica de fora de propósito: nomes de hunt costumam ser longos e
    // parecidos, e enfiar dois numa frase corrida vira sopa de letrinhas — o card
    // "Maior diferença encontrada" logo abaixo já mostra essa comparação com clareza.
    return `${winner.hunt.huntName} levou a melhor, vencendo ${winner.score} de ${scoreboard.decided} métricas comparadas.`;
  }, [scoreboard, bestKey]);

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
          <p className="mt-2 max-w-2xl font-display text-lg font-semibold leading-snug sm:text-xl">{verdictText}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {hunts.map((h, i) => (
              <FighterCard
                key={h.key}
                hunt={h}
                index={i}
                isBest={bestKey === h.key}
                ambiguous={isAmbiguousName(h, hunts)}
                score={scoreboard.decided > 0 ? (scoreboard.ranked.find((r) => r.hunt.key === h.key)?.score ?? 0) : null}
                decided={scoreboard.decided}
              />
            ))}
          </div>
        </div>
      </div>

      {gap && gapBestIndex >= 0 && gapWorstIndex >= 0 && (
        <GapSpotlight gap={gap} bestIndex={gapBestIndex} worstIndex={gapWorstIndex} />
      )}

      <div className="card-surface overflow-hidden">
        <div className="border-b border-border/60 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Por hora de caça
        </div>

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
                          <PositionBadge index={i} />
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
                        <div className="mt-1 text-xs font-normal text-muted-foreground">
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
                      <span className="inline-flex items-center gap-2">
                        <span className={"flex h-6 w-6 flex-none items-center justify-center rounded-md " + row.iconBg}>
                          <row.icon className={"h-3.5 w-3.5 " + row.iconColor} />
                        </span>
                        {row.label}
                      </span>
                    </th>
                    {hunts.map((h) => {
                      const mark = row.prey ? preyMarkLabel(h.prey, row.prey) : null;
                      const barWidth = barWidthFor(row, hunts, h);
                      return (
                        <td key={h.key} className="px-4 py-2.5 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={"font-mono " + toneFor(row, hunts, h)}>{row.render(h)}</span>
                            <DiffBadge row={row} hunts={hunts} h={h} />
                          </div>
                          {barWidth != null && (
                            <div className="mt-1.5 h-1 w-full max-w-[110px] overflow-hidden rounded-full bg-muted-foreground/15">
                              <div
                                className={"h-full rounded-full " + barToneFor(row, hunts, h)}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          )}
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
          <span className="font-semibold text-rubi-danger">vermelho</span> = pior · selo cinza/vermelho = diferença
          (valor e %) pra melhor da linha · barra = proporção em relação ao maior valor da linha · dourado = bônus de
          Prey.
        </div>
      </div>
    </div>
  );
}
