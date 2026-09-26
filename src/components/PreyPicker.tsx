import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Lock, Star, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PREY_BONUSES,
  PREY_BONUS_IMAGE,
  PREY_MAX_SLOTS,
  PREY_MAX_STARS,
  PREY_UNLOCKED_SLOTS,
  preyPctForStars,
  preyStarsForPct,
  type PreyBonus,
  type PreySlot,
} from "@/lib/prey";
import { GameIcon } from "@/components/GameIcon";

/** O 3º slot é comprado na Store — lembramos neste navegador se a pessoa tem. */
const THIRD_SLOT_KEY = "prey-third-slot";

interface SlotDraft {
  creature: string | null;
  bonus: PreyBonus | null;
  stars: number;
}

const EMPTY: SlotDraft = { creature: null, bonus: null, stars: PREY_MAX_STARS };

/** Distribui o valor salvo nos 3 slots — criatura repetida (dado antigo) fica só no 1º. */
function toDrafts(value: PreySlot[] | null): SlotDraft[] {
  const out: SlotDraft[] = [];
  const seen = new Set<string>();
  for (const s of value ?? []) {
    if (!s.creature || seen.has(s.creature) || out.length >= PREY_MAX_SLOTS) continue;
    seen.add(s.creature);
    out.push({ creature: s.creature, bonus: s.bonus, stars: preyStarsForPct(s.bonus, s.pct) });
  }
  while (out.length < PREY_MAX_SLOTS) out.push({ ...EMPTY });
  return out;
}

/**
 * Prey da sessão, no formato da janela "Prey Creatures" do jogo: 3 slots (o 3º é da Store),
 * cada um com UMA criatura e UM bônus com estrelas. Uma criatura não pode estar em dois slots.
 * Ver regras em src/lib/prey.ts.
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
  const [slots, setSlots] = useState<SlotDraft[]>(() => toDrafts(value));
  const [thirdUnlocked, setThirdUnlocked] = useState<boolean>(() => {
    if (slots[2]?.creature) return true;
    try {
      return localStorage.getItem(THIRD_SLOT_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [open, setOpen] = useState(false);
  const emit = useRef(onChange);
  emit.current = onChange;

  const options = useMemo(() => {
    const extras = (value ?? []).map((s) => s.creature).filter((c): c is string => Boolean(c));
    return Array.from(new Set([...creatures, ...extras]));
  }, [creatures, value]);

  useEffect(() => {
    const active = slots.filter((s, i) => s.creature && (i < PREY_UNLOCKED_SLOTS || thirdUnlocked));
    const valid = active.every((s) => s.bonus);
    const prey: PreySlot[] = active
      .filter((s) => s.bonus)
      .map((s) => ({
        creature: s.creature,
        bonus: s.bonus!,
        pct: preyPctForStars(s.bonus!, s.stars),
      }));
    emit.current(prey.length ? prey : null, valid);
  }, [slots, thirdUnlocked]);

  const patch = (i: number, next: Partial<SlotDraft>) =>
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...next } : s)));

  const setThird = (on: boolean) => {
    setThirdUnlocked(on);
    if (!on) patch(2, { ...EMPTY });
    try {
      localStorage.setItem(THIRD_SLOT_KEY, on ? "1" : "0");
    } catch {
      // sem localStorage: vale só nesta tela.
    }
  };

  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Cole o Hunting Analyser para listar as criaturas mortas e marcar quais estavam com prey
        ativa.
      </p>
    );
  }

  const missingBonus = slots.some(
    (s, i) => s.creature && !s.bonus && (i < PREY_UNLOCKED_SLOTS || thirdUnlocked),
  );

  const chosen = slots.filter((s, i) => s.creature && (i < PREY_UNLOCKED_SLOTS || thirdUnlocked));

  // Na página fica só o resumo; a janela dos 3 slots abre no centro (numa coluna estreita, como a
  // da Nova sessão, os slots ficavam pequenos demais pra enxergar as criaturas).
  return (
    <div>
      {chosen.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma prey marcada ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {chosen.map((s) => (
            <span
              key={s.creature}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-600/60 bg-zinc-900/70 py-1 pl-1 pr-2.5 text-xs"
            >
              <GameIcon name={s.creature!} size={28} />
              {s.bonus && (
                <img
                  src={PREY_BONUS_IMAGE[s.bonus]}
                  alt=""
                  width={11}
                  height={23}
                  className="h-[23px] w-[11px] [image-rendering:pixelated]"
                />
              )}
              <span>
                <span className="block font-semibold text-foreground">{s.creature}</span>
                <span className={s.bonus ? "text-rubi-gold" : "text-rubi-danger"}>
                  {s.bonus
                    ? `${PREY_BONUSES.find((b) => b.value === s.bonus)?.label} ${s.bonus === "defense" ? "−" : "+"}${preyPctForStars(s.bonus, s.stars)}%`
                    : "sem bônus escolhido"}
                </span>
              </span>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 bg-rubi-blue/10 px-3 py-2 text-sm font-semibold text-rubi-blue hover:bg-rubi-blue/20"
      >
        <Crosshair className="h-4 w-4" />
        {chosen.length ? "Editar prey" : "Adicionar prey"}
      </button>

      {missingBonus && (
        <p className="mt-2 text-xs text-rubi-gold">Falta escolher o bônus de alguma prey.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prey Creatures</DialogTitle>
            <DialogDescription>
              Igual à janela do jogo: escolha a criatura de cada slot e o bônus que saiu pra ela,
              com as estrelas. Uma criatura por slot, um bônus por criatura.
            </DialogDescription>
          </DialogHeader>
          <div className="@container">
            <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-3">
              {slots.map((slot, i) => {
                const locked = i >= PREY_UNLOCKED_SLOTS && !thirdUnlocked;
                const usedElsewhere = new Set(
                  slots.filter((s, j) => j !== i && s.creature).map((s) => s.creature!),
                );
                return (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-xl border-2 border-zinc-600/60 bg-zinc-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-700/80 bg-zinc-800/80 px-3 py-1.5">
                      <span className="truncate text-xs font-semibold text-zinc-300">
                        {locked
                          ? "Bloqueado"
                          : slot.creature
                            ? `Selecionado: ${slot.creature}`
                            : `Slot ${i + 1}`}
                      </span>
                      {!locked && slot.creature && (
                        <button
                          type="button"
                          onClick={() => patch(i, { ...EMPTY })}
                          aria-label={`Limpar slot ${i + 1}`}
                          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {locked ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
                        <div className="flex h-16 w-14 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80">
                          <Lock className="h-6 w-6 text-zinc-500" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          3º slot é comprado na Store (<i>Permanent Prey Slot</i>).
                        </p>
                        <button
                          type="button"
                          onClick={() => setThird(true)}
                          className="rounded-lg bg-rubi-blue/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rubi-blue"
                        >
                          Tenho esse slot
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-1 flex-col gap-3 p-2.5">
                        <div className="grid max-h-[15.75rem] grid-cols-3 gap-1.5 overflow-y-auto pr-0.5">
                          {options.map((c) => {
                            const selected = slot.creature === c;
                            const taken = usedElsewhere.has(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                disabled={taken}
                                onClick={() => patch(i, { creature: selected ? null : c })}
                                title={taken ? `${c} já está em outro slot` : c}
                                className={
                                  "flex h-20 flex-col items-center justify-center gap-0.5 rounded-md border p-1 transition-colors " +
                                  (selected
                                    ? "border-white bg-zinc-700/70"
                                    : taken
                                      ? "cursor-not-allowed border-transparent opacity-25"
                                      : "border-transparent bg-zinc-800/60 hover:border-zinc-500")
                                }
                              >
                                <GameIcon name={c} size={48} />
                                <span className="line-clamp-1 w-full text-center text-[9px] leading-tight text-zinc-400">
                                  {c}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {slot.creature && (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-2">
                            <div className="flex justify-center gap-1.5">
                              {PREY_BONUSES.map((b) => {
                                const on = slot.bonus === b.value;
                                return (
                                  <button
                                    key={b.value}
                                    type="button"
                                    onClick={() => patch(i, { bonus: b.value })}
                                    title={`${b.label} — ${b.hint}`}
                                    aria-pressed={on}
                                    className={
                                      "rounded-md border-2 p-0.5 transition-all " +
                                      (on
                                        ? "border-rubi-gold bg-rubi-gold/15"
                                        : "border-transparent opacity-60 hover:opacity-100")
                                    }
                                  >
                                    <img
                                      src={PREY_BONUS_IMAGE[b.value]}
                                      alt={b.label}
                                      width={22}
                                      height={46}
                                      className="h-[46px] w-[22px] [image-rendering:pixelated]"
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            {slot.bonus ? (
                              <>
                                <div className="mt-2 flex justify-center gap-0.5">
                                  {Array.from({ length: PREY_MAX_STARS }, (_, k) => k + 1).map(
                                    (n) => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => patch(i, { stars: n })}
                                        aria-label={`${n} estrelas`}
                                        className="p-0.5"
                                      >
                                        <Star
                                          className={
                                            "h-3.5 w-3.5 " +
                                            (n <= slot.stars
                                              ? "fill-rubi-gold text-rubi-gold"
                                              : "text-zinc-600")
                                          }
                                        />
                                      </button>
                                    ),
                                  )}
                                </div>
                                <div className="mt-1 text-center text-xs font-semibold text-rubi-gold">
                                  {PREY_BONUSES.find((b) => b.value === slot.bonus)?.label}{" "}
                                  {slot.bonus === "defense" ? "−" : "+"}
                                  {preyPctForStars(slot.bonus, slot.stars)}%
                                </div>
                              </>
                            ) : (
                              <p className="mt-1.5 text-center text-[11px] text-rubi-gold">
                                Escolha o bônus dessa prey
                              </p>
                            )}
                          </div>
                        )}

                        {i >= PREY_UNLOCKED_SLOTS && !slot.creature && (
                          <button
                            type="button"
                            onClick={() => setThird(false)}
                            className="text-[10px] text-muted-foreground hover:underline"
                          >
                            não tenho o 3º slot
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="items-center gap-2 sm:justify-between">
            <span className="text-xs text-rubi-gold">
              {missingBonus ? "Falta escolher o bônus de alguma prey." : ""}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Concluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
