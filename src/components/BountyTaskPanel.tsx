import { Shield } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import {
  BOUNTY_BASE_POINTS,
  BOUNTY_DIFFICULTIES,
  BOUNTY_DIFFICULTY_POOL,
  BOUNTY_TALISMAN_IMAGE,
  BOUNTY_TIERS,
  parseXpAmount,
  type BountyTier,
} from "@/lib/bounty";
import type { BountyDraft } from "@/lib/bounty-draft";
import { fmtNum } from "@/lib/format";

const TIER_SHIELD: Record<BountyTier, string | null> = {
  normal: null,
  silver: "text-zinc-300",
  gold: "text-rubi-gold",
};

/**
 * Bounty Task no formato do Task Board do jogo: dificuldade em cima, card da criatura com a
 * faixa do nome (escudo prata/dourado nas tasks Silver/Gold), abates e a recompensa. As
 * criaturas vêm do "Killed Monsters" da sessão.
 */
export function BountyTaskPanel({
  creatures,
  value,
  onChange,
}: {
  /** Criaturas mortas na sessão, com a quantidade (mais mortas primeiro). */
  creatures: { name: string; count: number }[];
  value: BountyDraft;
  onChange: (next: BountyDraft) => void;
}) {
  const set = (patch: Partial<BountyDraft>) => onChange({ ...value, ...patch });
  const xp = parseXpAmount(value.xpText);
  const xpInvalid = value.xpText.trim().length > 0 && xp == null;
  const kills = creatures.find((c) => c.name === value.creature)?.count ?? null;
  const diff = BOUNTY_DIFFICULTIES.find((d) => d.value === value.difficulty);
  const shield = value.tier ? TIER_SHIELD[value.tier] : null;

  return (
    <div className="overflow-hidden rounded-xl border-2 border-zinc-600/60 bg-zinc-900/70">
      <div className="flex items-center gap-2 border-b border-zinc-700/80 bg-zinc-800/80 px-3 py-2">
        <img
          src={BOUNTY_TALISMAN_IMAGE}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 [image-rendering:pixelated]"
        />
        <span className="text-sm font-semibold text-zinc-200">Task Board · Bounty Tasks</span>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Task Difficulty
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {BOUNTY_DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => set({ difficulty: d.value })}
                className={
                  "rounded-lg border px-2 py-2 text-left transition-colors " +
                  (value.difficulty === d.value
                    ? "border-rubi-gold bg-rubi-gold/15"
                    : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-500")
                }
              >
                <div
                  className={
                    "text-sm font-bold " +
                    (value.difficulty === d.value ? "text-rubi-gold" : "text-zinc-200")
                  }
                >
                  {d.label}
                </div>
                <div className="text-[10px] leading-tight text-zinc-400">
                  {BOUNTY_DIFFICULTY_POOL[d.value]}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Criatura da task <span className="normal-case text-zinc-500">(opcional)</span>
            </div>
            <div className="grid max-h-[13rem] grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-4">
              {creatures.map((c) => {
                const on = value.creature === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => set({ creature: on ? null : c.name })}
                    title={c.name}
                    className={
                      "flex h-20 flex-col items-center justify-center gap-0.5 rounded-md border p-1 transition-colors " +
                      (on
                        ? "border-white bg-zinc-700/70"
                        : "border-transparent bg-zinc-800/60 hover:border-zinc-500")
                    }
                  >
                    <GameIcon name={c.name} size={40} />
                    <span className="line-clamp-1 w-full text-center text-[9px] leading-tight text-zinc-400">
                      {c.name}
                    </span>
                    <span className="text-[9px] font-semibold text-zinc-500">
                      {fmtNum(c.count)}x
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card da task, igual ao do Task Board */}
          <div className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-800/60">
            <div className="relative mx-2 mt-2 flex items-center justify-center rounded-sm border border-[#8a6d3b] bg-gradient-to-b from-[#b89a66] to-[#8f7447] px-6 py-1 text-center text-xs font-bold text-[#2a1f10] shadow">
              {shield && <Shield className={"absolute left-1.5 h-4 w-4 fill-current " + shield} />}
              <span className="truncate">{value.creature ?? "Criatura"}</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/80">
                {value.creature ? (
                  <GameIcon name={value.creature} size={48} />
                ) : (
                  <span className="text-2xl text-zinc-600">?</span>
                )}
              </div>
              <div className="text-xs text-zinc-300">
                {kills != null
                  ? `${fmtNum(kills)} kills nesta sessão`
                  : diff
                    ? diff.hint.split("·")[0]
                    : "—"}
              </div>
            </div>
            <div className="border-t border-zinc-700 px-3 py-2.5 text-xs">
              <div className="mb-1.5 font-semibold text-zinc-300">Tipo da task</div>
              <div className="grid grid-cols-3 gap-1">
                {BOUNTY_TIERS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set({ tier: t.value })}
                    title={t.hint}
                    className={
                      "inline-flex items-center justify-center gap-1 rounded-md border px-1 py-1 text-[11px] font-semibold " +
                      (value.tier === t.value
                        ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500")
                    }
                  >
                    {TIER_SHIELD[t.value] && (
                      <Shield className={"h-3 w-3 fill-current " + TIER_SHIELD[t.value]} />
                    )}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mb-1 mt-3 font-semibold text-zinc-300">Reward</div>
              <label className="flex items-center gap-1.5">
                <span className="text-zinc-400">•</span>
                <input
                  value={value.xpText}
                  onChange={(e) => set({ xpText: e.target.value })}
                  placeholder="XP (ex: 781.875 ou 8kk)"
                  className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs outline-none focus:border-rubi-gold"
                />
                <span className="text-zinc-400">XP</span>
              </label>
              {value.difficulty && (
                <div className="mt-1 text-zinc-400">
                  • {BOUNTY_BASE_POINTS[value.difficulty]}
                  {value.tier && value.tier !== "normal" ? "+" : ""} Bounty Points
                </div>
              )}
              <div className="text-zinc-400">• 1 Reroll Token</div>
            </div>
          </div>
        </div>

        <p className={"text-[11px] " + (xpInvalid ? "text-rubi-danger" : "text-zinc-400")}>
          {xpInvalid
            ? "XP inválida — use 781.875, 8kk ou 8000000."
            : xp != null
              ? `A XP da recompensa (${fmtNum(xp)}) entra no Hunting Analyser e será descontada da Raw XP desta sessão.`
              : "A XP da recompensa aparece no card da task no jogo. Sem ela, a sessão fica marcada como Bounty e sai das médias de Raw XP/h."}
        </p>
      </div>
    </div>
  );
}
