import { Link } from "@tanstack/react-router";
import { Check, Shirt } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import { WheelPresetPicker } from "@/components/wheel/WheelPresetPicker";
import {
  EMPTY_SETUP,
  SET_PARTS,
  applySet,
  applyWheel,
  copySetupParts,
  type SessionSetup,
} from "@/lib/session-setup";
import { useSetupPresets } from "@/lib/setup-presets";
import { findWeapon } from "@/lib/weapons";

/** Só a parte de set (equipamento + postura) de um setup, pra comparar com os sets salvos. */
const setPart = (s: SessionSetup) => JSON.stringify(copySetupParts(EMPTY_SETUP, s, SET_PARTS));

/**
 * Escolha rápida de SET (Meus sets) e de RODA (Minhas rodas), independentes um do outro — sem o
 * editor completo. Usado no registro de boss; controlado (`value` é o setup que vai ser salvo).
 * Clicar no que já está escolhido tira.
 */
export function SetAndWheelPicker({
  characterId,
  value,
  onChange,
}: {
  characterId: string | null;
  value: SessionSetup;
  onChange: (next: SessionSetup) => void;
}) {
  const { data: sets = [] } = useSetupPresets(characterId);
  const current = setPart(value);

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Meus sets
          </span>
          <Link to="/equipamentos" className="text-[11px] font-medium text-rubi-blue hover:underline">
            Gerenciar sets
          </Link>
        </div>
        {sets.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sets.map((p) => {
              const on = setPart(p.setup) === current;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(applySet(value, on ? EMPTY_SETUP : p.setup))}
                  aria-pressed={on}
                  title={on ? "Tirar este set" : `Usar o set "${p.name}"`}
                  className={
                    "inline-flex max-w-full items-center gap-1.5 rounded-lg border py-1 pl-1 pr-2.5 text-xs font-semibold transition-colors " +
                    (on
                      ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                      : "border-border bg-background/60 text-muted-foreground hover:border-rubi-blue/60 hover:text-foreground")
                  }
                >
                  {p.setup.weapon ? (
                    <GameIcon name={findWeapon(p.setup.weapon)?.icon ?? p.setup.weapon} size={20} />
                  ) : (
                    <Shirt className="h-4 w-4" />
                  )}
                  {on && <Check className="h-3.5 w-3.5 flex-none" />}
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum set salvo. Monte em{" "}
            <Link to="/equipamentos" className="text-rubi-blue hover:underline">
              Meus sets
            </Link>
            .
          </p>
        )}
      </div>

      <WheelPresetPicker
        characterId={characterId}
        value={value.wheel}
        onPick={(wheel) => onChange(applyWheel(value, wheel))}
      />
    </div>
  );
}
