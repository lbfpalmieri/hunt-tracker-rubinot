import { GameIcon } from "@/components/GameIcon";
import {
  CHARM_LEVEL_LABEL,
  WHEEL_ICON,
  charmIcon,
  convictionMaxLevel,
  setupVocation,
  type SessionSetup,
} from "@/lib/session-setup";

import { findWeapon, weaponSummary } from "@/lib/weapons";
import { EquipmentDoll } from "@/components/setup/EquipmentDoll";

const ROMAN = ["", "I", "II", "III"];
const WHEEL_CHIP =
  "inline-flex items-center gap-1 rounded-full border border-rubi-gold/50 bg-rubi-gold/10 py-0.5 pl-0.5 pr-2 text-xs font-medium";

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
  const weapon = findWeapon(setup.weapon);
  // Skill, Magic Level e crítico saíram do setup (confuso) — sessões antigas que têm esses campos não
  // mostram mais.
  const stats: [string, string][] = [];
  if (setup.wheelDmgHeal != null) stats.push(["Wheel dano e cura", `+${setup.wheelDmgHeal}`]);

  // Charms agrupados: "Freeze Nv2 · Vexclaw, Hellflayer"
  const charmGroups = [...new Set(setup.charms.map((c) => c.charm))].map((charm) => {
    const list = setup.charms.filter((c) => c.charm === charm);
    return {
      charm,
      level: list[0].level,
      creatures: list.map((c) => c.creature).filter(Boolean) as string[],
    };
  });

  // Com equipamentos no boneco, mostra o boneco (arma e aljava já aparecem nele).
  const hasGear = Object.values(setup.gear ?? {}).some(Boolean);

  return (
    <div className="space-y-3">
      {hasGear && (
        <EquipmentDoll
          value={setup}
          vocation={voc}
          size={compact ? 26 : 36}
          showSummary={!compact}
        />
      )}
      {hasGear && setup.stance && (
        <span className="inline-flex items-center gap-2 rounded-lg border border-rubi-blue/40 bg-rubi-blue/10 py-1 pl-1 pr-2.5 text-sm text-rubi-blue">
          <GameIcon name={setup.stance} size={24} />
          {setup.stance}
        </span>
      )}
      {!hasGear && (setup.weapon || setup.weaponTier != null || setup.stance || setup.quiver) && (
        <div className="flex flex-wrap gap-2">
          {(setup.weapon || setup.weaponTier != null) && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 py-1 pl-1 pr-2.5 text-sm font-semibold">
              {setup.weapon && <GameIcon name={weapon?.icon ?? setup.weapon} size={28} />}
              <span>
                <span className="flex items-center gap-1.5">
                  {setup.weapon ?? "Arma"}
                  {setup.weaponTier != null && (
                    <span className="rounded bg-rubi-gold/15 px-1 text-xs text-rubi-gold">
                      T{setup.weaponTier}
                    </span>
                  )}
                </span>
                {weapon && !compact && (
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    {weaponSummary(weapon)}
                  </span>
                )}
              </span>
            </span>
          )}
          {setup.quiver && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 py-1 pl-1 pr-2.5 text-sm">
              <GameIcon name={setup.quiver} size={24} />
              {setup.quiver}
            </span>
          )}
          {setup.stance && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-rubi-blue/40 bg-rubi-blue/10 py-1 pl-1 pr-2.5 text-sm text-rubi-blue">
              <GameIcon name={setup.stance} size={24} />
              {setup.stance}
            </span>
          )}
        </div>
      )}

      {stats.length > 0 && (
        <dl className={"grid gap-2 " + (compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
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

      {/* Tudo que aparece aqui está MARCADO — mesmo destaque dourado do editor pros dois grupos
          (Convicção em cinza parecia "desmarcado"). Ordem igual à do editor: Convicção, Revelação. */}
      {(setup.conviction.length > 0 || setup.revelation.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <img src={WHEEL_ICON} alt="Wheel" title="Wheel of Destiny" className="h-5 w-5" />
          {setup.conviction.map((c) => {
            const name = c.perk.replace(/^Augmented /, "");
            const staged = convictionMaxLevel(c.perk) === 2;
            return (
              <span
                key={c.perk}
                title={`Convicção: ${name}${staged ? ` (estágio ${ROMAN[c.level]})` : ""}`}
                className={WHEEL_CHIP}
              >
                <GameIcon name={c.perk} size={18} /> {name}
                {staged && <b className="text-rubi-gold">{ROMAN[c.level]}</b>}
              </span>
            );
          })}
          {setup.conviction.length > 0 && setup.revelation.length > 0 && (
            <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
          )}
          {setup.revelation.map((r) => (
            <span
              key={r.perk}
              title={`Revelação: ${r.perk} (estágio ${ROMAN[r.stage]})`}
              className={WHEEL_CHIP}
            >
              <GameIcon name={r.perk} size={18} /> {r.perk}
              <b className="text-rubi-gold">{ROMAN[r.stage]}</b>
            </span>
          ))}
        </div>
      )}

      {charmGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {charmGroups.map((g) => (
            <span
              key={g.charm}
              className="inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/40 bg-rubi-gold/10 py-0.5 pl-1 pr-2.5 text-xs"
            >
              <img src={charmIcon(g.charm)} alt="" className="h-5 w-5" />
              <span className="font-semibold text-rubi-gold">
                {g.charm} {CHARM_LEVEL_LABEL[g.level]}
              </span>
              {g.creatures.length > 0 && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  ·
                  {g.creatures.map((c) => (
                    <span key={c} className="inline-flex items-center gap-0.5" title={c}>
                      <GameIcon name={c} size={16} />
                      {!compact && c}
                    </span>
                  ))}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
