import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { fmtGold, fmtNum } from "@/lib/format";

export type RcPricePoint = { t: number; price: number };

const DAY = 86_400_000;
const fmtDay = (t: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(t));

/** Lazy-loaded (recharts é pesado). `currentPrice` desenha a linha "Agora" pra comparar com o histórico. */
export default function RcPriceChart({ data, currentPrice }: { data: RcPricePoint[]; currentPrice: number | null }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={[(min: number) => min - DAY, (max: number) => max + DAY]}
          tickFormatter={fmtDay}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          domain={[(min: number) => Math.floor(min * 0.97), (max: number) => Math.ceil(max * 1.03)]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={(v: number) => fmtGold(v)}
          width={56}
        />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
          labelFormatter={(t) => new Intl.DateTimeFormat("pt-BR").format(new Date(Number(t)))}
          formatter={(v) => [`${fmtNum(Number(v))} gold`, "1 RC"]}
        />
        {currentPrice != null && (
          <ReferenceLine
            y={currentPrice}
            stroke="var(--rubi-blue)"
            strokeDasharray="5 4"
            ifOverflow="extendDomain"
            label={{ value: "Agora", position: "insideTopRight", fill: "var(--rubi-blue)", fontSize: 11 }}
          />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke="var(--rubi-gold)"
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--rubi-gold)", stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
