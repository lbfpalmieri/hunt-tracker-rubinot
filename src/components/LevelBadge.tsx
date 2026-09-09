import { Swords } from "lucide-react";

/** Badge só de leitura ("Lv. 250") pra colocar do lado do nome do personagem. Nada se não há level registrado ainda. */
export function LevelBadge({ level, className = "" }: { level: number | null; className?: string }) {
  if (level == null) return null;
  return (
    <span
      title={`Level ${level}`}
      className={
        "inline-flex flex-none items-center gap-1 rounded-full border border-rubi-blue/40 bg-rubi-blue/10 px-2 py-0.5 text-[10px] font-semibold text-rubi-blue " +
        className
      }
    >
      <Swords className="h-2.5 w-2.5" />
      Lv. {level}
    </span>
  );
}
