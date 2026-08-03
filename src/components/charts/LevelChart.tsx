import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { fmtNum } from "@/lib/format";

export type LevelPoint = { date: string; level: number };

/** Lazy-loaded so the page paints before recharts is downloaded. */
export default function LevelChart({ data }: { data: LevelPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={(v: number) => fmtNum(v)}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
          formatter={(v) => [fmtNum(Number(v)), "Nível"]}
        />
        <Line
          type="monotone"
          dataKey="level"
          stroke="var(--rubi-success)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--rubi-success)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
