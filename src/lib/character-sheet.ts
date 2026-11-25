import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHARM_RULES, type CharmLevel } from "./charm-optimizer";

/**
 * FICHA DO PERSONAGEM (sugestões dos jogadores Balosin, 19/11/2026, e Yin Sylvan, 20/10/2026):
 * skills base, Loyalty, os níveis do Bounty Talisman e os charms (major e minor) com o nível de cada
 * um. Fica numa tabela própria (character_sheets, uma linha por personagem, a ficha em jsonb) pra não
 * mexer na tabela de personagens: sem a tabela no banco, a ficha só volta vazia.
 *
 * Regras (TibiaWiki BR, conferidas em 2026-11-25):
 *  - Charms: https://www.tibiawiki.com.br/wiki/Charms (níveis Desbloqueado, 2 e 3).
 *  - Bounty Talisman: https://www.tibiawiki.com.br/wiki/Bounty_Tasks — Dano, Life Leech e Loot
 *    sobem 0,5% por nível até 10% (nível 20) e 0,25% por nível depois disso.
 *  - Loyalty: https://www.tibiawiki.com.br/wiki/Sistema_de_Lealdade — 1 ponto por dia de premium,
 *    +5% nos pontos de skill a cada 360 pontos (máximo 50%) e o título pela faixa de pontos.
 */

export const SKILLS = [
  { key: "magic", label: "Magic Level" },
  { key: "fist", label: "Fist Fighting" },
  { key: "club", label: "Club Fighting" },
  { key: "sword", label: "Sword Fighting" },
  { key: "axe", label: "Axe Fighting" },
  { key: "distance", label: "Distance Fighting" },
  { key: "shielding", label: "Shielding" },
] as const;
export type SkillKey = (typeof SKILLS)[number]["key"];

export const TALISMAN_BONUSES = [
  { key: "damage", label: "Dano" },
  { key: "lifeLeech", label: "Life Leech" },
  { key: "loot", label: "Loot" },
] as const;
export type TalismanBonus = (typeof TALISMAN_BONUSES)[number]["key"];

export interface CharacterSheet {
  /** Skill base (sem bônus de equipamento). Ausente = não informado. */
  skills: Partial<Record<SkillKey, number>>;
  /** Pontos de Loyalty (null = não informado). */
  loyalty: number | null;
  /** NÍVEL de cada bônus do Bounty Talisman (a % sai de `talismanPct`). */
  talisman: Partial<Record<TalismanBonus, number>>;
  /** Charms que o personagem tem, com o nível (1 = desbloqueado). Ausente = não tem. */
  charms: Partial<Record<string, CharmLevel>>;
}

export const EMPTY_SHEET: CharacterSheet = { skills: {}, loyalty: null, talisman: {}, charms: {} };

/** Limites do que a ficha aceita (folgados; servem só pra barrar número digitado errado). */
export const LIMITS = { skill: 400, magic: 200, loyalty: 20000, talisman: 100 } as const;

function intIn(v: unknown, max: number): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= 0 && i <= max ? i : null;
}

const CHARM_NAMES = new Set(CHARM_RULES.map((r) => r.name));

/**
 * Ficha limpa a partir do que veio do banco (ou de um formulário): só skills, bônus e charms que o
 * app conhece, com número inteiro dentro do limite. Qualquer outra coisa é descartada.
 */
export function normalizeSheet(value: unknown): CharacterSheet {
  const src = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

  const skills: CharacterSheet["skills"] = {};
  const rawSkills = obj(src.skills);
  for (const { key } of SKILLS) {
    const n = intIn(rawSkills[key], key === "magic" ? LIMITS.magic : LIMITS.skill);
    if (n != null) skills[key] = n;
  }

  const talisman: CharacterSheet["talisman"] = {};
  const rawTalisman = obj(src.talisman);
  for (const { key } of TALISMAN_BONUSES) {
    const n = intIn(rawTalisman[key], LIMITS.talisman);
    if (n != null && n > 0) talisman[key] = n;
  }

  const charms: CharacterSheet["charms"] = {};
  for (const [name, lvl] of Object.entries(obj(src.charms))) {
    if (CHARM_NAMES.has(name) && (lvl === 1 || lvl === 2 || lvl === 3)) charms[name] = lvl;
  }

  return { skills, loyalty: intIn(src.loyalty, LIMITS.loyalty), talisman, charms };
}

/** % de um bônus (Dano, Life Leech ou Loot) do Bounty Talisman no nível. */
export function talismanPct(level: number): number {
  const l = Math.max(0, Math.floor(level));
  return 0.5 * Math.min(l, 20) + 0.25 * Math.max(0, l - 20);
}

/** Bônus de Loyalty nos pontos de skill: +5% a cada 360 pontos, no máximo 50%. */
export function loyaltyBonusPct(points: number): number {
  return Math.min(50, Math.floor(Math.max(0, points) / 360) * 5);
}

const LOYALTY_TITLES: [number, string][] = [
  [7000, "Enlightened of Tibia"],
  [6000, "Savant of Tibia"],
  [5000, "Sage of Tibia"],
  [4000, "Guardian of Tibia"],
  [3000, "Keeper of Tibia"],
  [2000, "Warrior of Tibia"],
  [1000, "Squire of Tibia"],
  [400, "Warden of Tibia"],
  [200, "Steward of Tibia"],
  [100, "Sentinel of Tibia"],
  [50, "Scout of Tibia"],
];

/** Título de Loyalty pelos pontos (null abaixo de 50). */
export function loyaltyTitle(points: number): string | null {
  return LOYALTY_TITLES.find(([min]) => points >= min)?.[1] ?? null;
}

/** A ficha tem alguma coisa preenchida? */
export function sheetFilled(s: CharacterSheet): boolean {
  return (
    Object.keys(s.skills).length > 0 ||
    s.loyalty != null ||
    Object.keys(s.talisman).length > 0 ||
    Object.keys(s.charms).length > 0
  );
}

// ------------------------------------------------------------------ banco

// Tabela nova ainda não está nos tipos gerados.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const key = ["character-sheets"] as const;

/** Fichas de todos os personagens do usuário, por id. Sem a tabela ainda: mapa vazio. */
export function useCharacterSheets() {
  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<Record<string, CharacterSheet>> => {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) return {};
      const { data, error } = await db
        .from("character_sheets")
        .select("character_id, sheet")
        .eq("user_id", uid);
      if (error) return {};
      const out: Record<string, CharacterSheet> = {};
      for (const r of (data ?? []) as { character_id: string; sheet: unknown }[]) {
        out[r.character_id] = normalizeSheet(r.sheet);
      }
      return out;
    },
  });
}

export function useSaveCharacterSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, sheet }: { characterId: string; sheet: CharacterSheet }) => {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id;
      if (!uid) throw new Error("Sessão expirada — entre de novo.");
      const { error } = await db.from("character_sheets").upsert(
        {
          character_id: characterId,
          user_id: uid,
          sheet: normalizeSheet(sheet),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "character_id" },
      );
      if (error) {
        // 42P01 (Postgres) / PGRST205 (PostgREST): a tabela ainda não foi criada no banco.
        if (error.code === "42P01" || error.code === "PGRST205")
          throw new Error(
            "A ficha ainda não pode ser salva: falta uma atualização do banco. Tente mais tarde.",
          );
        throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
