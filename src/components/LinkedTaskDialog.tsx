import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Swords, Gift, Repeat, Shirt, Sparkles, Target } from "lucide-react";
import { fmtNum } from "@/lib/format";
import { huntWeakness } from "@/lib/hunt-advisor";
import { findMonster } from "@/lib/monsters";
import { damageElementInfo } from "@/lib/damage-elements";
import type { LinkedTaskEntry, LinkedTaskRoom } from "@/lib/linked-tasks.functions";
import {
  AdviceCombat,
  AdviceImbues,
  AdviceSet,
  useTaskAdvice,
} from "@/components/advisor/LinkedTaskAdvice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  room: LinkedTaskRoom | null;
  task: LinkedTaskEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkedTaskDialog({ room, task, open, onOpenChange }: Props) {
  // Fraquezas da base local de criaturas (src/data/monsters-data.ts, da TibiaWiki) — sem
  // consultar a wiki na hora. Cada criatura da task pesa igual (× vida, ver huntWeakness).
  const ranking = useMemo(
    () =>
      huntWeakness(
        (task?.creatures ?? [])
          .filter((c) => findMonster(c.name))
          .map((c) => ({ name: c.name, count: 1 })),
      ).map((w) => ({ element: w.element, avgMod: w.mod })),
    [task],
  );

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src={task.image}
              alt=""
              loading="lazy"
              decoding="async"
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
              {task.creatures.map((c) => {
                const pending = !findMonster(c.name);
                return (
                  <span
                    key={c.name}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium " +
                      (pending
                        ? "border-dashed border-border/50 text-muted-foreground"
                        : "border-border/60 bg-surface")
                    }
                  >
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-6 w-6 flex-none"
                      style={{ objectFit: "contain", imageRendering: "pixelated" }}
                    />
                    {c.name}
                    {pending && (
                      <span className="text-[10px] text-muted-foreground/70">
                        · sem dado na TibiaWiki
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </Section>

          <TaskTabs task={task} ranking={ranking} />
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

const TAB_TRIGGER =
  "flex-1 flex-col gap-0.5 rounded-md px-1 py-1.5 text-xs sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm data-[state=active]:bg-rubi-gold data-[state=active]:text-background data-[state=active]:shadow-glow-gold";

/**
 * Abas da task (menos coisa de uma vez, letra maior, melhor no celular): Combate (elemento + dano +
 * charms), Set (boneco do inventário), Imbuements (+ itens de BP) e Recompensas. Monta só com a
 * janela aberta — o hook pega a vocação do personagem ativo na hora.
 */
function TaskTabs({
  task,
  ranking,
}: {
  task: LinkedTaskEntry;
  ranking: { element: string; avgMod: number }[];
}) {
  const names = useMemo(() => task.creatures.map((c) => c.name), [task]);
  const advice = useTaskAdvice(names);
  return (
    <Tabs defaultValue="combat">
      <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-background/50 p-1">
        <TabsTrigger value="combat" className={TAB_TRIGGER}>
          <Swords className="h-3.5 w-3.5" /> Combate
        </TabsTrigger>
        <TabsTrigger value="set" className={TAB_TRIGGER}>
          <Shirt className="h-3.5 w-3.5" /> Set
        </TabsTrigger>
        <TabsTrigger value="imbues" className={TAB_TRIGGER}>
          <Sparkles className="h-3.5 w-3.5" /> <span className="sm:hidden">Imbue</span>
          <span className="hidden sm:inline">Imbuements</span>
        </TabsTrigger>
        <TabsTrigger value="rewards" className={TAB_TRIGGER}>
          <Gift className="h-3.5 w-3.5" /> <span className="sm:hidden">Prêmio</span>
          <span className="hidden sm:inline">Recompensas</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="combat" className="mt-4 space-y-5">
        <Section icon={Swords} label="Elemento mais eficaz contra essas criaturas" tone="success">
          {ranking.length === 0 ? (
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
        <AdviceCombat advice={advice} />
      </TabsContent>
      <TabsContent value="set" className="mt-4">
        <AdviceSet advice={advice} />
      </TabsContent>
      <TabsContent value="imbues" className="mt-4">
        <AdviceImbues advice={advice} />
      </TabsContent>
      <TabsContent value="rewards" className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Section icon={Gift} label="Recompensa (1ª vez)" tone="gold">
            <RewardList items={task.rewards} />
          </Section>
          <Section icon={Repeat} label="Recompensa (repetição)" tone="blue">
            <RewardList items={task.repeatedRewards} />
          </Section>
        </div>
      </TabsContent>
    </Tabs>
  );
}
