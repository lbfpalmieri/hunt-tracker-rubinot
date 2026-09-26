import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtGold } from "@/lib/format";

export type BossRunPoint = { label: string; balance: number };

/**
 * Lazy-loaded (recharts é pesado). Uma barra por execução = lucro da rotação. Sem linha de
 * lucro/h: boss tem cooldown, o que importa é quanto cada rotação rende.
 */
export default function BossRunsChart({ data }: { data: BossRunPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
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
          formatter={(v) => [fmtGold(Number(v)), "Lucro da rotação"]}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Bar dataKey="balance" fill="var(--rubi-danger)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
