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

/**
 * Banners de vocação usados no filtro da Comunidade — vêm da própria wiki.rubinot.com
 * (banners/vocations/<nome>.png e <nome>-selected.png), não da TibiaWiki. O nome do
 * arquivo já segue o nome-base do outfit em inglês (knight/paladin/sorcerer/druid/monk),
 * igual ao mapeamento usado em VOCATION_PORTRAITS.
 */
export const VOCATION_BANNERS: Record<string, { default: string; selected: string }> = {
  "Elite Knight": {
    default: "https://wiki.rubinot.com/banners/vocations/knight.png",
    selected: "https://wiki.rubinot.com/banners/vocations/knight-selected.png",
  },
  "Royal Paladin": {
    default: "https://wiki.rubinot.com/banners/vocations/paladin.png",
    selected: "https://wiki.rubinot.com/banners/vocations/paladin-selected.png",
  },
  "Elder Druid": {
    default: "https://wiki.rubinot.com/banners/vocations/druid.png",
    selected: "https://wiki.rubinot.com/banners/vocations/druid-selected.png",
  },
  "Master Sorcerer": {
    default: "https://wiki.rubinot.com/banners/vocations/sorcerer.png",
    selected: "https://wiki.rubinot.com/banners/vocations/sorcerer-selected.png",
  },
  "Exalted Monk": {
    default: "https://wiki.rubinot.com/banners/vocations/monk.png",
    selected: "https://wiki.rubinot.com/banners/vocations/monk-selected.png",
  },
};

/**
 * Cor-tema de cada vocação (puxa das mesmas variáveis --rubi-* usadas no resto do
 * app, exceto o roxo do Sorcerer, que reaproveita o mesmo oklch já usado em
 * TYPE_COLORS nos gráficos de dano). Usada pra destacar o card de filtro quando
 * uma vocação está selecionada.
 */
export const VOCATION_THEME: Record<string, string> = {
  "Elite Knight": "var(--rubi-danger)",
  "Royal Paladin": "var(--rubi-blue)",
  "Elder Druid": "var(--rubi-success)",
  "Master Sorcerer": "oklch(0.7 0.18 300)",
  "Exalted Monk": "var(--rubi-gold)",
};
