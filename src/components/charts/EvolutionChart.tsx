import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { fmtGold } from "@/lib/format";

export type EvolutionPoint = { i: number; "Raw XP/h": number; "Lucro/h": number };

/** Lazy-loaded so the dashboard paints before recharts is downloaded. */
export default function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gXp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--rubi-blue)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--rubi-blue)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--rubi-gold)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--rubi-gold)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="i" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis yAxisId="l" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => fmtGold(v)} />
        <YAxis yAxisId="r" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => fmtGold(v)} />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
          formatter={(v) => fmtGold(Number(v))}
        />
        <Area yAxisId="l" type="monotone" dataKey="Raw XP/h" stroke="var(--rubi-blue)" strokeWidth={2} fill="url(#gXp)" isAnimationActive={false} />
        <Area yAxisId="r" type="monotone" dataKey="Lucro/h" stroke="var(--rubi-gold)" strokeWidth={2} fill="url(#gGold)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
