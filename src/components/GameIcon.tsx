import { useEffect, useState, type ReactNode } from "react";
import { gameIconUrls } from "@/lib/game-icon";

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
 * src/lib/game-icon.ts). Tenta as URLs de gameIconUrls em ordem (.gif, .png e
 * depois o nome exato) e por fim mostra `fallback` se nenhuma existir — nunca
 * quebra o layout com um ícone de imagem quebrada.
 */
export function GameIcon({ name, size = 28, className, fallback = null }: Props) {
  const [attempt, setAttempt] = useState(0);

  // Reseta a tentativa quando o nome muda (troca de sessão, por exemplo).
  useEffect(() => {
    setAttempt(0);
  }, [name]);

  const url = gameIconUrls(name)[attempt] ?? null;
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
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
