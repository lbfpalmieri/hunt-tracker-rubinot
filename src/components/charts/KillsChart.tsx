import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, type YAxisTickContentProps,
} from "recharts";
import { fmtNum } from "@/lib/format";
import { gameIconUrl } from "@/lib/game-icon";

/** `perHour` é opcional — só existe quando o chamador sabe a duração da sessão. */
export type KillPoint = { name: string; count: number; perHour?: number };

/**
 * Label do eixo Y com o sprite do monstro (puxado da TibiaWiki, ver
 * game-icon.ts) na frente do nome. Só tenta .gif — se a imagem não existir
 * pra esse nome, o <image> do SVG simplesmente não desenha nada (sem ícone
 * quebrado), o texto continua normal.
 */
function MonsterTick({ x, y, payload }: YAxisTickContentProps) {
  const name = String(payload?.value ?? "");
  const iconUrl = gameIconUrl(name);
  return (
    <g transform={`translate(${x},${y})`}>
      {iconUrl && (
        <image href={iconUrl} x={-152} y={-12} width={24} height={24} style={{ imageRendering: "pixelated" }} />
      )}
      <text x={-122} y={4} textAnchor="start" fontSize={11} fill="var(--muted-foreground)">
        {name}
      </text>
    </g>
  );
}

/** Lazy-loaded so the session detail paints before recharts is downloaded. */
export default function KillsChart({ data }: { data: KillPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <YAxis dataKey="name" type="category" width={160} tick={MonsterTick} />
        <Tooltip
          cursor={{ fill: "var(--rubi-blue-soft)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(value, _name, item) => {
            const perHour = (item?.payload as KillPoint | undefined)?.perHour;
            const count = fmtNum(Number(value));
            return [perHour != null ? `${count} (${fmtNum(perHour)}/h)` : count, "Kills"];
          }}
        />
        <Bar dataKey="count" fill="var(--rubi-blue)" radius={[0, 6, 6, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
