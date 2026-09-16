/**
 * Resolve a URL do sprite de um monstro/item direto no CDN da TibiaWiki
 * brasileira (tibiawiki.com.br), sem precisar consultar nada antes.
 *
 * A wiki roda em MediaWiki puro, que guarda cada arquivo em
 * /images/{hash[0]}/{hash[0:2]}/Nome_Do_Arquivo.ext, onde `hash` é o MD5 do
 * nome do arquivo (com underscore no lugar de espaço). Esse esquema é
 * padrão do MediaWiki e determinístico — dado o nome de um monstro/item,
 * calculamos a URL sem precisar buscar nada na wiki primeiro. Só a extensão
 * (gif ou png) varia; por isso o componente GameIcon tenta .gif e cai pra
 * .png se a primeira falhar.
 *
 * Verificado manualmente: hotlink funciona (a wiki só bloqueia acesso tipo
 * bot às páginas /wiki/, não aos arquivos estáticos em /images/).
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

/** MediaWiki canonicaliza o nome do arquivo: 1ª letra maiúscula, espaço vira "_". */
function wikiFileBase(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return capitalized.replace(/ /g, "_");
}

export type GameIconExt = "gif" | "png";

/** URL do sprite de um monstro/item pelo nome. `null` se o nome for vazio. */
export function gameIconUrl(name: string, ext: GameIconExt = "gif"): string | null {
  const base = wikiFileBase(name);
  if (!base) return null;
  const filename = `${base}.${ext}`;
  const hash = md5(filename);
  return `${WIKI_IMAGE_BASE}/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`;
}
