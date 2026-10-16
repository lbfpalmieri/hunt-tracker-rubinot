import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, Clock, Coins, Skull, Zap } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import { fmtDuration, fmtNum } from "@/lib/format";
import { LANDING_SAMPLE_TEXT, landingSample } from "@/lib/landing-sample";
import { CountUp } from "./CountUp";

// Lido uma vez: o mesmo parser do app em cima de um export real (ver landing-sample.ts).
const SAMPLE = landingSample();
const ANALYSER_ROWS = LANDING_SAMPLE_TEXT.split("\n")
  .filter((line) => /^(Session|Raw XP Gain|Loot|Supplies|Balance): /.test(line))
  .map((line) => {
    const [label, value] = line.split(": ");
    return { label, value };
  });
const MAX_KILLS = Math.max(1, ...SAMPLE.topKills.map((k) => k.count));

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * O elemento memorável da landing: o Hunting Analyser do jogo (janela de bronze) virando a
 * sessão do app, com os números subindo. É a única animação que roda sozinha na página.
 */
export function HeroPreview() {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setStarted(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <figure className="relative mx-auto w-full max-w-xl lg:h-[520px] lg:max-w-none">
      <figcaption className="sr-only">
        Exemplo: um Hunting Analyser real do RubinOT colado no app vira Raw XP/h de{" "}
        {fmtNum(SAMPLE.rawXpPerHour)} e lucro/h de {fmtNum(SAMPLE.balancePerHour)}.
      </figcaption>

      {/* Janela do jogo */}
      <div
        className="game-window animate-landing-rise relative w-full overflow-hidden lg:absolute lg:left-0 lg:top-0 lg:w-[56%] lg:-rotate-3"
        style={delay(80)}
        aria-hidden
      >
        <div className="flex items-center gap-2 border-b border-frame-edge/70 bg-frame-ink/60 px-3 py-1.5">
          <span className="h-2 w-2 rounded-sm bg-frame-light/70" />
          <span className="flex-1 text-center text-2xs font-semibold tracking-wide text-frame-light">
            Hunting Analyser
          </span>
          <span className="h-2 w-2 rounded-sm bg-frame-light/70" />
        </div>
        <dl className="space-y-1 px-3 pt-2.5 text-xs">
          {ANALYSER_ROWS.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{r.label}:</dt>
              <dd className="font-semibold tabular-nums text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="px-3 pb-3 pt-2.5 text-xs">
          <div className="text-muted-foreground">Killed Monsters:</div>
          <ul className="mt-1 space-y-0.5">
            {SAMPLE.topKills.slice(0, 3).map((k) => (
              <li key={k.name} className="flex min-w-0 items-center gap-1.5 text-foreground/90">
                <GameIcon name={k.name} size={20} />
                <span className="tabular-nums">{k.count}x</span>
                <span className="truncate">{k.name}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 inline-flex items-center rounded-sm border border-frame-light/60 bg-frame-dark/40 px-2.5 py-1 text-2xs font-semibold text-frame-light shadow-[inset_0_1px_0_color-mix(in_oklab,var(--frame-light)_40%,transparent)]">
            Copy to Clipboard
          </div>
        </div>
      </div>

      {/* "Colou" — liga a janela do jogo à sessão do app */}
      <div
        className="animate-landing-rise relative z-10 my-3 flex justify-center lg:absolute lg:left-[3%] lg:top-[335px] lg:my-0 lg:rotate-[-3deg]"
        style={delay(420)}
        aria-hidden
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/50 bg-background/90 px-3 py-1.5 text-xs font-semibold text-rubi-gold shadow-glow-gold backdrop-blur">
          Colou no app
          <ArrowDown className="h-3.5 w-3.5 lg:hidden" />
          <ArrowRight className="hidden h-3.5 w-3.5 lg:block" />
        </span>
      </div>

      {/* Sessão no app */}
      <div
        className="panel-gilded animate-landing-rise relative w-full p-4 sm:p-5 lg:absolute lg:bottom-0 lg:right-0 lg:w-[68%]"
        style={delay(560)}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-lg border border-border bg-background/60">
            <GameIcon name={SAMPLE.topKills[0]?.name ?? "Dragon"} size={40} fallback={<Skull className="h-6 w-6 text-muted-foreground" />} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-bold">Sessão de exemplo</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {fmtDuration(SAMPLE.durationSec)} de hunt
            </div>
          </div>
          <span className="ml-auto rounded-full border border-rubi-success/40 bg-rubi-success/10 px-2 py-0.5 text-2xs font-semibold text-rubi-success">
            Salva
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-rubi-blue/35 bg-rubi-blue-soft p-3">
            <div className="flex items-center gap-1 text-2xs font-semibold text-rubi-blue">
              <Zap className="h-3.5 w-3.5" /> Raw XP/h
            </div>
            <div className="mt-0.5 font-display text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              <CountUp value={SAMPLE.rawXpPerHour} run={started} format={fmtNum} />
            </div>
          </div>
          <div className="rounded-xl border border-rubi-gold/40 bg-rubi-gold-soft p-3">
            <div className="flex items-center gap-1 text-2xs font-semibold text-rubi-gold">
              <Coins className="h-3.5 w-3.5" /> Lucro/h
            </div>
            <div className="mt-0.5 font-display text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              <CountUp value={SAMPLE.balancePerHour} run={started} format={fmtNum} />
            </div>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5" aria-label="Criaturas mais mortas">
          {SAMPLE.topKills.map((k, i) => (
            <li key={k.name} className="flex items-center gap-2 text-xs">
              <GameIcon name={k.name} size={22} />
              <span className="w-32 truncate text-foreground/90 sm:w-40">{k.name}</span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-rubi-blue to-cat-cyan transition-transform duration-1000"
                  style={{
                    transform: `scaleX(${started ? k.count / MAX_KILLS : 0})`,
                    transitionDelay: `${i * 90}ms`,
                    transitionTimingFunction: "var(--mola-suave)",
                  }}
                />
              </span>
              <span className="w-10 text-right font-display font-semibold tabular-nums">{k.count}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs">
          <span className="text-muted-foreground">Monstros/h</span>
          <span className="font-display font-bold tabular-nums text-rubi-success">
            <CountUp value={SAMPLE.killsPerHour} run={started} format={fmtNum} />
          </span>
        </div>
        <p className="mt-2 text-2xs text-muted-foreground">
          Calculado pelo app a partir de um Hunting Analyser real do RubinOT.
        </p>
      </div>
    </figure>
  );
}
