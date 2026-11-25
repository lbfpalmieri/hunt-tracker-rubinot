import { useState, type ReactNode } from "react";
import { useGameIconUrls } from "@/hooks/use-game-icon-urls";

interface Props {
  /** Nome do monstro ou item, exatamente como sai do Hunting Analyser. */
  name: string;
  size?: number;
  className?: string;
  /** Mostrado se nenhuma imagem existir pra esse nome (typo, nome exclusivo do RubinOT etc). */
  fallback?: ReactNode;
}

/**
 * Sprite de monstro, item, magia ou perk pelo nome (ver src/lib/game-icon.ts). Tenta as URLs de
 * gameIconUrls em ordem e por fim mostra `fallback` se nenhuma existir — nunca quebra o layout com
 * um ícone de imagem quebrada. Enquanto os ids carregam (primeira imagem da visita), guarda o espaço.
 */
export function GameIcon({ name, size = 28, className, fallback = null }: Props) {
  const urls = useGameIconUrls(name);
  // As falhas ficam presas à lista: trocou o nome (ou a lista carregou), recomeça do 0.
  const [failed, setFailed] = useState<{ urls: string[] | null; count: number }>({ urls, count: 0 });
  const attempt = failed.urls === urls ? failed.count : 0;

  if (!urls) {
    return <span aria-hidden className={className} style={{ display: "inline-block", width: size, height: size }} />;
  }
  const url = urls[attempt] ?? null;
  if (!url) return <>{fallback}</>;

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated" }}
      onError={() => setFailed({ urls, count: attempt + 1 })}
    />
  );
}
