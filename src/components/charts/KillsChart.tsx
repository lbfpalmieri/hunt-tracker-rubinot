import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, type YAxisTickContentProps,
} from "recharts";
import { fmtNum } from "@/lib/format";
import { gameIconUrls } from "@/lib/game-icon";

/** `perHour` é opcional — só existe quando o chamador sabe a duração da sessão. */
export type KillPoint = { name: string; count: number; perHour?: number };

/**
 * Sprite do monstro no eixo Y (TibiaWiki, ver game-icon.ts). Tenta as URLs de gameIconUrls em
 * ordem e passa pra próxima quando a imagem não carrega — a wiki não segue uma grafia só (o jogo
 * escreve "Cloak of Terror", o arquivo é "Cloak_Of_Terror.gif"). Se nenhuma existir, não desenha
 * nada: um <image> de SVG com arquivo inexistente vira o ícone de imagem quebrada no Chrome.
 *
 * É um componente à parte porque o recharts chama o `tick` como função comum, e hook (useState)
 * lá dentro quebra. As falhas ficam guardadas junto com o nome: trocou o nome, recomeça do 0.
 */
export function TickIcon({ name }: { name: string }) {
  const [failed, setFailed] = useState({ name, count: 0 });
  const attempt = failed.name === name ? failed.count : 0;
  const url = gameIconUrls(name)[attempt];
  if (!url) return null;
  return (
    <image
      href={url}
      x={-156}
      y={-14}
      width={28}
      height={28}
      style={{ imageRendering: "pixelated" }}
      onError={() => setFailed({ name, count: attempt + 1 })}
    />
  );
}

/** Label do eixo Y: sprite do monstro (TickIcon) na frente do nome. */
function MonsterTick({ x, y, payload }: YAxisTickContentProps) {
  const name = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <TickIcon name={name} />
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
