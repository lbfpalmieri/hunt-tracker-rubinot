import {
  Beer,
  BookOpen,
  BookmarkCheck,
  Castle,
  Coins,
  Crown,
  Gauge,
  Gem,
  Info,
  MessageSquarePlus,
  Scale,
  ScrollText,
  ShieldUser,
  Skull,
  Swords,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Fonte única dos itens de navegação (menu lateral no desktop, barra de baixo + "Menu" no
 * celular). Página nova entra AQUI — e só aqui. O usuário decide quais ficam fixados no topo
 * (ver nav-prefs.ts); tudo que não estiver fixado aparece agrupado.
 */
export type NavGroupId = "cacada" | "covil" | "oficina" | "heroi" | "taverna" | "biblioteca";

export const NAV_GROUPS: { id: NavGroupId; label: string }[] = [
  { id: "cacada", label: "Caçada" },
  { id: "covil", label: "Covil" },
  { id: "oficina", label: "Oficina" },
  { id: "heroi", label: "Herói" },
  { id: "taverna", label: "Taverna" },
  { id: "biblioteca", label: "Biblioteca" },
];

interface NavItemDef {
  id: string;
  to: string;
  label: string;
  /** Rótulo curto pros blocos do celular (cabe em 2 linhas). */
  short: string;
  icon: LucideIcon;
  group: NavGroupId;
}

export const NAV_ITEMS = [
  {
    id: "dashboard",
    to: "/dashboard",
    label: "Dashboard",
    short: "Início",
    icon: Castle,
    group: "cacada",
  },
  {
    id: "import",
    to: "/import",
    label: "Nova sessão",
    short: "Nova",
    icon: Swords,
    group: "cacada",
  },
  {
    id: "sessions",
    to: "/sessions",
    label: "Sessões",
    short: "Sessões",
    icon: ScrollText,
    group: "cacada",
  },
  {
    id: "compare",
    to: "/tools/compare",
    label: "Comparar hunts",
    short: "Comparar",
    icon: Scale,
    group: "cacada",
  },
  {
    id: "ranking",
    to: "/tools/ranking",
    label: "Ranking de hunts",
    short: "Ranking",
    icon: Trophy,
    group: "cacada",
  },
  {
    id: "comparisons",
    to: "/tools/comparisons",
    label: "Comparações salvas",
    short: "Salvas",
    icon: BookmarkCheck,
    group: "cacada",
  },
  {
    id: "bosses",
    to: "/bosses",
    label: "Rotação de Bosses",
    short: "Bosses",
    icon: Crown,
    group: "covil",
  },

  {
    id: "monster-calc",
    to: "/tools/monster-calculator",
    label: "Calculadora de monstros/h",
    short: "Monstros/h",
    icon: Skull,
    group: "oficina",
  },
  {
    id: "rubini-coins",
    to: "/tools/rubini-coins",
    label: "Calculadora de Rubini Coins",
    short: "Rubini Coins",
    icon: Coins,
    group: "oficina",
  },
  {
    id: "linked-tasks",
    to: "/tools/linked-tasks",
    label: "Linked Tasks",
    short: "Linked Tasks",
    icon: Target,
    group: "oficina",
  },
  {
    id: "imbuements",
    to: "/imbuements",
    label: "Imbuements",
    short: "Imbuements",
    icon: Gem,
    group: "oficina",
  },

  {
    id: "rendimento",
    to: "/rendimento",
    label: "Meu rendimento",
    short: "Rendimento",
    icon: Gauge,
    group: "heroi",
  },
  {
    id: "overview",
    to: "/overview",
    label: "Todos os personagens",
    short: "Todos",
    icon: Users,
    group: "heroi",
  },
  {
    id: "characters",
    to: "/characters",
    label: "Personagens",
    short: "Personagens",
    icon: ShieldUser,
    group: "heroi",
  },

  {
    id: "community",
    to: "/community",
    label: "Comunidade",
    short: "Comunidade",
    icon: Beer,
    group: "taverna",
  },

  { id: "wiki", to: "/wiki", label: "Wiki", short: "Wiki", icon: BookOpen, group: "biblioteca" },
  {
    id: "feedback",
    to: "/feedback",
    label: "Sugestões e bugs",
    short: "Sugestões",
    icon: MessageSquarePlus,
    group: "biblioteca",
  },
  { id: "about", to: "/about", label: "Sobre", short: "Sobre", icon: Info, group: "biblioteca" },
] as const satisfies readonly NavItemDef[];

export type NavItem = (typeof NAV_ITEMS)[number];

/** Fixados por padrão = os 4 atalhos que já existiam na barra de baixo. */
export const DEFAULT_PINNED: string[] = ["dashboard", "import", "sessions", "community"];

/** Quantos fixados cabem na barra de baixo do celular (o 5º botão é o "Menu"). */
export const MOBILE_BAR_SLOTS = 4;

export function findNavItem(id: string): NavItem | undefined {
  return NAV_ITEMS.find((n) => n.id === id);
}

export function isNavActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

/** Item da rota atual (o de caminho mais longo, pra "/tools/x" não cair em "/tools"). */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((n) => isNavActive(pathname, n.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
}
