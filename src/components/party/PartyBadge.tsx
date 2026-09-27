import { Users } from "lucide-react";

/** Selo de hunt em grupo: tamanho da party (+ "dividido" quando o loot foi dividido). */
export function PartyBadge({
  size,
  split = false,
  className = "",
}: {
  size: number;
  split?: boolean;
  className?: string;
}) {
  return (
    <span
      title={
        split ? `Party de ${size} · lucro dividido pelo Party Hunt Analyser` : `Party de ${size}`
      }
      className={
        "inline-flex items-center gap-1 rounded-full border border-rubi-blue/40 bg-rubi-blue-soft px-1.5 py-0.5 text-[10px] font-semibold text-rubi-blue " +
        className
      }
    >
      <Users className="h-3 w-3" />
      {size}
      {split && <span className="font-normal opacity-80">· dividido</span>}
    </span>
  );
}
