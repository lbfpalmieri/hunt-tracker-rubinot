import { useEffect, useMemo, useState } from "react";
import { gameIconUrls, loadSpriteIds, spriteIdsLoaded } from "@/lib/game-icon";

/**
 * URLs do sprite de `name` (ver src/lib/game-icon.ts), já com os ids de item e os outfits de
 * monstro. Devolve `null` enquanto esses dados carregam (só na primeira imagem da visita): quem
 * desenha guarda o espaço e não tenta nada ainda. Se o carregamento falhar, segue sem eles
 * (biblioteca do tibia.com e wiki).
 */
export function useGameIconUrls(name: string): string[] | null {
  const [ready, setReady] = useState(spriteIdsLoaded);
  useEffect(() => {
    if (ready) return;
    let alive = true;
    loadSpriteIds()
      .catch(() => undefined)
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [ready]);
  return useMemo(() => (ready ? gameIconUrls(name) : null), [name, ready]);
}
