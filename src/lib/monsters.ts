import { MONSTERS_TSV } from "@/data/monsters-data";

/**
 * Criaturas da TibiaWiki (src/data/monsters-data.ts) pro Hunt Advisor: HP, XP, charm points,
 * fraqueza por elemento (quanto de dano a criatura toma) e o maior dano de cada ataque por elemento.
 * O arquivo de dados só é importado por quem usa (página do Hunt Advisor), não entra no resto do app.
 */

/** Elementos de dano "de verdade" (arma, imbuement, charm, resistência de equipamento). */
export const ELEMENTS = ["physical", "earth", "fire", "death", "energy", "holy", "ice"] as const;
export type Element = (typeof ELEMENTS)[number];

/** Elementos que um monstro pode causar (inclui os drains e afogamento). */
export const ATTACK_ELEMENTS = [...ELEMENTS, "lifedrain", "manadrain", "drown"] as const;
export type AttackElement = (typeof ATTACK_ELEMENTS)[number];

export interface MonsterInfo {
  /** Nome como na wiki ("Sabretooth (Criatura)" vira "Sabretooth" — ver `displayName`). */
  name: string;
  hp: number;
  exp: number;
  boss: boolean;
  charmPoints: number | null;
  /** % de dano que a criatura toma por elemento (100 = normal). Ausente = a wiki não informa. */
  mods: Partial<Record<Element, number>>;
  /** Maior dano por elemento; -1 = usa o elemento mas a wiki não diz quanto. */
  attacks: Partial<Record<AttackElement, number>>;
}

/** Tira o "(Criatura)" que a wiki usa quando o nome colide com outra página (item, NPC...). */
export const displayName = (name: string) => name.replace(/\s*\(Criatura\)$/i, "");

const norm = (s: string) => displayName(s).trim().toLowerCase();

let cache: MonsterInfo[] | null = null;
let byName: Map<string, MonsterInfo> | null = null;

export function allMonsters(): MonsterInfo[] {
  if (cache) return cache;
  const num = (s: string | undefined) => (s && /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null);
  cache = MONSTERS_TSV.split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [name, hp, exp, boss, charm, mods = "", atk = ""] = line.split("|");
      const modVals = mods.split(",");
      const atkVals = atk.split(",");
      const m: MonsterInfo = {
        name,
        hp: num(hp) ?? 0,
        exp: num(exp) ?? 0,
        boss: boss === "1",
        charmPoints: num(charm),
        mods: {},
        attacks: {},
      };
      ELEMENTS.forEach((el, i) => {
        const v = num(modVals[i]);
        if (v != null) m.mods[el] = v;
      });
      ATTACK_ELEMENTS.forEach((el, i) => {
        const v = num(atkVals[i]);
        if (v != null && v !== 0) m.attacks[el] = v;
      });
      return m;
    });
  return cache;
}

/**
 * Criatura pelo nome do jogo (sem diferenciar maiúscula). Quando a wiki tem variações com o mesmo
 * nome ("Bear" e "Bear (Nostalgia)"), vale a página com o nome exato.
 */
export function findMonster(name: string | null | undefined): MonsterInfo | undefined {
  if (!name) return undefined;
  if (!byName) {
    byName = new Map();
    for (const m of allMonsters()) {
      const k = norm(m.name);
      if (!byName.has(k)) byName.set(k, m);
    }
  }
  return byName.get(norm(name));
}
