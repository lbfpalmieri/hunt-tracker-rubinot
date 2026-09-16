import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";
import { BountyBadge } from "@/components/BountyBadge";
import { PreyBadge } from "@/components/PreyBadge";
import { GameIcon } from "@/components/GameIcon";
import { fmtGold, fmtNum } from "@/lib/format";
import { perHour, topKills, type CompareHunt } from "@/lib/compare";
import { preyMarkLabel, preyMarkTitle, type PreyBonus } from "@/lib/prey";
import { damageElementInfo } from "@/lib/damage-elements";

interface Row {
  label: string;
  value: (h: CompareHunt) => number | null;
  format: (v: number | null) => string;
  prey?: PreyBonus;
}

/**
 * Métricas do dashboard da hunt — a mesma "média por hora" usada no Ranking,
 * calculada em cima da agregação de compare.ts (aggregateByHunt). Fica aqui
 * (em vez de duplicada) pra Ranking, Comunidade e a parte privada mostrarem
 * exatamente os mesmos números pra mesma hunt.
 */
export const HUNT_DASHBOARD_ROWS: Row[] = [
  { label: "Raw XP/h", value: (h) => perHour(h.rawXpHunt, h.durationSec), format: (v) => (v == null ? "—" : fmtNum(v)), prey: "xp" },
  { label: "XP com bônus/h", value: (h) => perHour(h.xpGain, h.durationSec), format: (v) => fmtNum(v ?? 0), prey: "xp" },
  { label: "Lucro/h", value: (h) => perHour(h.balance, h.durationSec), format: (v) => fmtGold(v ?? 0), prey: "loot" },
  { label: "Loot/h", value: (h) => perHour(h.loot, h.durationSec), format: (v) => fmtGold(v ?? 0), prey: "loot" },
  { label: "Supplies/h", value: (h) => perHour(h.supplies, h.durationSec), format: (v) => fmtGold(v ?? 0) },
  { label: "Kills/h", value: (h) => perHour(h.killsTotal, h.durationSec), format: (v) => fmtNum(v ?? 0) },
  { label: "Dano causado/h", value: (h) => perHour(h.damageDealt, h.durationSec), format: (v) => fmtNum(v ?? 0), prey: "damage" },
  { label: "Cura/h", value: (h) => perHour(h.healing, h.durationSec), format: (v) => fmtNum(v ?? 0) },
  { label: "Dano recebido/h", value: (h) => perHour(h.damageReceived, h.durationSec), format: (v) => (v == null ? "—" : fmtNum(v)), prey: "defense" },
];

/**
 * Dashboard da hunt: médias por hora de todas as sessões dela (compare.ts já
 * faz a agregação — aqui é só a apresentação). Usado pelo Ranking, pela
 * Comunidade e pela parte privada, sempre com o mesmo componente pra não
 * ficarem diferentes entre si.
 */
export function HuntDashboardDialog({
  hunt,
  open,
  onOpenChange,
  topMonsters = 5,
}: {
  hunt: CompareHunt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topMonsters?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {hunt && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{hunt.huntName}</DialogTitle>
              <DialogDescription>
                {hunt.charName} · {hunt.vocation} ·{" "}
                {(hunt.sessionCount ?? 1) === 1 ? (
                  <>baseado em <strong className="text-foreground">1 sessão</strong></>
                ) : (
                  <>média de <strong className="text-foreground">{hunt.sessionCount}</strong> sessões</>
                )}{" "}
                · projetado para 1 hora de caça
              </DialogDescription>
            </DialogHeader>

            {(hunt.bounty || hunt.prey) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {hunt.bounty && <BountyBadge bounty={hunt.bounty} showXp />}
                {hunt.prey && <PreyBadge prey={hunt.prey} detailed />}
                {(hunt.preySessions ?? 0) > 0 && (
                  <span className="rounded-full border border-rubi-gold/50 bg-rubi-gold/10 px-2 py-0.5 text-[10px] font-semibold text-rubi-gold">
                    Prey em {hunt.preySessions}/{hunt.sessionCount} sessões
                  </span>
                )}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {HUNT_DASHBOARD_ROWS.map((row) => {
                const v = row.value(hunt);
                const mark = row.prey ? preyMarkLabel(hunt.prey, row.prey) : null;
                return (
                  <div key={row.label}>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                    <dd className="font-mono font-semibold">{row.format(v)}</dd>
                    {mark && (
                      <div
                        title={row.prey ? preyMarkTitle(hunt.prey, row.prey) : undefined}
                        className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-gold"
                      >
                        {mark}
                      </div>
                    )}
                  </div>
                );
              })}
            </dl>

            {hunt.damageTypes.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5" /> Dano recebido por elemento
                </div>
                {(() => {
                  const top = hunt.damageTypes[0];
                  const info = damageElementInfo(top.type);
                  return (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 px-3 py-2 text-sm">
                      <span className="text-lg leading-none">{info.emoji}</span>
                      <span>
                        <strong className="text-foreground">Fique de olho em {info.label}</strong> —{" "}
                        {Math.round(top.pct)}% do dano recebido nessa hunt vem daí
                      </span>
                    </div>
                  );
                })()}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {hunt.damageTypes.slice(0, 6).map((t) => {
                    const info = damageElementInfo(t.type);
                    return (
                      <span
                        key={t.type}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2 py-1"
                      >
                        <span>{info.emoji}</span> {info.label}{" "}
                        <span className="font-mono font-semibold text-rubi-blue">{Math.round(t.pct)}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                Top {topMonsters} monstros/h
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {topKills(hunt, topMonsters).map((k) => (
                  <span
                    key={k.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1"
                  >
                    <GameIcon name={k.name} size={16} className="flex-none" />
                    {k.name}{" "}
                    <span className="font-mono font-semibold text-rubi-gold">
                      ×{fmtNum(perHour(k.count, hunt.durationSec) ?? 0)}
                    </span>
                  </span>
                ))}
                {topKills(hunt, topMonsters).length === 0 && <span className="text-muted-foreground">—</span>}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
