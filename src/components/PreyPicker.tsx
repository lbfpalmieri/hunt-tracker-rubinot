import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { DEFAULT_PREY_PCT, PREY_BONUSES, type PreyBonus, type PreySlot } from "@/lib/prey";

const MAX_SLOTS = 3;

function keyOf(creature: string, bonus: PreyBonus) {
  return `${creature}::${bonus}`;
}

/**
 * Marca quais criaturas mortas na sessão estavam com prey ativa.
 * Cada seleção usa o percentual padrão do jogo (XP/Loot 40%, Dano 25%, Defesa 30%).
 */
export function PreyPicker({
  creatures,
  value,
  onChange,
}: {
  /** Criaturas mortas na sessão (vindas do Hunting Analyser). */
  creatures: string[];
  value: PreySlot[] | null;
  onChange: (prey: PreySlot[] | null, valid: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    (value ?? []).filter((s) => s.creature).map((s) => keyOf(s.creature!, s.bonus)),
  );

  const emit = useRef(onChange);
  emit.current = onChange;

  const options = useMemo(() => {
    const extras = (value ?? []).map((s) => s.creature).filter((c): c is string => Boolean(c));
    return Array.from(new Set([...creatures, ...extras]));
  }, [creatures, value]);

  useEffect(() => {
    const slots: PreySlot[] = selected.map((k) => {
      const [creature, bonus] = k.split("::") as [string, PreyBonus];
      return { bonus, pct: DEFAULT_PREY_PCT[bonus], creature };
    });
    emit.current(slots.length ? slots : null, true);
  }, [selected]);

  const toggle = (creature: string, bonus: PreyBonus) => {
    const k = keyOf(creature, bonus);
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : prev.length >= MAX_SLOTS ? prev : [...prev, k],
    );
  };

  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Cole o Hunting Analyser para listar as criaturas mortas e marcar quais estavam com prey ativa.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-rubi-blue" />
        <span>
          Marque em quais criaturas você tinha <b className="text-foreground">Prey</b> ativa nesta hunt (até{" "}
          {MAX_SLOTS} slots). Usamos os percentuais padrão do jogo.
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {options.map((creature) => (
          <div
            key={creature}
            className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/40 p-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="truncate text-sm font-medium">{creature}</span>
            <div className="flex flex-wrap gap-1.5">
              {PREY_BONUSES.map((b) => {
                const k = keyOf(creature, b.value);
                const on = selected.includes(k);
                const blocked = !on && selected.length >= MAX_SLOTS;
                return (
                  <button
                    key={b.value}
                    type="button"
                    title={`${b.label} — ${b.hint}`}
                    disabled={blocked}
                    onClick={() => toggle(creature, b.value)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                      on
                        ? "border-rubi-blue bg-rubi-blue/15 text-rubi-blue"
                        : "border-border/60 text-muted-foreground hover:border-rubi-blue/50 disabled:cursor-not-allowed disabled:opacity-30"
                    }`}
                  >
                    <span className="mr-1">{b.emoji}</span>
                    {b.label} {DEFAULT_PREY_PCT[b.value]}%
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.length >= MAX_SLOTS && (
        <p className="mt-2 text-[11px] text-muted-foreground">Limite de {MAX_SLOTS} preys atingido.</p>
      )}
    </div>
  );
}
