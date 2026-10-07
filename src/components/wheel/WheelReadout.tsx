import { useMemo } from "react";
import { GameIcon } from "@/components/GameIcon";
import { DEDICATION_COLOR, DOMAIN_COLOR, WheelOfDestiny } from "@/components/wheel/WheelOfDestiny";
import { gemModsText, gemName, summarizeWheel, type WheelBuild } from "@/lib/wheel";

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Roda salva em modo leitura: o desenho + números principais e gemas (sessão, Comunidade, Comparar). */
export function WheelReadout({ build, compact = false }: { build: WheelBuild; compact?: boolean }) {
  const s = useMemo(() => summarizeWheel(build), [build]);
  const stats: [string, string, string][] = [
    ["Vida", `+${fmt(s.hp)}`, DEDICATION_COLOR.hp],
    ["Mana", `+${fmt(s.mana)}`, DEDICATION_COLOR.mana],
    ["Cap", `+${fmt(s.cap)}`, DEDICATION_COLOR.cap],
    ["Mitigação", `+${fmt(s.mitigation)}%`, DEDICATION_COLOR.mit],
  ];
  const gems = s.domains.filter((d) => d.gem);
  return (
    <div className={compact ? "space-y-2" : "flex flex-col gap-3 sm:flex-row sm:items-start"}>
      <WheelOfDestiny
        build={build}
        className={
          compact
            ? "mx-auto h-auto w-full max-w-[200px]"
            : "mx-auto h-auto w-full max-w-[260px] flex-none"
        }
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span>
            Dano e cura <b className="font-display text-lg text-rubi-gold">+{s.dmgHeal}</b>
          </span>
          <span className="text-xs text-muted-foreground">
            {fmt(s.used)} pontos{build.level ? ` · level ${build.level}` : ""}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {stats.map(([l, v, c]) => (
            <div
              key={l}
              className="flex items-center justify-between rounded-md bg-background/50 px-2 py-1 text-xs"
            >
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                {l}
              </span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        {!compact &&
          gems.map((d) => (
            <div
              key={d.domain}
              className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs"
              style={{ borderColor: `${DOMAIN_COLOR[d.domain]}55` }}
            >
              <GameIcon name={gemName(build.voc, d.gem)!} size={22} />
              <div className="min-w-0">
                <p className="font-semibold">
                  {gemName(build.voc, d.gem)}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({d.activeMods}/{d.gemQuality} mods ativos)
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {gemModsText(build.voc, d.gem!).join(" · ")}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
