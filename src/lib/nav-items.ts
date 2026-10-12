import {
  Beer,
  BookOpen,
  BookmarkCheck,
  Castle,
  Coins,
  Crown,
  Disc3,
  Gauge,
  Gem,
  Info,
  MessageSquarePlus,
  Scale,
  ScrollText,
  ShieldUser,
  Shirt,
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
  /** Sprite do jogo (TibiaWiki, via GameIcon) mostrado no menu — `icon` é o reserva se a imagem falhar. */
  sprite: string;
  group: NavGroupId;
  /** Páginas irmãs que dividem este item do menu como abas (a 1ª é a do próprio item). */
  tabs?: readonly { to: string; label: string }[];
}

export const NAV_ITEMS = [
  {
    id: "dashboard",
    to: "/dashboard",
    label: "Dashboard",
    short: "Início",
    icon: Castle,
    sprite: "Crystal Ball",
    group: "cacada",
  },
  {
    id: "import",
    to: "/import",
    label: "Nova sessão",
    short: "Nova",
    icon: Swords,
    sprite: "Quill",
    group: "cacada",
  },
  {
    id: "sessions",
    to: "/sessions",
    label: "Sessões",
    short: "Sessões",
    icon: ScrollText,
    sprite: "Red Tome",
    group: "cacada",
  },
  {
    id: "compare",
    to: "/tools/compare",
    label: "Comparar hunts",
    short: "Comparar",
    icon: Scale,
    sprite: "Treasure Map",
    group: "cacada",
  },
  {
    id: "ranking",
    to: "/tools/ranking",
    label: "Ranking de hunts",
    short: "Ranking",
    icon: Trophy,
    sprite: "Medal of Valiance",
    group: "cacada",
  },
  {
    id: "comparisons",
    to: "/tools/comparisons",
    label: "Comparações salvas",
    short: "Salvas",
    icon: BookmarkCheck,
    sprite: "Silken Bookmark",
    group: "cacada",
  },
  {
    id: "bosses",
    to: "/bosses",
    label: "Rotação de Bosses",
    short: "Bosses",
    icon: Crown,
    sprite: "Dragon Figurine",
    group: "covil",
  },

  {
    id: "monster-calc",
    to: "/tools/monster-calculator",
    label: "Calculadoras",
    short: "Calculadoras",
    tabs: [
      { to: "/tools/monster-calculator", label: "Monstros/h e Bounty" },
      { to: "/tools/rubini-coins", label: "Rubini Coins" },
    ],
    icon: Skull,
    sprite: "Hourglass",
    group: "oficina",
  },
  {
    id: "linked-tasks",
    to: "/tools/linked-tasks",
    label: "Linked Tasks",
    short: "Linked Tasks",
    icon: Target,
    sprite: "Scroll of Heroic Deeds",
    group: "oficina",
  },
  {
    id: "imbuements",
    to: "/imbuements",
    label: "Imbuements",
    short: "Imbuements",
    icon: Gem,
    sprite: "Blank Imbuement Scroll",
    group: "oficina",
  },

  {
    id: "rendimento",
    to: "/rendimento",
    label: "Rendimento",
    short: "Rendimento",
    tabs: [
      { to: "/rendimento", label: "Meu rendimento" },
      { to: "/overview", label: "Todos os personagens" },
    ],
    icon: Gauge,
    sprite: "Golden Goblet",
    group: "heroi",
  },
  {
    id: "equipment",
    to: "/equipamentos",
    label: "Meus sets",
    short: "Sets",
    icon: Shirt,
    sprite: "Magic Plate Armor",
    group: "heroi",
  },
  {
    id: "wheels",
    to: "/rodas",
    label: "Minhas rodas",
    short: "Rodas",
    icon: Disc3,
    sprite: "Wheel of Destiny Icon",
    group: "heroi",
  },
  {
    id: "characters",
    to: "/characters",
    label: "Personagens",
    short: "Personagens",
    icon: ShieldUser,
    sprite: "Royal Helmet",
    group: "heroi",
  },

  {
    id: "community",
    to: "/community",
    label: "Comunidade",
    short: "Comunidade",
    icon: Beer,
    sprite: "Beer Barrel",
    group: "taverna",
  },

  {
    id: "wiki",
    to: "/wiki",
    label: "Wiki",
    short: "Wiki",
    icon: BookOpen,
    sprite: "Gemmed Book",
    group: "biblioteca",
  },
  {
    id: "feedback",
    to: "/feedback",
    label: "Sugestões e bugs",
    short: "Sugestões",
    icon: MessageSquarePlus,
    sprite: "Letter",
    group: "biblioteca",
  },
  {
    id: "about",
    to: "/about",
    label: "Sobre",
    short: "Sobre",
    icon: Info,
    sprite: "Parchment",
    group: "biblioteca",
  },
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

/** Abas do item (vazio se ele não divide a página com outras). */
export function navTabs(n: NavItem): readonly { to: string; label: string }[] {
  return "tabs" in n ? n.tabs : [];
}

/** O item está ativo na rota atual? Vale também quando a rota é uma das abas dele. */
export function isItemActive(pathname: string, n: NavItem): boolean {
  return isNavActive(pathname, n.to) || navTabs(n).some((t) => isNavActive(pathname, t.to));
}

/** Última aba usada de cada item com abas (guardada só neste navegador). */
const TAB_KEY = "rubinot:last-tab:";

export function rememberTab(itemId: string, to: string): void {
  try {
    localStorage.setItem(TAB_KEY + itemId, to);
  } catch {
    // sem localStorage: sem memória, abre na 1ª aba
  }
}

/** Pra onde o menu leva: a última aba usada, se ela ainda existir; senão a 1ª. */
export function navTarget(n: NavItem): string {
  const tabs = navTabs(n);
  if (!tabs.length) return n.to;
  try {
    const last = localStorage.getItem(TAB_KEY + n.id);
    if (last && tabs.some((t) => t.to === last)) return last;
  } catch {
    // ignora
  }
  return n.to;
}

/** Item da rota atual (o de caminho mais longo, pra "/tools/x" não cair em "/tools"). */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((n) => isItemActive(pathname, n)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
}
