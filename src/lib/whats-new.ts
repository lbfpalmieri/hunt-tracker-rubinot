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
