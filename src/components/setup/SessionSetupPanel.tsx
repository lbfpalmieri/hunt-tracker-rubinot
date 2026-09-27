import { useState } from "react";
import { Plus, X } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import {
  CHARMS,
  CHARM_LEVEL_LABEL,
  COMBAT_SPELLS,
  SKILL_LABEL,
  STANCES,
  charmIcon,
  cleanWeaponName,
  type SessionSetup,
  type SetupVocation,
} from "@/lib/session-setup";

const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue";
const LABEL = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const toNum = (s: string): number | null => {
  if (!s.trim()) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/**
 * Editor do setup da sessão (controlado). Tudo sai de listas (charms, stances, magias da
 * vocação) — só o nome da arma é digitado. Ver src/lib/session-setup.ts.
 */
export function SessionSetupPanel({
  value,
  onChange,
  vocation,
  creatures,
  suggestedCharms = [],
}: {
  value: SessionSetup;
  onChange: (next: SessionSetup) => void;
  /** Vocação do personagem — filtra stances/magias e o nome da skill. Null = mostra todas. */
  vocation: SetupVocation | null;
  /** Criaturas mortas na sessão (pra ligar cada charm a uma criatura). */
  creatures: string[];
  /** Charms que dispararam na sessão (Miscellaneous). */
  suggestedCharms?: string[];
}) {
  const set = (patch: Partial<SessionSetup>) => onChange({ ...value, ...patch });

  const stances = vocation ? STANCES[vocation] : Object.values(STANCES).flat();
  const spells = vocation
    ? COMBAT_SPELLS[vocation]
    : [...new Set(Object.values(COMBAT_SPELLS).flat())].sort();
  const skillLabel = vocation ? SKILL_LABEL[vocation] : "Skill principal";

  const [newSpell, setNewSpell] = useState("");
  const [newSpellLevel, setNewSpellLevel] = useState<1 | 2>(2);
  const [newCharm, setNewCharm] = useState("");
  const [newCharmLevel, setNewCharmLevel] = useState<1 | 2 | 3>(2);
  const [newCharmCreature, setNewCharmCreature] = useState("");

  const addSpell = () => {
    if (!newSpell) return;
    set({
      spells: [
        ...value.spells.filter((s) => s.spell !== newSpell),
        { spell: newSpell, level: newSpellLevel },
      ],
    });
    setNewSpell("");
  };

  const addCharm = (charm = newCharm) => {
    if (!charm) return;
    const creature = newCharmCreature || null;
    set({
      charms: [
        ...value.charms.filter((c) => !(c.charm === charm && c.creature === creature)),
        { charm, level: newCharmLevel, creature },
      ],
    });
    setNewCharm("");
    setNewCharmCreature("");
  };

  const pendingSuggestions = suggestedCharms.filter(
    (c) => !value.charms.some((x) => x.charm === c),
  );

  return (
    <div className="space-y-5">
      {/* Arma + skills */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2">
          <span className={LABEL}>Arma</span>
          <input
            value={value.weapon ?? ""}
            onChange={(e) => set({ weapon: e.target.value })}
            onBlur={(e) => set({ weapon: cleanWeaponName(e.target.value) })}
            maxLength={40}
            placeholder="Soulbleeder"
            className={FIELD}
          />
        </label>
        <label>
          <span className={LABEL}>Tier</span>
          <select
            value={value.weaponTier ?? ""}
            onChange={(e) =>
              set({ weaponTier: e.target.value === "" ? null : Number(e.target.value) })
            }
            className={FIELD}
          >
            <option value="">—</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                T{i}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={LABEL}>Crítico extra %</span>
          <input
            inputMode="decimal"
            value={value.critDamage ?? ""}
            onChange={(e) => set({ critDamage: toNum(e.target.value) })}
            placeholder="14,9"
            className={FIELD}
          />
        </label>
        {skillLabel && (
          <label>
            <span className={LABEL}>{skillLabel}</span>
            <input
              inputMode="numeric"
              value={value.skill ?? ""}
              onChange={(e) => set({ skill: toNum(e.target.value) })}
              placeholder="219"
              className={FIELD}
            />
          </label>
        )}
        <label>
          <span className={LABEL}>Magic Level</span>
          <input
            inputMode="numeric"
            value={value.magicLevel ?? ""}
            onChange={(e) => set({ magicLevel: toNum(e.target.value) })}
            placeholder="47"
            className={FIELD}
          />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className={LABEL}>Wheel · dano e cura</span>
          <input
            inputMode="numeric"
            value={value.wheelDmgHeal ?? ""}
            onChange={(e) => set({ wheelDmgHeal: toNum(e.target.value) })}
            placeholder="21"
            className={FIELD}
          />
        </label>
      </section>

      {/* Stance */}
      {stances.length > 0 && (
        <section>
          <span className={LABEL}>Postura (stance)</span>
          <div className="flex flex-wrap gap-1.5">
            {stances.map((st) => {
              const on = value.stance === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => set({ stance: on ? null : st })}
                  className={
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors " +
                    (on
                      ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {st}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Magias aumentadas pela Wheel */}
      <section>
        <span className={LABEL}>Magias aumentadas (Wheel)</span>
        {value.spells.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {value.spells.map((s) => (
              <span
                key={s.spell}
                className="inline-flex items-center gap-1 rounded-full border border-rubi-blue/40 bg-rubi-blue/10 py-0.5 pl-2.5 pr-1 text-xs text-rubi-blue"
              >
                {s.spell} Nv{s.level}
                <button
                  type="button"
                  onClick={() => set({ spells: value.spells.filter((x) => x.spell !== s.spell) })}
                  aria-label={`Tirar ${s.spell}`}
                  className="rounded-full p-0.5 hover:bg-rubi-blue/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <select value={newSpell} onChange={(e) => setNewSpell(e.target.value)} className={FIELD}>
            <option value="">Escolher magia…</option>
            {spells.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
          <select
            value={newSpellLevel}
            onChange={(e) => setNewSpellLevel(Number(e.target.value) as 1 | 2)}
            className="w-20 flex-none rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value={1}>Nv1</option>
            <option value={2}>Nv2</option>
          </select>
          <button
            type="button"
            onClick={addSpell}
            disabled={!newSpell}
            aria-label="Adicionar magia"
            className="flex-none rounded-lg border border-rubi-blue/50 px-3 text-rubi-blue hover:bg-rubi-blue/10 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Runas de Charm */}
      <section>
        <span className={LABEL}>Runas de Charm</span>
        {pendingSuggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            Dispararam nesta sessão:
            {pendingSuggestions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCharm(c)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 hover:border-rubi-gold/60 hover:text-foreground"
              >
                <img src={charmIcon(c)} alt="" className="h-4 w-4" /> {c}
              </button>
            ))}
          </div>
        )}
        {value.charms.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {value.charms.map((c, i) => (
              <span
                key={`${c.charm}-${c.creature}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/40 bg-rubi-gold/10 py-0.5 pl-1.5 pr-1 text-xs"
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
                <button
                  type="button"
                  onClick={() => set({ charms: value.charms.filter((_, j) => j !== i) })}
                  aria-label={`Tirar ${c.charm}`}
                  className="rounded-full p-0.5 hover:bg-rubi-gold/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_auto]">
          <select value={newCharm} onChange={(e) => setNewCharm(e.target.value)} className={FIELD}>
            <option value="">Escolher charm…</option>
            <optgroup label="Major">
              {CHARMS.filter((c) => c.kind === "major").map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Minor">
              {CHARMS.filter((c) => c.kind === "minor").map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
          <select
            value={newCharmLevel}
            onChange={(e) => setNewCharmLevel(Number(e.target.value) as 1 | 2 | 3)}
            className="rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value={1}>Nv1</option>
            <option value={2}>Nv2</option>
            <option value={3}>Nv3</option>
          </select>
          <select
            value={newCharmCreature}
            onChange={(e) => setNewCharmCreature(e.target.value)}
            className={FIELD}
          >
            <option value="">Em qual criatura?</option>
            {creatures.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => addCharm()}
            disabled={!newCharm}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-rubi-gold/50 px-3 py-2 text-sm font-semibold text-rubi-gold hover:bg-rubi-gold/10 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Nv1 = Bronze, Nv2 = Prata, Nv3 = Ouro (TibiaWiki).
        </p>
      </section>
    </div>
  );
}
