import { User, Users } from "lucide-react";
import { setPlayMode } from "@/lib/nav-prefs";
import { useOtherModeCount, usePlayMode } from "@/lib/play-mode";

/**
 * Aviso discreto de que existem sessões no outro modo (escondidas aqui), com atalho pra trocar.
 * Some quando não tem nada no outro modo — quem só joga solo nunca vê isso.
 */
export function ModeHint({ characterId, className = "" }: { characterId: string | null; className?: string }) {
  const mode = usePlayMode();
  const other = useOtherModeCount(characterId);
  if (other === 0) return null;
  const toParty = mode === "solo";
  const Icon = toParty ? Users : User;
  return (
    <button
      type="button"
      onClick={() => setPlayMode(toParty ? "party" : "solo")}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-rubi-blue/60 hover:text-foreground " +
        className
      }
    >
      <Icon className="h-3.5 w-3.5 text-rubi-blue" />
      {other} {other === 1 ? "sessão" : "sessões"} {toParty ? "em grupo" : "solo"} — ver no Modo{" "}
      {toParty ? "Grupo" : "Solo"}
    </button>
  );
}
