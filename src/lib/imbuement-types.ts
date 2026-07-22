import img1 from "@/assets/imbuements/imb_1.gif.asset.json";
import img2 from "@/assets/imbuements/imb_2.gif.asset.json";
import img3 from "@/assets/imbuements/imb_3.gif.asset.json";
import img4 from "@/assets/imbuements/imb_4.gif.asset.json";
import img5 from "@/assets/imbuements/imb_5.gif.asset.json";
import img6 from "@/assets/imbuements/imb_6.gif.asset.json";
import img7 from "@/assets/imbuements/imb_7.gif.asset.json";
import img8 from "@/assets/imbuements/imb_8.gif.asset.json";
import img9 from "@/assets/imbuements/imb_9.gif.asset.json";
import img10 from "@/assets/imbuements/imb_10.gif.asset.json";
import img11 from "@/assets/imbuements/imb_11.gif.asset.json";
import img12 from "@/assets/imbuements/imb_12.gif.asset.json";
import img13 from "@/assets/imbuements/imb_13.gif.asset.json";
import img14 from "@/assets/imbuements/imb_14.gif.asset.json";
import img15 from "@/assets/imbuements/imb_15.gif.asset.json";
import img16 from "@/assets/imbuements/imb_16.gif.asset.json";
import img17 from "@/assets/imbuements/imb_17.gif.asset.json";
import img18 from "@/assets/imbuements/imb_18.gif.asset.json";
import img19 from "@/assets/imbuements/imb_19.gif.asset.json";
import img20 from "@/assets/imbuements/imb_20.gif.asset.json";
import img21 from "@/assets/imbuements/imb_21.gif.asset.json";
import img22 from "@/assets/imbuements/imb_22.gif.asset.json";
import img23 from "@/assets/imbuements/imb_23.gif.asset.json";
import img24 from "@/assets/imbuements/imb_24.gif.asset.json";

export type ImbuementCategory = "skill" | "elemental_damage" | "elemental_protection" | "support";

export type ImbuementType = {
  id: string;
  name: string;
  description: string;
  category: ImbuementCategory;
  icon: string;
};

export const IMBUEMENT_TYPES: ImbuementType[] = [
  { id: "blockade", name: "Blockade", description: "Skillboost de Escudo", category: "skill", icon: img1.url },
  { id: "chop", name: "Chop", description: "Skillboost de Machado", category: "skill", icon: img2.url },
  { id: "epiphany", name: "Epiphany", description: "Skillboost de Nível Mágico", category: "skill", icon: img3.url },
  { id: "precision", name: "Precision", description: "Skillboost de Distância", category: "skill", icon: img4.url },
  { id: "slash", name: "Slash", description: "Skillboost de Espada", category: "skill", icon: img5.url },
  { id: "bash", name: "Bash", description: "Skillboost de Clava", category: "skill", icon: img6.url },
  { id: "punch", name: "Punch", description: "Skillboost de Punhos", category: "skill", icon: img7.url },

  { id: "reap", name: "Reap", description: "Dano de Morte", category: "elemental_damage", icon: img8.url },
  { id: "electrify", name: "Electrify", description: "Dano de Energia", category: "elemental_damage", icon: img9.url },
  { id: "venom", name: "Venom", description: "Dano de Terra", category: "elemental_damage", icon: img10.url },
  { id: "frost", name: "Frost", description: "Dano de Gelo", category: "elemental_damage", icon: img11.url },
  { id: "scorch", name: "Scorch", description: "Dano de Fogo", category: "elemental_damage", icon: img12.url },

  { id: "cloud_fabric", name: "Cloud Fabric", description: "Proteção de Energia", category: "elemental_protection", icon: img13.url },
  { id: "demon_presence", name: "Demon Presence", description: "Proteção de Sagrado", category: "elemental_protection", icon: img14.url },
  { id: "dragon_hide", name: "Dragon Hide", description: "Proteção de Fogo", category: "elemental_protection", icon: img15.url },
  { id: "lich_shroud", name: "Lich Shroud", description: "Proteção de Morte", category: "elemental_protection", icon: img16.url },
  { id: "quara_scale", name: "Quara Scale", description: "Proteção de Gelo", category: "elemental_protection", icon: img17.url },
  { id: "snake_skin", name: "Snake Skin", description: "Proteção de Terra", category: "elemental_protection", icon: img18.url },

  { id: "featherweight", name: "Featherweight", description: "Aumento de Capacidade", category: "support", icon: img19.url },
  { id: "strike", name: "Strike", description: "Dano Crítico", category: "support", icon: img20.url },
  { id: "swiftness", name: "Swiftness", description: "Skillboost de Velocidade", category: "support", icon: img21.url },
  { id: "vampirism", name: "Vampirism", description: "Roubo de Vida", category: "support", icon: img22.url },
  { id: "vibrancy", name: "Vibrancy", description: "Remoção de Paralisia", category: "support", icon: img23.url },
  { id: "void", name: "Void", description: "Roubo de Mana", category: "support", icon: img24.url },
];

export const CATEGORY_LABEL: Record<ImbuementCategory, string> = {
  skill: "Skill",
  elemental_damage: "Dano Elemental",
  elemental_protection: "Proteção Elemental",
  support: "Suporte",
};

export function getImbuementType(id: string | null | undefined): ImbuementType | null {
  if (!id) return null;
  return IMBUEMENT_TYPES.find((t) => t.id === id) ?? null;
}
