// Gera src/data/sprite-ids-data.ts: o id de cada item e o visual (outfit) de cada monstro, tirados
// de servidores abertos de Tibia: o Canary (opentibiabr/canary), em que o RubinOT se baseia, e o
// Crystal Server (zimbadev/crystalserver), que tem os monstros e itens mais novos. Com isso o
// GameIcon monta a imagem sem depender da TibiaWiki, que desde 25/11/2026 bloqueia imagem puxada
// de outro site.
//
// Uso (clone parcial de cada um; arquivo .xml = itens, pasta = monstros; o primeiro que tiver o
// nome ganha):
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/zimbadev/crystalserver.git crystal
//   git -C crystal sparse-checkout set data/items data-global/monster
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/opentibiabr/canary.git canary
//   git -C canary sparse-checkout set data/items data-otservbr-global/monster
//   node scripts/gerar-sprites.mjs crystal/data/items/items.xml canary/data/items/items.xml \
//     canary/data-otservbr-global/monster crystal/data-global/monster
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sources = process.argv.slice(2);
const itemSources = sources.filter((p) => p.endsWith(".xml"));
const monsterSources = sources.filter((p) => !p.endsWith(".xml"));
if (!itemSources.length || !monsterSources.length) {
  console.error("Uso: node scripts/gerar-sprites.mjs <items.xml>... <pasta de monstros>...");
  process.exit(1);
}
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "sprite-ids-data.ts");

// Mesma chave do lookupKey de src/lib/game-icon.ts: minúsculo, sem apóstrofo, espaços simples e
// sem "(Creature)" no fim ("Armenius (Creature)" → armenius).
const clean = (s) =>
  s.trim().replace(/\s*\([^)]*\)$/, "").replace(/['’]/g, "").replace(/\s+/g, " ").toLowerCase();

/**
 * nome → menor id entre os itens que têm peso (dá pra pegar e aparecem no loot). Item fixo, sem
 * peso (Beer Barrel, Hourglass, usados de ícone no menu), entra só se nenhum com peso tiver o nome.
 */
function readItems(xml) {
  const byName = new Map();
  const byPlural = new Map();
  const fixed = new Map();
  const keepLowest = (map, key, id) => {
    if (!map.has(key) || id < map.get(key)) map.set(key, id);
  };
  const attr = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1];
  for (const chunk of xml.split(/<item\s/).slice(1)) {
    const tagEnd = chunk.indexOf(">");
    const tag = chunk.slice(0, tagEnd);
    const name = attr(tag, "name");
    const id = Number(attr(tag, "id") ?? attr(tag, "fromid"));
    if (!name || !Number.isFinite(id) || id <= 0) continue;
    const n = clean(name);
    const selfClosing = tag.endsWith("/");
    const body = selfClosing ? "" : chunk.slice(tagEnd, chunk.indexOf("</item>"));
    if (!/key="weight"/.test(body)) {
      keepLowest(fixed, n, id);
      continue;
    }
    keepLowest(byName, n, id);
    const plural = attr(tag, "plural");
    if (plural) keepLowest(byPlural, clean(plural), id);
  }
  // Plural só entra quando não é o nome de outro item ("gold tokens" → gold token).
  for (const [p, id] of byPlural) if (!byName.has(p)) byName.set(p, id);
  for (const [n, id] of fixed) {
    if (byName.has(n)) continue;
    byName.set(n, id);
    fixedOnly.add(n);
  }
  return byName;
}
/** Nomes que só existem como item fixo: saem se forem nome de monstro (estátua "Dragon" ≠ o monstro). */
const fixedOnly = new Set();

function luaFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return luaFiles(p);
    return f.endsWith(".lua") ? [p] : [];
  });
}

/** nome → "lookType,head,body,legs,feet,addons" ou "#<id do item>" (monstro com cara de item). */
function readMonsters(dir) {
  const out = new Map();
  for (const file of luaFiles(dir).sort()) {
    const lua = readFileSync(file, "utf8");
    const name = lua.match(/createMonsterType\(\s*"([^"]+)"/)?.[1];
    const outfit = lua.match(/monster\.outfit\s*=\s*\{([^}]*)\}/)?.[1];
    if (!name || !outfit) continue;
    const num = (key) => Number(outfit.match(new RegExp(`\\b${key}\\s*=\\s*(\\d+)`))?.[1] ?? 0);
    const n = clean(name);
    if (out.has(n)) continue;
    const look = num("lookType");
    const ex = num("lookTypeEx");
    if (look > 0) {
      out.set(n, [look, num("lookHead"), num("lookBody"), num("lookLegs"), num("lookFeet"), num("lookAddons")].join(","));
    } else if (ex > 0) {
      out.set(n, `#${ex}`);
    }
  }
  return out;
}

/** Junta os mapas: o primeiro que tiver o nome ganha. */
function merge(maps) {
  const out = new Map();
  for (const map of maps) for (const [k, v] of map) if (!out.has(k)) out.set(k, v);
  return out;
}

const items = merge(itemSources.map((p) => readItems(readFileSync(p, "utf8"))));
const monsters = merge(monsterSources.map((p) => readMonsters(p)));

// Item fixo só fica se for nome de ícone escrito no código do app ("Beer Barrel" no menu) e não for
// nome de monstro: são milhares (paredes, chão, estátuas) e o arquivo ficaria pesado à toa.
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const appText = (function read(dir) {
  return readdirSync(dir)
    .map((f) => {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) return read(p);
      return /\.tsx?$/.test(f) && f !== "sprite-ids-data.ts" ? readFileSync(p, "utf8") : "";
    })
    .join("\n");
})(SRC).toLowerCase();
for (const n of fixedOnly) {
  if (monsters.has(n) || !appText.includes(`"${n}"`)) items.delete(n);
}
const tsv = (map) => [...map].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}|${v}`).join("\n");

writeFileSync(
  OUT,
  `// Gerado por scripts/gerar-sprites.mjs a partir do Crystal Server e do Canary. Não editar à mão.
// Itens: nome (e plural) em minúsculo | id do item no cliente.
// Monstros: nome em minúsculo | lookType,head,body,legs,feet,addons, ou #id quando o monstro é um item.
export const ITEM_SPRITE_IDS = \`${tsv(items)}\`;

export const MONSTER_OUTFITS = \`${tsv(monsters)}\`;
`,
);
const both = [...monsters.keys()].filter((n) => items.has(n));
console.log(`itens: ${items.size} | monstros: ${monsters.size} | nome nos dois: ${both.length}`);
console.log(both.join(", "));
