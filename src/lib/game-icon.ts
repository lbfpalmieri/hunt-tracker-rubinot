/**
 * Resolve as URLs do sprite de um monstro, item, magia ou perk a partir do nome, sem consultar
 * nada antes. gameIconUrls devolve a lista de tentativas em ordem e quem desenha (GameIcon, ícones
 * do gráfico de Monstros mortos, roda da Wheel) passa pra próxima quando a imagem não carrega.
 *
 * Ordem (desde 25/11/2026, quando a TibiaWiki BR passou a pedir o desafio do Cloudflare até pras
 * imagens e o link direto parou de carregar):
 * 1. Arquivo guardado no próprio site (public/img/wiki, LOCAL_FILES): charms, prey, perks, magias.
 * 2. Item: sprite oficial do Tibia pelo id do item (static.tibia.com/images/charactertrade/objects).
 * 3. Monstro: o visual (outfit) do monstro nos servidores abertos Canary (base do RubinOT) e
 *    Crystal Server, desenhado pelo outfit-images.ots.me; depois a imagem da biblioteca oficial
 *    do tibia.com (que também tem as magias, em .png).
 * 4. TibiaWiki BR, como era antes, pro dia em que ela voltar a aceitar.
 *
 * Cobertura conferida em 25/11/2026: ~94% dos monstros de monsters-data e ~95% dos itens de
 * item-info-data. Sem imagem ficam alguns bosses e itens de evento, e os perks da Wheel
 * ("Augmented ...", "The Avenger"): só a wiki tem, e ela bloqueia.
 *
 * Os ids de item e os outfits vêm de src/data/sprite-ids-data.ts (gerado por
 * scripts/gerar-sprites.mjs). O arquivo é grande (~200 KB, 67 KB comprimido), então só carrega
 * quando a primeira imagem aparece na tela: chame loadSpriteIds() antes (o hook useGameIconUrls
 * faz isso).
 *
 * A wiki roda em MediaWiki puro, que guarda cada arquivo em
 * /images/{hash[0]}/{hash[0:2]}/Nome_Do_Arquivo.ext, onde `hash` é o MD5 do nome do arquivo (com
 * underscore no lugar de espaço): dado o nome, a URL sai sem buscar nada. A grafia e a extensão
 * (gif ou png) variam; por isso há várias tentativas na wiki.
 */

const WIKI_IMAGE_BASE = "https://www.tibiawiki.com.br/images";

function md5(input: string): string {
  const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]);
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const msg = new TextEncoder().encode(input);
  const origLenBits = BigInt(msg.length) * 8n;
  const padLen = (56 - ((msg.length + 1) % 64) + 64) % 64;
  const total = msg.length + 1 + padLen + 8;
  const buf = new Uint8Array(total);
  buf.set(msg, 0);
  buf[msg.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setBigUint64(total - 8, origLenBits, true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let chunk = 0; chunk < total; chunk += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = view.getUint32(chunk + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true); ov.setUint32(4, b0, true); ov.setUint32(8, c0, true); ov.setUint32(12, d0, true);
  return [...out].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Preposições/artigos que a wiki mantém em minúsculo no Title Case, exceto quando são a 1ª palavra (ex.: "Wand_of_Starstorm.gif", não "Wand_Of_Starstorm.gif"). */
const TITLE_CASE_MINOR_WORDS = new Set(["of", "the", "a", "an", "and", "in", "on", "for", "to"]);

/**
 * MediaWiki canonicaliza o nome do arquivo: cada palavra com a 1ª letra
 * maiúscula (Title Case), espaço vira "_". Isso importa porque os itens
 * saem do Loot Statistics do Tibia todos em minúsculo ("platinum coin"),
 * diferente dos monstros, que já vêm em Title Case do Killed Monsters
 * ("Cave Chimera") — sem isso, todo item com mais de uma palavra
 * ("platinum coin", "violet crystal shard"...) gerava um hash errado e
 * caía sempre no fallback.
 */
function wikiFileBase(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const titled = trimmed
    .split(" ")
    .map((word, i) => {
      if (!word) return word;
      if (i > 0 && TITLE_CASE_MINOR_WORDS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
  return titled.replace(/ /g, "_");
}

function urlFor(filename: string): string {
  const hash = md5(filename);
  return `${WIKI_IMAGE_BASE}/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`;
}

/** Toda palavra com a 1ª letra maiúscula, inclusive "of/the/a" e depois de hífen ("Two-Headed_Turtle"). */
function allWordsCapitalized(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[ -])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/ /g, "_");
}

/**
 * Criaturas que a wiki guarda como "Nome (Criatura)", porque o nome puro é de outra página (NPC,
 * item, quest...): "Sabretooth.gif" nem existe e "Slime.gif"/"Monk.gif" são outra imagem. Lista
 * tirada de src/data/monsters-data.ts (nomes com "(Criatura)") e conferida no CDN em 2026-11-09.
 */
const CREATURE_PAGE = new Set(
  [
    "Armenius", "Avalanche", "Bolfrim", "Chayenne", "Count Tofifti", "Craban", "Denson Larika",
    "Devourer", "Hacker", "Lyxoph", "Mirade", "Monk", "Owin", "Penciljack", "Pythius the Rotten",
    "Sabretooth", "Slime", "The First Dragon", "Wrath of the Emperor", "Yalahari",
  ].map((n) => n.toLowerCase()),
);

/**
 * Todas as URLs a tentar, em ordem (.gif e .png de cada): Title Case com "of/the/a" minúsculos;
 * toda palavra maiúscula; o nome exatamente como veio. A wiki não segue uma regra só — o jogo
 * escreve "Cloak of Terror", mas o arquivo é "Cloak_Of_Terror.gif" (44 criaturas assim, entre elas
 * "Memory of a Banshee" e "Amenef the Burning", e as com hífen, "Two-Headed_Turtle.gif", na
 * conferência de 2026-11-09), enquanto "Wand_of_Starstorm.gif" segue a regra. Criatura de página
 * "(Criatura)" tenta essa primeiro. Nome que já vem certo acerta na primeira.
 */
export function wikiIconUrls(name: string): string[] {
  const base = wikiFileBase(name);
  if (!base) return [];
  const raw = name.trim().replace(/\s+/g, "_");
  const exact = raw.charAt(0).toUpperCase() + raw.slice(1);
  const bases = [base, allWordsCapitalized(name), exact];
  if (CREATURE_PAGE.has(name.trim().replace(/\s+/g, " ").toLowerCase())) bases.unshift(`${base}_(Criatura)`);
  return [...new Set(bases)].flatMap((b) => [urlFor(`${b}.gif`), urlFor(`${b}.png`)]);
}

/**
 * Arquivos em public/img/wiki (copiados da TibiaWiki BR). O nome do arquivo sem extensão, com
 * espaço no lugar de "_", é o nome que acha ele ("Carnage_Icon.gif" ← "Carnage Icon").
 */
const LOCAL_FILES = [
  "Adrenaline_Burst_Icon.gif", "Bless_Icon.gif", "Bounty_Talisman.gif", "Carnage_Icon.gif",
  "Cleanse_Icon.gif", "Cripple_Icon.gif", "Curse_Icon.gif", "Divine_Wrath_Icon.gif", "Dodge_Icon.gif",
  "Enflame_Icon.gif", "Fatal_Hold_Icon.gif", "Freeze_Icon.gif", "Gut_Icon.gif", "Improved_loot.png",
  "Low_Blow_Icon.gif", "Momentum.gif", "Numb_Icon.gif", "Onslaught.gif", "Outfit_Druid_Male.gif",
  "Outfit_Hunter_Male.gif", "Outfit_Knight_Male.gif", "Outfit_Mage_Male.gif", "Outfit_Monk_Male.gif",
  "Overflux_Icon.gif", "Overpower_Icon.gif", "Parry_Icon.gif", "Poison_Icon.gif", "Prey_damage.png",
  "Prey_reduction.png", "Prey_xp.png", "Ruse.gif", "Savage_Blow_Icon.gif", "Scavenge_Icon.gif",
  "Transcendence.gif", "Vampiric_Embrace_Icon.gif", "Void_Inversion_Icon.gif", "Voids_Call_Icon.gif",
  "Wheel_of_Destiny_Icon.gif", "Wound_Icon.gif", "Zap_Icon.gif",
];

/** Chave de busca: minúsculo, espaços simples, sem "(Item)"/"(Criatura)" no fim e sem apóstrofo. */
function lookupKey(name: string): string {
  return name
    .trim()
    .replace(/\s*\([^)]*\)$/, "")
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const LOCAL_ICONS = new Map(
  LOCAL_FILES.map((f) => [lookupKey(f.replace(/\.[a-z]+$/, "").replace(/_/g, " ")), `/img/wiki/${f}`]),
);

type SpriteIds = { items: Map<string, number>; monsters: Map<string, string> };
let spriteIds: SpriteIds | null = null;
let loading: Promise<void> | null = null;

function parseTsv(tsv: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of tsv.split("\n")) {
    const bar = line.indexOf("|");
    if (bar > 0) map.set(line.slice(0, bar), line.slice(bar + 1));
  }
  return map;
}

/** Já carregou os ids de item e os outfits de monstro? */
export function spriteIdsLoaded(): boolean {
  return spriteIds !== null;
}

/** Carrega (uma vez só) src/data/sprite-ids-data.ts. Se falhar, tenta de novo na próxima chamada. */
export function loadSpriteIds(): Promise<void> {
  loading ??= import("@/data/sprite-ids-data")
    .then((m) => {
      const items = new Map<string, number>();
      for (const [k, v] of parseTsv(m.ITEM_SPRITE_IDS)) items.set(k, Number(v));
      spriteIds = { items, monsters: parseTsv(m.MONSTER_OUTFITS) };
    })
    .catch((err: unknown) => {
      loading = null;
      throw err;
    });
  return loading;
}

const itemObjectUrl = (id: number) => `https://static.tibia.com/images/charactertrade/objects/${id}.gif`;

/** "lookType,head,body,legs,feet,addons" (ou "#id" pra monstro que é um item) → URL da imagem. */
function monsterUrl(outfit: string): string {
  if (outfit.startsWith("#")) return itemObjectUrl(Number(outfit.slice(1)));
  const [type, head, body, legs, feet, addons] = outfit.split(",");
  return (
    `https://outfit-images.ots.me/latest_walk/animoutfit.php?id=${type}&addons=${addons}` +
    `&head=${head}&body=${body}&legs=${legs}&feet=${feet}&mount=0&direction=3`
  );
}

/**
 * Biblioteca do tibia.com: nome sem espaço nem sinal ("Two-Headed Turtle" → twoheadedturtle).
 * Criatura em .gif; magia (Avatar of Steel, Divine Grenade...) em .png.
 */
const libraryUrl = (key: string, ext: "gif" | "png" = "gif") =>
  `https://static.tibia.com/images/library/${key.replace(/[^a-z0-9]/g, "")}.${ext}`;

/**
 * Todas as URLs a tentar, em ordem (ver o topo do arquivo). Sem loadSpriteIds() antes, pula o
 * item e o outfit do monstro. Nome que é item e monstro ao mesmo tempo ("Bat", "Scorpion",
 * "Fiery Heart"): em minúsculo (loot do Hunting Analyser) o item vem primeiro; com maiúscula
 * (Killed Monsters, listas do app), o monstro.
 */
export function gameIconUrls(name: string): string[] {
  const key = lookupKey(name);
  if (!key) return [];
  const urls: string[] = [];
  const local = LOCAL_ICONS.get(key);
  if (local) urls.push(local);
  const item = spriteIds?.items.get(key);
  const outfit = spriteIds?.monsters.get(key);
  const itemUrl = item ? itemObjectUrl(item) : null;
  const creatureUrls = outfit
    ? [monsterUrl(outfit), libraryUrl(key)]
    : item
      ? []
      : [libraryUrl(key), libraryUrl(key, "png")];
  const lowercase = name.trim() === name.trim().toLowerCase();
  if (itemUrl && (lowercase || !outfit)) urls.push(itemUrl, ...creatureUrls);
  else urls.push(...creatureUrls, ...(itemUrl ? [itemUrl] : []));
  urls.push(...wikiIconUrls(name));
  return [...new Set(urls)];
}
