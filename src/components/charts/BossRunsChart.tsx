import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtGold } from "@/lib/format";

export type BossRunPoint = { label: string; balance: number; perHour: number };

/** Lazy-loaded (recharts é pesado). Barras = lucro de cada execução; linha = lucro/h. */
export default function BossRunsChart({
  data,
  huntPerHour,
}: {
  data: BossRunPoint[];
  huntPerHour: number | null;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={(v: number) => fmtGold(v)}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v, name) => [
            fmtGold(Number(v)),
            name === "balance" ? "Lucro da rotação" : "Lucro/h",
          ]}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        {huntPerHour != null && (
          <ReferenceLine
            y={huntPerHour}
            stroke="var(--rubi-blue)"
            strokeDasharray="4 4"
            label={{
              value: "sua média/h nas hunts",
              fill: "var(--rubi-blue)",
              fontSize: 10,
              position: "insideTopLeft",
            }}
          />
        )}
        <Bar dataKey="balance" fill="var(--rubi-danger)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Line dataKey="perHour" stroke="var(--rubi-gold)" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
