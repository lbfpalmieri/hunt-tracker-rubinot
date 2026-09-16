import { useEffect, useState, type ReactNode } from "react";
import { gameIconUrl, type GameIconExt } from "@/lib/game-icon";

interface Props {
  /** Nome do monstro ou item, exatamente como sai do Hunting Analyser. */
  name: string;
  size?: number;
  className?: string;
  /** Mostrado se nem .gif nem .png existirem pra esse nome (typo, nome exclusivo do RubinOT etc). */
  fallback?: ReactNode;
}

/**
 * Sprite de monstro/item puxado ao vivo da TibiaWiki brasileira (ver
 * src/lib/game-icon.ts). Tenta .gif primeiro (maioria dos casos), cai pra
 * .png, e por fim mostra `fallback` se nenhum dos dois existir — nunca
 * quebra o layout com um ícone de imagem quebrada.
 */
export function GameIcon({ name, size = 28, className, fallback = null }: Props) {
  const [ext, setExt] = useState<GameIconExt>("gif");
  const [failed, setFailed] = useState(false);

  // Reseta a tentativa quando o nome muda (troca de sessão, por exemplo).
  useEffect(() => {
    setExt("gif");
    setFailed(false);
  }, [name]);

  const url = failed ? null : gameIconUrl(name, ext);
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
      onError={() => {
        if (ext === "gif") setExt("png");
        else setFailed(true);
      }}
    />
  );
}
