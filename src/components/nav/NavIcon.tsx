import { GameIcon } from "@/components/GameIcon";
import type { NavItem } from "@/lib/nav-items";

/**
 * Ícone de item de menu: o sprite do jogo (estilo da wiki/site do RubinOT) com o ícone lucide de
 * reserva se a imagem não carregar. A caixa tem tamanho fixo pra não "pular" o layout.
 */
export function NavIcon({
  item,
  size = 28,
  className = "",
}: {
  item: Pick<NavItem, "sprite" | "icon">;
  size?: number;
  className?: string;
}) {
  const Icon = item.icon;
  return (
    <span
      className={"flex flex-none items-center justify-center " + className}
      style={{ width: size, height: size }}
    >
      <GameIcon
        name={item.sprite}
        size={size}
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
        fallback={<Icon style={{ width: size * 0.72, height: size * 0.72 }} />}
      />
    </span>
  );
}
