import { GameIcon } from "@/components/GameIcon";
import {
  CHARM_LEVEL_LABEL,
  SKILL_LABEL,
  charmIcon,
  setupVocation,
  type SessionSetup,
} from "@/lib/session-setup";

/** Setup da sessão em modo leitura (sessão privada, Comunidade e comparação). */
export function SetupCard({
  setup,
  vocation,
  compact = false,
}: {
  setup: SessionSetup;
  vocation?: string | null;
  compact?: boolean;
}) {
  const voc = setupVocation(vocation);
  const skillLabel = voc ? SKILL_LABEL[voc] : "Skill";
  const stats: [string, string][] = [];
  if (setup.weapon || setup.weaponTier != null)
    stats.push([
      "Arma",
      `${setup.weapon ?? "—"}${setup.weaponTier != null ? ` T${setup.weaponTier}` : ""}`,
    ]);
  if (setup.skill != null && skillLabel) stats.push([skillLabel, String(setup.skill)]);
  if (setup.magicLevel != null) stats.push(["Magic Level", String(setup.magicLevel)]);
  if (setup.critDamage != null) stats.push(["Crítico extra", `+${setup.critDamage}%`]);
  if (setup.wheelDmgHeal != null) stats.push(["Wheel dano e cura", `+${setup.wheelDmgHeal}`]);
  if (setup.stance) stats.push(["Postura", setup.stance]);

  return (
    <div className="space-y-3">
      {stats.length > 0 && (
        <dl className={"grid gap-2 " + (compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
          {stats.map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5"
            >
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="truncate text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {setup.spells.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {setup.spells.map((s) => (
            <span
              key={s.spell}
              className="rounded-full border border-rubi-blue/40 bg-rubi-blue/10 px-2.5 py-0.5 text-xs text-rubi-blue"
            >
              {s.spell} Nv{s.level}
            </span>
          ))}
        </div>
      )}
      {setup.charms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {setup.charms.map((c, i) => (
            <span
              key={`${c.charm}-${c.creature}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/40 bg-rubi-gold/10 py-0.5 pl-1.5 pr-2.5 text-xs"
            >
              <img src={charmIcon(c.charm)} alt="" className="h-4 w-4" />
              <span className="font-semibold text-rubi-gold">
                {c.charm} {CHARM_LEVEL_LABEL[c.level]}
              </span>
              {c.creature && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  · <GameIcon name={c.creature} size={16} /> {c.creature}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
