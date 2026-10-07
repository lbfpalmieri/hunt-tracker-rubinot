import { useEffect, useId, useMemo, useState } from "react";
import {
  WHEEL_DOMAINS,
  WHEEL_REVELATION_BY_DOMAIN,
  WHEEL_SLICES,
  slicePerk,
  slicePerkIcon,
  type DedicationKind,
  type WheelDomain,
} from "@/data/wheel-data";
import { gameIconUrls } from "@/lib/game-icon";
import { availableSlices, gemName, summarizeWheel, type WheelBuild } from "@/lib/wheel";

/** Cor de cada domínio (mesma ideia da roda do jogo: verde, vermelho, verde-água e roxo). */
export const DOMAIN_COLOR: Record<WheelDomain, string> = {
  TL: "#5cc93b",
  TR: "#e5484d",
  BL: "#1fb59a",
  BR: "#a855f7",
};

export const DEDICATION_COLOR: Record<Exclude<DedicationKind, "hpmana">, string> = {
  hp: "#ef4444",
  mana: "#3b82f6",
  cap: "#d4a017",
  mit: "#a3acb9",
};

export type WheelSelection =
  | { type: "slice"; i: number }
  | { type: "domain"; d: WheelDomain }
  | { type: "gem"; d: WheelDomain }
  | null;

const C = 300;
/** Raio interno/externo de cada anel (viewBox 600). */
const RING: [number, number][] = [
  [0, 56],
  [58, 108],
  [110, 160],
  [162, 212],
  [214, 264],
];
const RAD = Math.PI / 180;
const pt = (r: number, deg: number) => [C + Math.cos(deg * RAD) * r, C + Math.sin(deg * RAD) * r];

function sector(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x1, y1] = pt(r1, a0);
  const [x2, y2] = pt(r1, a1);
  if (r0 <= 0) return `M${C},${C} L${x1},${y1} A${r1},${r1} 0 ${large} 1 ${x2},${y2} Z`;
  const [x3, y3] = pt(r0, a1);
  const [x4, y4] = pt(r0, a0);
  return `M${x1},${y1} A${r1},${r1} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 ${large} 0 ${x4},${y4} Z`;
}

/** Centro do ícone de cada fatia (no centro do pedaço de pizza, ou na metade do anel). */
function sliceCenter(ring: number, a0: number, a1: number) {
  const [r0, r1] = RING[ring];
  const r = ring === 0 ? 31 : (r0 + r1) / 2;
  return pt(r, (a0 + a1) / 2);
}

export const MEDALLION: Record<WheelDomain, [number, number]> = {
  TL: [62, 62],
  TR: [538, 62],
  BL: [62, 538],
  BR: [538, 538],
};
export const SOCKET: Record<WheelDomain, [number, number]> = {
  TL: [146, 30],
  TR: [454, 30],
  BL: [146, 570],
  BR: [454, 570],
};

/** <image> do SVG com a mesma cadeia de URLs do GameIcon (.gif → .png → nome exato). */
function SvgIcon({
  name,
  x,
  y,
  size,
  dim = false,
}: {
  name: string;
  x: number;
  y: number;
  size: number;
  dim?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setAttempt(0), [name]);
  const url = gameIconUrls(name)[attempt];
  if (!url) return null;
  return (
    <image
      href={url}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      style={{
        imageRendering: "pixelated",
        filter: dim ? "grayscale(0.85) brightness(0.9)" : undefined,
        opacity: dim ? 0.6 : 1,
      }}
      onError={() => setAttempt((a) => a + 1)}
      pointerEvents="none"
    />
  );
}

function DedicationDot({ kind, x, y }: { kind: DedicationKind; x: number; y: number }) {
  if (kind === "hpmana")
    return (
      <g pointerEvents="none">
        <path d={`M${x},${y - 6} A6,6 0 0 0 ${x},${y + 6} Z`} fill={DEDICATION_COLOR.hp} />
        <path d={`M${x},${y - 6} A6,6 0 0 1 ${x},${y + 6} Z`} fill={DEDICATION_COLOR.mana} />
        <circle cx={x} cy={y} r={6} fill="none" stroke="#0b0d12" strokeWidth={1.5} />
      </g>
    );
  return (
    <circle
      cx={x}
      cy={y}
      r={6}
      fill={DEDICATION_COLOR[kind]}
      stroke="#0b0d12"
      strokeWidth={1.5}
      pointerEvents="none"
    />
  );
}

/**
 * A roda desenhada em SVG (layout do jogo: 4 domínios × 9 fatias, revelações nos cantos e o encaixe da
 * gema ao lado). Ícones da TibiaWiki BR. Sem `onSelect` = só leitura (cards da sessão/comparação).
 */
export function WheelOfDestiny({
  build,
  selected = null,
  onSelect,
  onToggleSlice,
  className,
}: {
  build: WheelBuild;
  selected?: WheelSelection;
  onSelect?: (s: WheelSelection) => void;
  /** Clique (esquerdo ou direito) numa fatia: enche / esvazia. */
  onToggleSlice?: (i: number) => void;
  className?: string;
}) {
  const interactive = !!onSelect;
  const avail = useMemo(() => availableSlices(build.points), [build.points]);
  const summary = useMemo(() => summarizeWheel(build), [build]);
  const [hover, setHover] = useState<number | null>(null);
  // Igual ao jogo: clique (esquerdo OU direito) enche a fatia; clicar de novo esvazia. O painel do lado
  // continua pra ajuste fino (barra, +1/+10).
  const clickSlice = (i: number) => {
    onSelect?.({ type: "slice", i });
    onToggleSlice?.(i);
  };
  const gid = `w${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      role="img"
      aria-label="Wheel of Destiny"
      // touch-action: manipulation = toque sem atraso nem zoom de toque duplo.
      onContextMenu={interactive ? (e) => e.preventDefault() : undefined}
      style={{
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <defs>
        <radialGradient id={`${gid}-bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d212b" />
          <stop offset="100%" stopColor="#0d0f14" />
        </radialGradient>
        <linearGradient id={`${gid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6b5520" />
          <stop offset="50%" stopColor="#3a2e12" />
          <stop offset="100%" stopColor="#5c4819" />
        </linearGradient>
      </defs>

      {/* Moldura dourada e fundo */}
      <circle cx={C} cy={C} r={274} fill={`url(#${gid}-gold)`} />
      <circle cx={C} cy={C} r={268} fill={`url(#${gid}-bg)`} stroke="#c9a34a" strokeWidth={1.5} />

      {/* Placas douradas entre os domínios (anéis de fora) */}
      {[165, 255, 345, 75].map((a) => (
        <g key={a} pointerEvents="none">
          <path
            d={sector(RING[3][0], RING[4][1], a, a + 30)}
            fill={`url(#${gid}-gold)`}
            stroke="#c9a34a"
            strokeOpacity={0.6}
          />
          {(() => {
            const [x, y] = pt(213, a + 15);
            return (
              <path
                d={`M${x},${y - 14} L${x + 9},${y} L${x},${y + 14} L${x - 9},${y} Z`}
                fill="#c9a34a"
                opacity={0.55}
              />
            );
          })()}
        </g>
      ))}

      {/* Fatias */}
      {WHEEL_SLICES.map((s) => {
        const [r0, r1] = RING[s.ring];
        const p = build.points[s.i] ?? 0;
        const pct = p / s.max;
        const full = p === s.max;
        const open = avail.has(s.i);
        const color = DOMAIN_COLOR[s.domain];
        const isSel = selected?.type === "slice" && selected.i === s.i;
        const isHover = interactive && hover === s.i;
        const [cx, cy] = sliceCenter(s.ring, s.a0, s.a1);
        const iconSize = s.ring === 0 ? 30 : 34;
        const fillTo = r0 + (r1 - r0) * pct;
        const perk = slicePerk(build.voc, s);
        return (
          <g
            key={s.id}
            onClick={interactive ? () => clickSlice(s.i) : undefined}
            onContextMenu={
              interactive
                ? (e) => {
                    e.preventDefault();
                    clickSlice(s.i);
                  }
                : undefined
            }
            // Só mouse: no toque o "hover" ficava preso na fatia.
            onPointerEnter={
              interactive ? (e) => e.pointerType === "mouse" && setHover(s.i) : undefined
            }
            onPointerLeave={interactive ? () => setHover(null) : undefined}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            <title>{`${perk} — ${p}/${s.max}${open || p ? "" : " (bloqueada)"}`}</title>
            <path
              d={sector(r0, r1, s.a0, s.a1)}
              fill={open ? "#1b2030" : "#11141b"}
              stroke="#2d3446"
              strokeWidth={1.5}
            />
            {p > 0 && (
              <path
                d={sector(r0, Math.max(fillTo, r0 + 2), s.a0, s.a1)}
                fill={color}
                fillOpacity={full ? 0.5 : 0.32}
                pointerEvents="none"
              />
            )}
            {full && (
              <path
                d={sector(r0 + 1.5, r1 - 1.5, s.a0 + 0.6, s.a1 - 0.6)}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                pointerEvents="none"
              />
            )}
            {open && !p && interactive && (
              <path
                d={sector(r0 + 2, r1 - 2, s.a0 + 0.8, s.a1 - 0.8)}
                fill="none"
                stroke={color}
                strokeOpacity={0.45}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                pointerEvents="none"
              />
            )}
            {(isHover || isSel) && (
              <path
                d={sector(r0, r1, s.a0, s.a1)}
                fill="#ffffff"
                fillOpacity={isSel ? 0.1 : 0.06}
                stroke={isSel ? "#ffffff" : "none"}
                strokeWidth={2.5}
                pointerEvents="none"
              />
            )}
            <SvgIcon
              name={slicePerkIcon(build.voc, s)}
              x={cx}
              y={cy - 3}
              size={iconSize}
              dim={!full && !(open && interactive)}
            />
            <DedicationDot
              kind={s.dedication}
              x={cx + iconSize / 2 - 2}
              y={cy + iconSize / 2 - 6}
            />
          </g>
        );
      })}

      {/* Revelações (cantos) e encaixe das gemas */}
      {WHEEL_DOMAINS.map((d) => {
        const dom = summary.domains.find((x) => x.domain === d)!;
        const [mx, my] = MEDALLION[d];
        const [gx, gy] = SOCKET[d];
        const color = DOMAIN_COLOR[d];
        const prog = dom.revelationPoints / 1000;
        const R = 50;
        const circ = 2 * Math.PI * R;
        const isSel = selected?.type === "domain" && selected.d === d;
        const gemSel = selected?.type === "gem" && selected.d === d;
        const gem = gemName(build.voc, dom.gem);
        const revelation = WHEEL_REVELATION_BY_DOMAIN[build.voc][d];
        return (
          <g key={d}>
            <g
              onClick={interactive ? () => onSelect?.({ type: "domain", d }) : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              <title>{`${revelation} — ${dom.stage ? `estágio ${dom.stage}` : "bloqueada"} (${dom.revelationPoints}/1000)`}</title>
              <circle cx={mx} cy={my} r={R + 6} fill="#0b0d12" stroke="#c9a34a" strokeWidth={2} />
              <circle cx={mx} cy={my} r={R} fill="none" stroke="#2d3446" strokeWidth={6} />
              {prog > 0 && (
                <circle
                  cx={mx}
                  cy={my}
                  r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth={6}
                  strokeDasharray={`${circ * prog} ${circ}`}
                  transform={`rotate(-90 ${mx} ${my})`}
                  strokeLinecap="round"
                />
              )}
              {[0.25, 0.5].map((t) => {
                const [tx, ty] = [
                  mx + Math.cos((t * 360 - 90) * RAD) * R,
                  my + Math.sin((t * 360 - 90) * RAD) * R,
                ];
                return <circle key={t} cx={tx} cy={ty} r={3.5} fill="#c9a34a" />;
              })}
              <circle
                cx={mx}
                cy={my}
                r={R - 8}
                fill={dom.stage ? color : "#151922"}
                fillOpacity={dom.stage ? 0.22 : 1}
                stroke={isSel ? "#fff" : "none"}
                strokeWidth={2.5}
              />
              <SvgIcon name={revelation} x={mx} y={my - 2} size={44} dim={!dom.stage} />
              {dom.stage > 0 && (
                <g pointerEvents="none">
                  <rect x={mx - 15} y={my + 22} width={30} height={17} rx={4} fill="#c9a34a" />
                  <text
                    x={mx}
                    y={my + 35}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={800}
                    fill="#0b0d12"
                    fontFamily="Cinzel, serif"
                  >
                    {["", "I", "II", "III"][dom.stage]}
                  </text>
                </g>
              )}
            </g>
            <g
              onClick={interactive ? () => onSelect?.({ type: "gem", d }) : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              <title>
                {gem ? `${gem} (${dom.activeMods}/${dom.gemQuality} mods ativos)` : "Sem gema"}
              </title>
              <circle
                cx={gx}
                cy={gy}
                r={22}
                fill="#0b0d12"
                stroke={gemSel ? "#fff" : dom.vessels ? color : "#4b5262"}
                strokeWidth={gemSel ? 2.5 : 2}
                strokeDasharray={gem ? undefined : "4 3"}
              />
              {gem ? (
                <SvgIcon name={gem} x={gx} y={gy} size={32} />
              ) : (
                interactive && (
                  <text
                    x={gx}
                    y={gy + 7}
                    textAnchor="middle"
                    fontSize={20}
                    fill="#6b7385"
                    pointerEvents="none"
                  >
                    +
                  </text>
                )
              )}
              {[0, 1, 2].map((k) => (
                <circle
                  key={k}
                  cx={gx - 10 + k * 10}
                  cy={gy + (gy < C ? 31 : -31)}
                  r={3.5}
                  fill={k < dom.vessels ? color : "#2d3446"}
                  pointerEvents="none"
                />
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
