/**
 * Utilidades compartilhadas entre CompareTable e SessionMiscCompare — os
 * dois precisam da mesma cor de posição (#1..#4) e do mesmo arredondamento
 * de percentual pra manter a identificação de "qual hunt é qual" consistente
 * em toda a tela de comparativo.
 */

/**
 * Cores por posição (#1..#4) — usadas em todo canto que identifica uma hunt
 * (cabeçalho da tabela, cards do hero, destaque de maior diferença, Misc
 * Data), pra ajudar a diferenciar hunts com o mesmo nome sem depender só do
 * texto — comum quando se compara sessões diferentes da mesma spot.
 */
const POSITION_STYLES = [
  "border-rubi-blue/50 bg-rubi-blue/15 text-rubi-blue",
  "border-rubi-gold/50 bg-rubi-gold/15 text-rubi-gold",
  "border-emerald-400/50 bg-emerald-400/15 text-emerald-400",
  "border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-400",
];

export function PositionBadge({ index, className = "" }: { index: number; className?: string }) {
  return (
    <span
      className={
        "inline-flex h-6 min-w-6 flex-none items-center justify-center rounded-md border px-1.5 font-mono text-xs font-bold " +
        POSITION_STYLES[index % POSITION_STYLES.length] +
        " " +
        className
      }
    >
      #{index + 1}
    </span>
  );
}

export const fmtPct = (pct: number) => (pct >= 10 ? Math.round(pct) : Number(pct.toFixed(1))).toLocaleString("pt-BR");
