import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldAlert, Skull, Trophy, Sparkles, Swords, Target, type LucideIcon } from "lucide-react";
import { BountyBadge } from "@/components/BountyBadge";
import { GameIcon } from "@/components/GameIcon";
import { fmtGold, fmtNum } from "@/lib/format";
import { aggregateByHunt, filterByBonusInclusion, perHour, topKills, type CompareHunt } from "@/lib/compare";
import { preyMarkLabel, preyMarkTitle, PREY_BONUSES, type PreyBonus } from "@/lib/prey";
import { damageElementInfo } from "@/lib/damage-elements";
import { getMonsterWeaknesses } from "@/lib/monster-weakness.functions";
import { rankElementsAgainstHunt } from "@/lib/monster-weakness";

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

type Tone = "blue" | "gold" | "danger" | "success";
const TONE_CLASSES: Record<Tone, { bg: string; text: string }> = {
  blue: { bg: "bg-rubi-blue/15", text: "text-rubi-blue" },
  gold: { bg: "bg-rubi-gold/15", text: "text-rubi-gold" },
  danger: { bg: "bg-rubi-danger/15", text: "text-rubi-danger" },
  success: { bg: "bg-rubi-success/15", text: "text-rubi-success" },
};

/** Card de seção com selo de ícone colorido — dá peso visual ao título (antes era um texto cinza minúsculo, fácil de ignorar) e separa cada bloco de análise dos outros. */
function Section({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: LucideIcon;
  label: string;
  tone: Tone;
  children: ReactNode;
}) {
  const c = TONE_CLASSES[tone];
  return (
    <div className="card-surface p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
      {children}
    </div>
  );
}

/** Selo de destaque ("Fique de olho em X — Y%"), reaproveitado nas 3 seções de análise. */
function Highlight({ tone, icon, children }: { tone: Tone; icon: ReactNode; children: ReactNode }) {
  const border = tone === "success" ? "border-rubi-success/40 bg-rubi-success/10" : "border-rubi-danger/40 bg-rubi-danger/10";
  return (
    <div className={`mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${border}`}>
      <span className="flex-none">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

/** Pílula de "nome + valor" reaproveitada nas listas secundárias de cada seção. */
function StatPill({ icon, label, value, tone = "text-rubi-blue" }: { icon: ReactNode; label: string; value: ReactNode; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2 py-1">
      {icon}
      <span className="truncate">{label}</span>
      <span className={`font-mono font-semibold ${tone}`}>{value}</span>
    </span>
  );
}

/**
 * Dashboard da hunt: médias por hora de todas as sessões dela. Recebe as
 * sessões CRUAS (uma por sessão real, sem agregar) e agrega por conta
 * própria em cima do filtro de Bounty/Prey — assim os checkboxes ficam
 * dentro do próprio dashboard, funcionando igual em qualquer lugar que o
 * abra (Ranking, Comunidade, parte privada), sem duplicar a lógica.
 *
 * Por padrão os dois ficam DESMARCADOS: a hunt vem "limpa" (sem bônus),
 * que é o cenário mais comum de caça e o que o jogador provavelmente quer
 * comparar. Quem quiser ver o efeito de Prey/Bounty na média marca.
 */
export function HuntDashboardDialog({
  sessions,
  open,
  onOpenChange,
  topMonsters = 5,
}: {
  /** Todas as sessões (uma por sessão real) da MESMA hunt — o componente agrega. */
  sessions: CompareHunt[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topMonsters?: number;
}) {
  const [includeBounty, setIncludeBounty] = useState(false);
  const [includePrey, setIncludePrey] = useState(false);

  const filtered = useMemo(
    () => filterByBonusInclusion(sessions, includeBounty, includePrey),
    [sessions, includeBounty, includePrey],
  );
  const hunt = useMemo(() => aggregateByHunt(filtered)[0] ?? null, [filtered]);
  const huntName = sessions[0]?.huntName ?? "";
  const hasBonusSessions = sessions.some((s) => s.bounty || (s.prey && s.prey.length > 0));

  // % arredondando pra 0 é ruído visual (a "(Other)" que o próprio jogo
  // reporta pra fontes de dano residuais, criaturas quase irrelevantes) —
  // corta das listas secundárias sem afetar a conta do destaque principal.
  const damageTypesToShow = (hunt?.damageTypes ?? []).filter((t) => Math.round(t.pct) > 0);
  const damageSourcesToShow = (hunt?.damageSources ?? []).filter((s) => Math.round(s.pct) > 0);

  // Elemento mais forte contra os monstros da hunt — busca a resistência dos
  // monstros mais mortos na TibiaWiki. Só dispara quando o dashboard tem
  // kills pra consultar; staleTime longo porque resistência de monstro
  // praticamente não muda (só em update de balance do jogo oficial).
  const weaknessNames = useMemo(() => (hunt ? hunt.kills.slice(0, 8).map((k) => k.name) : []), [hunt]);
  const fetchWeaknesses = useServerFn(getMonsterWeaknesses);
  const { data: weaknessData, isLoading: loadingWeakness } = useQuery({
    queryKey: ["monster-weaknesses", weaknessNames.slice().sort().join("|")],
    queryFn: () => fetchWeaknesses({ data: { names: weaknessNames } }),
    enabled: weaknessNames.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const elementRanking = useMemo(
    () => (hunt && weaknessData ? rankElementsAgainstHunt(hunt.kills, weaknessData.weaknesses) : []),
    [hunt, weaknessData],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {sessions.length > 0 && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{huntName}</DialogTitle>
              <DialogDescription>
                {hunt ? (
                  <>
                    {hunt.charName} · {hunt.vocation} ·{" "}
                    {(hunt.sessionCount ?? 1) === 1 ? (
                      <>baseado em <strong className="text-foreground">1 sessão</strong></>
                    ) : (
                      <>média de <strong className="text-foreground">{hunt.sessionCount}</strong> sessões</>
                    )}{" "}
                    · projetado para 1 hora de caça
                  </>
                ) : (
                  "Nenhuma sessão com esse filtro"
                )}
              </DialogDescription>
            </DialogHeader>

            {hasBonusSessions && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs">
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={includeBounty}
                    onChange={(e) => setIncludeBounty(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--rubi-gold)]"
                  />
                  <Trophy className="h-3.5 w-3.5 text-rubi-gold" /> Incluir Bounty
                </label>
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={includePrey}
                    onChange={(e) => setIncludePrey(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--rubi-blue)]"
                  />
                  <Sparkles className="h-3.5 w-3.5 text-rubi-blue" /> Incluir Prey
                </label>
                <span className="text-[11px] text-muted-foreground/80">
                  Por padrão só entram sessões sem bônus na média.
                </span>
              </div>
            )}

            {!hunt ? (
              <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhuma sessão "limpa" dessa hunt ainda — marque Bounty e/ou Prey acima pra ver a média
                com esses bônus.
              </p>
            ) : (
              <div className="space-y-3">
                {(hunt.bounty || (hunt.prey && hunt.prey.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {hunt.bounty && <BountyBadge bounty={hunt.bounty} showXp />}
                    {hunt.prey && hunt.prey.length > 0 && (
                      <>
                        <span className="rounded-full border border-rubi-gold/50 bg-rubi-gold/10 px-2 py-0.5 text-[10px] font-semibold text-rubi-gold">
                          Prey em {hunt.preySessions ?? 0}/{hunt.sessionCount ?? 1} sessões
                        </span>
                        {/* Resumo por tipo de bônus — sem enumerar cada criatura, que numa hunt de
                            muitas sessões virava uma parede de selos repetidos e confusa. */}
                        {PREY_BONUSES.filter((b) => hunt.prey!.some((s) => s.bonus === b.value)).map((b) => (
                          <span
                            key={b.value}
                            title={b.hint}
                            className="rounded-full border border-rubi-blue/40 bg-rubi-blue/10 px-2 py-0.5 text-[10px] font-semibold text-rubi-blue"
                          >
                            {b.emoji} {b.label}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {HUNT_DASHBOARD_ROWS.map((row) => {
                    const v = row.value(hunt);
                    const mark = row.prey ? preyMarkLabel(hunt.prey, row.prey) : null;
                    return (
                      <div key={row.label} className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</div>
                        <div className="font-mono text-sm font-semibold text-foreground">{row.format(v)}</div>
                        {mark && (
                          <div
                            title={row.prey ? preyMarkTitle(hunt.prey, row.prey) : undefined}
                            className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wide text-rubi-gold"
                          >
                            {mark}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(damageTypesToShow.length > 0 || damageSourcesToShow.length > 0) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {damageTypesToShow.length > 0 && (
                      <Section icon={ShieldAlert} label="Dano recebido por elemento" tone="danger">
                        {(() => {
                          const top = damageTypesToShow[0];
                          const info = damageElementInfo(top.type);
                          return (
                            <Highlight tone="danger" icon={<span className="text-lg leading-none">{info.emoji}</span>}>
                              <strong className="text-foreground">Fique de olho em {info.label}</strong> —{" "}
                              {Math.round(top.pct)}% do dano recebido vem daí
                            </Highlight>
                          );
                        })()}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {damageTypesToShow.slice(1, 6).map((t) => {
                            const info = damageElementInfo(t.type);
                            return (
                              <StatPill
                                key={t.type}
                                icon={<span>{info.emoji}</span>}
                                label={info.label}
                                value={`${Math.round(t.pct)}%`}
                              />
                            );
                          })}
                        </div>
                      </Section>
                    )}

                    {damageSourcesToShow.length > 0 && (
                      <Section icon={Skull} label="Quem mais causa dano" tone="danger">
                        {(() => {
                          const top = damageSourcesToShow[0];
                          return (
                            <Highlight
                              tone="danger"
                              icon={<GameIcon name={top.name} size={20} fallback={<Skull className="h-4 w-4 flex-none text-rubi-danger" />} />}
                            >
                              <strong className="text-foreground">{top.name}</strong> é quem mais te machuca —{" "}
                              {Math.round(top.pct)}% do dano recebido
                            </Highlight>
                          );
                        })()}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {damageSourcesToShow.slice(1, 6).map((s) => (
                            <StatPill
                              key={s.name}
                              icon={<GameIcon name={s.name} size={16} className="flex-none" />}
                              label={s.name}
                              value={`${Math.round(s.pct)}%`}
                            />
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                )}

                {weaknessNames.length > 0 && (
                  <Section icon={Swords} label="Elemento mais forte contra a hunt" tone="success">
                    {loadingWeakness ? (
                      <div className="h-14 animate-pulse rounded-lg bg-muted/20" />
                    ) : elementRanking.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Não achei dados de resistência pra esses monstros na TibiaWiki.
                      </p>
                    ) : (
                      <>
                        {(() => {
                          const top = elementRanking[0];
                          const info = damageElementInfo(top.element);
                          return (
                            <Highlight tone="success" icon={<span className="text-lg leading-none">{info.emoji}</span>}>
                              <strong className="text-foreground">{info.label}</strong> é o mais eficaz contra
                              os monstros dessa hunt — dano médio de {Math.round(top.avgMod)}%
                            </Highlight>
                          );
                        })()}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {elementRanking.slice(1, 6).map((r) => {
                            const info = damageElementInfo(r.element);
                            return (
                              <StatPill
                                key={r.element}
                                icon={<span>{info.emoji}</span>}
                                label={info.label}
                                value={`${Math.round(r.avgMod)}%`}
                              />
                            );
                          })}
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                          Baseado nos monstros mais mortos, com dados da TibiaWiki (Tibia oficial) — o RubinOT
                          pode ter valores diferentes.
                        </p>
                      </>
                    )}
                  </Section>
                )}

                <Section icon={Target} label={`Top ${topMonsters} monstros/h`} tone="gold">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {topKills(hunt, topMonsters).map((k) => (
                      <StatPill
                        key={k.name}
                        icon={<GameIcon name={k.name} size={16} className="flex-none" />}
                        label={k.name}
                        value={`×${fmtNum(perHour(k.count, hunt.durationSec) ?? 0)}`}
                        tone="text-rubi-gold"
                      />
                    ))}
                    {topKills(hunt, topMonsters).length === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </Section>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
