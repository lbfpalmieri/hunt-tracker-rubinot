/**
 * Sprite do outfit de cada vocação, puxado direto da TibiaWiki (mesma wiki
 * dos sprites de monstro/item — ver game-icon.ts). Usa o outfit BASE de
 * cada vocação (o nome do outfit no jogo não é igual ao nome da vocação
 * promovida — ex.: o outfit do Royal Paladin se chama "Hunter", o do
 * Master Sorcerer se chama "Mage"), resolvido manualmente no navegador já
 * que esses arquivos não seguem um padrão de nome previsível como os de
 * monstro/item (ver nota em rubinot-tibiawiki-sprites na memória).
 */
export const VOCATION_PORTRAITS: Record<string, string> = {
  "Elite Knight": "https://www.tibiawiki.com.br/images/d/d6/Outfit_Knight_Male.gif",
  "Royal Paladin": "https://www.tibiawiki.com.br/images/5/5c/Outfit_Hunter_Male.gif",
  "Elder Druid": "https://www.tibiawiki.com.br/images/c/c9/Outfit_Druid_Male.gif",
  "Master Sorcerer": "https://www.tibiawiki.com.br/images/6/63/Outfit_Mage_Male.gif",
  "Exalted Monk": "https://www.tibiawiki.com.br/images/9/92/Outfit_Monk_Male.gif",
};
