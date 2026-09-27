import { useMemo } from "react";
import { Crown, Handshake, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { fmtDuration, fmtGold } from "@/lib/format";
import type { HuntSession } from "@/lib/store";

interface Partner {
  name: string;
  sessions: number;
  sec: number;
  balance: number;
}

/**
 * Resumo do Modo Grupo no Dashboard: tamanho médio da party, quantas vezes foi líder e com quem
 * mais caça (nomes do Party Hunt Analyser — só aparecem pro próprio usuário, nunca na Comunidade).
 */
export function PartyOverview({ sessions }: { sessions: HuntSession[] }) {
  const stats = useMemo(() => {
    const party = sessions.filter((s) => s.party);
    const avgSize = party.length
      ? party.reduce((a, s) => a + (s.party?.size ?? 0), 0) / party.length
      : 0;
    const withMembers = party.filter((s) => s.party?.members?.length && s.party.self);
    const led = withMembers.filter((s) =>
      s.party?.members?.some((m) => m.name === s.party?.self && m.leader),
    ).length;
    const partners = new Map<string, Partner>();
    for (const s of withMembers) {
      for (const m of s.party?.members ?? []) {
        if (m.name === s.party?.self) continue;
        const key = m.name.toLowerCase();
        const p = partners.get(key) ?? { name: m.name, sessions: 0, sec: 0, balance: 0 };
        p.sessions += 1;
        p.sec += s.hunting.durationSec;
        p.balance += s.hunting.balance;
        partners.set(key, p);
      }
    }
    const top = [...partners.values()]
      .sort((a, b) => b.sessions - a.sessions || b.sec - a.sec)
      .slice(0, 6);
    return { count: party.length, avgSize, withMembers: withMembers.length, led, top };
  }, [sessions]);

  if (stats.count === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-rubi-blue">
        <Users className="h-3.5 w-3.5" /> Seu grupo
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-1 lg:grid-cols-1">
          <StatCard
            label="Tamanho médio da party"
            value={stats.avgSize.toFixed(1).replace(".", ",")}
            hint={`${stats.count} hunt${stats.count === 1 ? "" : "s"} em grupo`}
            icon={Users}
            accent="blue"
          />
          <StatCard
            label="Você foi líder"
            value={stats.withMembers ? `${stats.led}/${stats.withMembers}` : "—"}
            hint={
              stats.withMembers
                ? "sessões com Party Hunt Analyser"
                : "cole o Party Hunt Analyser pra ver"
            }
            icon={Crown}
            accent="gold"
          />
        </div>
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Handshake className="h-4 w-4 text-rubi-blue" /> Com quem você mais caça
          </h2>
          {stats.top.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Cole o <b>Party Hunt Analyser</b> ao salvar a sessão pra ver seus parceiros de hunt e
              a divisão do loot.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border/50">
              {stats.top.map((p) => (
                <li key={p.name} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-rubi-blue-soft font-display text-xs font-bold text-rubi-blue">
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.sessions} hunt{p.sessions === 1 ? "" : "s"} juntos · {fmtDuration(p.sec)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span
                      className={
                        "block font-semibold " +
                        (p.balance >= 0 ? "text-rubi-success" : "text-rubi-danger")
                      }
                    >
                      {fmtGold(Math.round(p.balance / (p.sec / 3600 || 1)))}/h
                    </span>
                    <span className="block text-[10px] text-muted-foreground">sua parte</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
