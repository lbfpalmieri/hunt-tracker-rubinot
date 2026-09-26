import { fmtDay } from "./period";

/**
 * Feed de novidades do app — cadastre uma entrada aqui sempre que lançar algo
 * que valha a pena o jogador saber (não é changelog técnico, é "o que mudou
 * pra você"). Mais recente primeiro (index 0). O sino no header
 * (WhatsNewBell) mostra uma bolinha enquanto a entrada mais nova não foi
 * vista — ver whats-new-announcement.ts.
 */
export interface WhatsNewEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  description: string;
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "session-wizard",
    date: "2026-09-26",
    title: "Nova sessão em passos",
    description:
      "Colou o Hunting Analyser, aparece o botão Adicionar sessão: um assistente te leva pelo nome da hunt (com as sugestões), Bounty Task (Sim/Não, no formato do Task Board do jogo: dificuldade, criatura, escudo Silver/Gold e XP da recompensa), Prey (Sim/Não, com os slots do jogo) e, no fim, level, equipamento e observação opcionais.",
  },
  {
    id: "prey-slots",
    date: "2026-09-26",
    title: "Prey do jeito do jogo",
    description:
      "O seletor de Prey na Nova sessão e na sessão salva agora segue a janela Prey Creatures do jogo: 3 slots (o 3º é o slot comprado na Store), uma criatura por slot, um bônus por criatura, com as bandeiras do jogo e as estrelas que definem o percentual (Dano 7–25%, Redução 12–30%, XP e Loot 13–40%). Sessões antigas continuam como estavam.",
  },
  {
    id: "levels-in-period",
    date: "2026-09-26",
    title: "Níveis no período",
    description:
      "Em Meu rendimento → Visão geral, um card novo mostra quantos níveis você subiu no período escolhido (hoje, semana, mês, tudo ou personalizado), com base nos níveis que você marca.",
  },
  {
    id: "boss-rotation",
    date: "2026-09-26",
    title: "Rotação de Bosses",
    description:
      "Área nova no menu (Covil): catálogo com os bosses da TibiaWiki — vida, XP, cooldown, fraquezas e loot por raridade — separado em solo e time. Monte suas rotações, veja os melhores drops possíveis e o loot valioso que não é raro, registre cada rotação colando o Hunting Analyser e acompanhe o lucro de cada rotação (só o loot que cai de boss, sem o dos monstros do caminho), lucro por boss, drops e quando cada boss volta.",
  },
  {
    id: "sidebar-menu",
    date: "2026-09-25",
    title: "Menu novo: lateral no computador, mais limpo no celular",
    description:
      "No computador o menu agora fica na lateral esquerda: recolhido mostra só os ícones, abre ao passar o mouse e dá pra fixar aberto (botão dourado na borda). Itens agrupados em Caçada, Oficina, Herói, Taverna e Biblioteca. Em Personalizar menu você escolhe o que fica fixado no topo e a ordem. No celular, a barra de baixo usa os seus fixados e o botão Menu abre tudo em ícones grandes.",
  },
  {
    id: "linked-tasks-progress",
    date: "2026-09-25",
    title: "Progresso nas Linked Tasks",
    description:
      "Marque cada task como concluída com o ✓. Barra de progresso geral e por sala, contador em cada sala e botões para marcar a sala toda ou todas as tasks de uma vez.",
  },
  {
    id: "feedback-image",
    date: "2026-09-25",
    title: "Imagem no report de bug",
    description:
      "Ao enviar sugestão ou bug, agora dá para anexar uma imagem (até 5MB). Só você e o admin conseguem vê-la. Tickets resolvidos ficam num histórico.",
  },
  {
    id: "imbuements-multi",
    date: "2026-09-25",
    title: "Imbuements: vários no mesmo item",
    description:
      "Corrigido: um item aceita vários imbuements de tipos diferentes ao mesmo tempo. O tempo restante agora é informado em horas e minutos, igual aparece no jogo.",
  },
  {
    id: "session-per-hour-fix",
    date: "2026-09-24",
    title: "XP/h da sessão mais preciso",
    description:
      "Raw XP/h, Dano/h e Cura/h da sessão agora são calculados pela duração real da própria sessão, batendo com o que você fez de verdade.",
  },
  {
    id: "linked-tasks",
    date: "2026-09-23",
    title: "Linked Tasks",
    description:
      "Todas as salas e tasks do RubinOT num só lugar, com busca por task ou criatura. Cada task mostra qual elemento é mais eficaz contra as criaturas dela, baseado em dados reais da TibiaWiki.",
  },
  {
    id: "linked-task-calc",
    date: "2026-09-21",
    title: "Calculadora de Linked Task",
    description:
      "A calculadora de Bounty Task agora também calcula Linked Task: escolha vários monstros, informe o total de kills e veja em qual hunt você termina mais rápido.",
  },
  {
    id: "rc-calculator",
    date: "2026-09-20",
    title: "Calculadora de Rubini Coins",
    description:
      "Informe o preço do RC e quanto gold quer juntar — a calculadora diz quantos RC vender. Salva o preço do dia e mostra um gráfico da variação por servidor.",
  },
  {
    id: "community-vocation-outfits",
    date: "2026-09-17",
    title: "Vocação com outfit na Comunidade",
    description:
      "O filtro de vocação e o avatar de cada sessão agora mostram o sprite do outfit de cada vocação, puxado direto da wiki — sem mais bolinha com iniciais.",
  },
  {
    id: "hunt-dashboard-element",
    date: "2026-09-16",
    title: "Dashboard da hunt: elemento mais forte",
    description:
      "O Dashboard de cada hunt agora sugere qual elemento é mais eficaz contra os monstros dela, com base em dados reais da TibiaWiki.",
  },
];

export function latestWhatsNew(): WhatsNewEntry | null {
  return WHATS_NEW[0] ?? null;
}

/** "YYYY-MM-DD" -> Date local (evita o bug de new Date("YYYY-MM-DD") virar UTC meia-noite). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatWhatsNewDate(entry: WhatsNewEntry): string {
  return fmtDay(parseLocalDate(entry.date));
}
