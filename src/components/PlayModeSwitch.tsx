import { useEffect } from "react";
import { User, Users } from "lucide-react";
import { toast } from "sonner";
import { setPlayMode, useNavPrefs, type PlayMode } from "@/lib/nav-prefs";

const OPTIONS: { mode: PlayMode; label: string; icon: typeof User }[] = [
  { mode: "solo", label: "Solo", icon: User },
  { mode: "party", label: "Grupo", icon: Users },
];

/**
 * Alternador Solo / Grupo do cabeçalho. Trocar de modo filtra as sessões do app inteiro e troca
 * a cor de destaque (html[data-play-mode] em styles.css) — ver play-mode.ts.
 */
export function PlayModeSwitch() {
  const mode = useNavPrefs((s) => s.mode);

  useEffect(() => {
    document.documentElement.dataset.playMode = mode;
  }, [mode]);

  const choose = (m: PlayMode) => {
    if (m === mode) return;
    setPlayMode(m);
    toast(m === "party" ? "Modo Grupo" : "Modo Solo", {
      description:
        m === "party"
          ? "Mostrando só as hunts em party: divisão do loot, parceiros e comunidade em grupo."
          : "Mostrando só as hunts solo.",
    });
  };

  return (
    <div
      role="radiogroup"
      aria-label="Modo de jogo"
      className="inline-flex flex-none rounded-lg border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ mode: m, label, icon: Icon }) => {
        const on = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            title={`Modo ${label}`}
            onClick={() => choose(m)}
            className={
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors sm:px-2.5 " +
              (on
                ? "bg-rubi-blue text-primary-foreground shadow-glow-blue"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4 flex-none" />
            <span className={on ? "hidden sm:inline" : "hidden md:inline"}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
