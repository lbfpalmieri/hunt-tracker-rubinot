import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Swords, Gift, Repeat, Target } from "lucide-react";
import { fmtNum } from "@/lib/format";
import { getMonsterWeaknesses } from "@/lib/monster-weakness.functions";
import { rankElementsAgainstHunt } from "@/lib/monster-weakness";
import { damageElementInfo } from "@/lib/damage-elements";
import type { LinkedTaskEntry, LinkedTaskRoom } from "@/lib/linked-tasks.functions";

interface Props {
  room: LinkedTaskRoom | null;
  task: LinkedTaskEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkedTaskDialog({ room, task, open, onOpenChange }: Props) {
  const fetchWeaknesses = useServerFn(getMonsterWeaknesses);
  // Cap em 8 (mesmo limite do HuntDashboardDialog) — algumas tasks (ex. Warzone) têm 11 criaturas,
  // e não vale a pena disparar tantas requisições paralelas pra TibiaWiki de uma vez.
  const creatureNames = useMemo(() => task?.creatures.slice(0, 8).map((c) => c.name) ?? [], [task]);

  const { data, isLoading } = useQuery({
    queryKey: ["monster-weaknesses", creatureNames.slice().sort().join("|")],
    queryFn: () => fetchWeaknesses({ data: { names: creatureNames } }),
    enabled: open && creatureNames.length > 0,
  });

  const ranking = useMemo(
    () =>
      data
        ? rankElementsAgainstHunt(
            creatureNames.map((name) => ({ name, count: 1 })),
            data.weaknesses,
          )
        : [],
    [data, creatureNames],
  );

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src={task.image}
              alt=""
              className="h-12 w-12 flex-none"
              style={{ objectFit: "contain", imageRendering: "pixelated" }}
            />
            <div className="min-w-0">
              <DialogTitle className="font-display text-xl">{task.name}</DialogTitle>
              <DialogDescription>
                {room?.name} — matar {fmtNum(task.quantity)} criaturas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <Section icon={Target} label={`Criaturas (${task.creatures.length})`}>
            <div className="flex flex-wrap gap-2">
              {task.creatures.map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface py-1 pl-1 pr-3 text-xs font-medium"
                >
                  <img
                    src={c.image}
                    alt=""
                    className="h-6 w-6 flex-none"
                    style={{ objectFit: "contain", imageRendering: "pixelated" }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
          </Section>

          <Section icon={Swords} label="Elemento mais eficaz contra essas criaturas" tone="success">
            {isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-muted/20" />
            ) : ranking.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Não achei dados de resistência pra essas criaturas na TibiaWiki.
              </p>
            ) : (
              <>
                {(() => {
                  const top = ranking[0];
                  const info = damageElementInfo(top.element);
                  return (
                    <div className="flex items-center gap-2 rounded-lg border border-rubi-success/30 bg-rubi-success/10 px-3 py-2 text-sm">
                      <span className="text-lg leading-none">{info.emoji}</span>
                      <span>
                        <strong className="text-foreground">{info.label}</strong> é o mais eficaz —
                        dano médio de {Math.round(top.avgMod)}% nas criaturas dessa task
                      </span>
                    </div>
                  );
                })()}
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {ranking.slice(1, 6).map((r) => {
                    const info = damageElementInfo(r.element);
                    return (
                      <span
                        key={r.element}
                        className="inline-flex items-center gap-1 rounded-full bg-accent/70 px-2 py-1"
                      >
                        {info.emoji} {info.label} · {Math.round(r.avgMod)}%
                      </span>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                  Baseado em dados da TibiaWiki (Tibia oficial) — o RubinOT pode ter valores
                  diferentes.
                </p>
              </>
            )}
          </Section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Section icon={Gift} label="Recompensa (1ª vez)" tone="gold">
              <RewardList items={task.rewards} />
            </Section>
            <Section icon={Repeat} label="Recompensa (repetição)" tone="blue">
              <RewardList items={task.repeatedRewards} />
            </Section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RewardList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}

type Tone = "gold" | "success" | "blue";
const TONE_TEXT: Record<Tone, string> = {
  gold: "text-rubi-gold",
  success: "text-rubi-success",
  blue: "text-rubi-blue",
};

function Section({
  icon: Icon,
  label,
  tone = "gold",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={
          "mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider " +
          TONE_TEXT[tone]
        }
      >
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {children}
    </div>
  );
}
