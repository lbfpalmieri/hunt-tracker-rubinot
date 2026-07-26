import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmtNum } from "@/lib/format";

export type DamageSlice = { type: string; value: number };

/** Lazy-loaded so the session detail paints before recharts is downloaded. */
export default function DamagePie({ data, colors }: { data: DamageSlice[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="type"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v) => fmtNum(Number(v))}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
