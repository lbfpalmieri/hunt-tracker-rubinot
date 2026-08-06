import { FlaskConical } from "lucide-react";
import type { HuntSession } from "@/lib/store";
import type { MiscData } from "@/lib/parser";
import { fmtNum } from "@/lib/format";

interface Col {
  key: string;
  label: string;
  sub: string;
}

interface MiscRow {
  name: string;
  values: number[];
}

function buildRows(sessions: (HuntSession | undefined)[], pick: (m: MiscData) => Record<string, number>): MiscRow[] {
  const names = new Set<string>();
  for (const s of sessions) {
    if (!s?.misc) continue;
    for (const k of Object.keys(pick(s.misc))) names.add(k);
  }
  return Array.from(names)
    .map((name) => ({
      name,
      values: sessions.map((s) => (s?.misc ? Number(pick(s.misc)[name] ?? 0) : 0)),
    }))
    .sort((a, b) => Math.max(...b.values) - Math.max(...a.values));
}

function MiscSection({ title, rows, cols }: { title: string; rows: MiscRow[]; cols: Col[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left text-xs uppercase tracking-wider text-muted-foreground">
              {title}
            </th>
            {cols.map((c) => (
              <th key={c.key} className="px-4 py-2.5 text-left align-top">
                <div className="truncate text-xs font-semibold" title={c.label}>{c.label}</div>
                <div className="text-[11px] font-normal text-muted-foreground">{c.sub}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const max = Math.max(...row.values);
            return (
              <tr key={row.name} className="border-b border-border/40 last:border-0">
                <th className="sticky left-0 z-10 bg-card px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  {row.name}
                </th>
                {row.values.map((v, i) => (
                  <td key={cols[i].key} className="px-4 py-2 align-top">
                    <span className={"font-mono " + (v > 0 && v === max ? "font-semibold text-rubi-gold" : "text-muted-foreground")}>
                      {v > 0 ? fmtNum(v) : "—"}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Comparativo do Misc Data (charm/imbuement/item upgrade) sessão a sessão.
 * Exclusivo do comparativo de sessões — não faz sentido numa hunt agregada
 * (médias de charms diferentes usados em runs diferentes viram ruído), então
 * este componente trabalha direto com HuntSession em vez de CompareHunt.
 */
export function SessionMiscCompare({
  sessions,
  cols,
}: {
  sessions: (HuntSession | undefined)[];
  cols: Col[];
}) {
  const hasAnyMisc = sessions.some((s) => s?.misc);
  const charmRows = buildRows(sessions, (m) => m.charm);
  const imbuementRows = buildRows(sessions, (m) => m.imbuement);
  const itemUpgradeRows = buildRows(sessions, (m) => m.itemUpgrade);

  if (!hasAnyMisc || (charmRows.length === 0 && imbuementRows.length === 0 && itemUpgradeRows.length === 0)) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <FlaskConical className="h-5 w-5 text-rubi-blue" /> Misc Data — ajuste fino
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Quanto cada charm, imbuement e item upgrade contribuiu em cada sessão — exclusivo do comparativo de
          sessões, útil pra identificar o que fez diferença entre um teste e outro.{" "}
          <span className="font-semibold text-rubi-gold">Dourado</span> marca o maior valor da linha.
        </p>
      </div>
      <MiscSection title="Charm" rows={charmRows} cols={cols} />
      <MiscSection title="Imbuement" rows={imbuementRows} cols={cols} />
      <MiscSection title="Item Upgrade" rows={itemUpgradeRows} cols={cols} />
    </div>
  );
}
