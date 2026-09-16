/**
 * Elementos de dano recebido, do jeito que saem do "Damage Types" do
 * Hunting Analyser (physical, fire, energy...). Testei buscar o ícone de
 * cada elemento na TibiaWiki (mesma ideia dos sprites de monstro/item), mas
 * só "Physical" existe com o padrão de nome consistente — os outros ou não
 * existem ou têm nomes diferentes. Pra não arriscar ícone quebrado num lugar
 * que vai aparecer em toda hunt, uso emoji fixo, igual ao Prey (src/lib/prey.ts).
 */
export interface DamageElementInfo {
  key: string;
  label: string;
  emoji: string;
}

const DAMAGE_ELEMENTS: Record<string, DamageElementInfo> = {
  physical: { key: "physical", label: "Físico", emoji: "⚔️" },
  fire: { key: "fire", label: "Fogo", emoji: "🔥" },
  energy: { key: "energy", label: "Energia", emoji: "⚡" },
  earth: { key: "earth", label: "Terra", emoji: "🌿" },
  ice: { key: "ice", label: "Gelo", emoji: "❄️" },
  holy: { key: "holy", label: "Sagrado", emoji: "✨" },
  death: { key: "death", label: "Morte", emoji: "💀" },
  drown: { key: "drown", label: "Afogamento", emoji: "🌊" },
  lifedrain: { key: "lifedrain", label: "Life Drain", emoji: "🩸" },
  manadrain: { key: "manadrain", label: "Mana Drain", emoji: "🔷" },
  agony: { key: "agony", label: "Agonia", emoji: "☠️" },
};

const FALLBACK: Omit<DamageElementInfo, "key"> = { label: "", emoji: "🔸" };

const normalizeKey = (raw: string): string => raw.trim().toLowerCase().replace(/[\s_-]+/g, "");

/** Nome bonito + emoji pra um tipo de dano bruto do parser ("physical", "life drain"...). */
export function damageElementInfo(raw: string): DamageElementInfo {
  const key = normalizeKey(raw);
  return DAMAGE_ELEMENTS[key] ?? { key, label: raw, emoji: FALLBACK.emoji };
}

/**
 * true só pros ~11 elementos conhecidos. Usado pra separar "Damage Types"
 * (elemento) de "Damage Sources" (nome de monstro) — sessões salvas antes do
 * fix do parser (colon no cabeçalho quebrava o corte da seção) têm os dois
 * misturados no mesmo array, então filtramos aqui em vez de confiar cegamente
 * no que já foi salvo.
 */
export function isKnownDamageElement(raw: string): boolean {
  return normalizeKey(raw) in DAMAGE_ELEMENTS;
}
