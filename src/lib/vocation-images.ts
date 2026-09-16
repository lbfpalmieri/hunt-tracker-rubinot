/**
 * Imagem que representa cada vocação, puxada direto da TibiaWiki (mesma
 * wiki dos sprites — ver game-icon.ts). Diferente de monstro/item, essas
 * URLs não seguem o padrão de hash previsível: cada vocação tem um arquivo
 * "<Nome>_artwork.png" com hash próprio, então resolvi cada uma manualmente
 * no navegador em vez de tentar calcular. O Monge não tem uma arte de
 * personagem limpa na wiki (só um concept-art com várias poses juntas),
 * então usei o sprite do outfit dele como alternativa.
 */
export const VOCATION_PORTRAITS: Record<string, string> = {
  "Elite Knight": "https://www.tibiawiki.com.br/images/a/aa/Knight_artwork.png",
  "Royal Paladin": "https://www.tibiawiki.com.br/images/f/f2/Paladin_artwork.png",
  "Elder Druid": "https://www.tibiawiki.com.br/images/4/48/Druid_artwork.png",
  "Master Sorcerer": "https://www.tibiawiki.com.br/images/c/cf/Sorcerer_artwork.png",
  "Exalted Monk": "https://www.tibiawiki.com.br/images/9/92/Outfit_Monk_Male.gif",
};
