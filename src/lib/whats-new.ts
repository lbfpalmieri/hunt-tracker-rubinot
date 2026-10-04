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
    id: "hunt-advisor",
    date: "2026-10-04",
    title: "Hunt Advisor: set recomendado, imbuements e charms pra cada hunt",
    description:
      "Nova ferramenta em Caçada → Hunt Advisor (aberta até pra quem não tem conta). Escolha uma hunt — recomendada pro seu level e vocação, da comunidade, ou montada com as criaturas — e veja: o dano que você vai tomar (real, do Input Analyser das sessões públicas, ou estimado pela TibiaWiki), as fraquezas da hunt, o set recomendado no boneco de equipamentos em 3 estilos (Defensivo, Equilibrado, Ofensivo) com alternativas pra cada slot, a proteção do set contra aquela hunt, imbuements e charms sugeridos, itens de carga pra levar na BP e o que os jogadores da comunidade usaram ali. Dá pra salvar o set recomendado direto em Meus sets e compartilhar o link. Na Linked Task, o botão Abrir no Hunt Advisor já leva as criaturas da task.",
  },
  {
    id: "wheel-card-conviction-highlight",
    date: "2026-10-03",
    title: "Wheel: habilidades de Convicção marcadas agora aparecem destacadas",
    description:
      "No card do set (Meus sets, sessão, Comunidade e Comparar), as habilidades de Convicção da Wheel — Groundshaker, Front Sweep, Battle Healing... — apareciam em cinza e pareciam desmarcadas, mesmo salvas certinho. Agora todas as marcadas ficam em dourado como no editor, com a Convicção primeiro e a Revelação depois (passe o mouse pra ver o grupo e o estágio).",
  },
  {
    id: "notes-editor-level-highlight",
    date: "2026-09-30",
    title: "Nova sessão: observação com formatação e level em destaque",
    description:
      "No último passo da Nova sessão, a observação ganhou uma barra de formatação: negrito, itálico, riscado, destaque, título, listas, checklist, citação e separador (Ctrl+B / Ctrl+I; Enter continua a lista), com a aba Visualizar. Na página da sessão ela aparece formatada e dá pra marcar os itens da checklist. O level do personagem ficou em destaque, com botões − e + pra atualizar rapidinho. O campo de print do equipamento saiu — o boneco de equipamentos do Setup já registra o que você usou.",
  },
  {
    id: "group-session-personal-analysers",
    date: "2026-09-29",
    title: "Modo Grupo: XP/h e monstros/h com o seu Hunting Analyser",
    description:
      "Na Nova sessão do Modo Grupo, além do Party Hunt Analyser, agora dá pra colar (opcional) o seu Hunting Analyser, Input Analyser e Miscellaneous — igual no Modo Solo. XP, monstros e itens vêm do seu analyser; o lucro continua sendo a sua parte da divisão da party, e a duração é a da party (os valores por hora usam ela). Com o seu Hunting Analyser a sessão volta pras médias de XP, o assistente pergunta Bounty e Prey e, se o nome do personagem não bater com ninguém da party, o app te acha pelos números do seu analyser. O Party Hunt Analyser do RubinOT (que sai igual ao Hunting Analyser, com XP 0 e sem monstros/itens) agora é reconhecido como da party. Vale pras sessões novas.",
  },
  {
    id: "visitor-community",
    date: "2026-09-28",
    title: "Comunidade aberta pra visitantes + exportar analyser da Comunidade",
    description:
      "A Comunidade, o Comparar hunts e o Sobre agora abrem sem conta: quem chega pode pesquisar as hunts, comparar e exportar o analyser — e aparecer no Google. Nas hunts da Comunidade tem o botão Analyser, que exporta a média de todos os jogadores daquela vocação (ótimo pro Guia de Build do Miguelnut), e cada sessão pública também exporta. Atenção: sessão marcada como Compartilhar na Comunidade fica visível pra qualquer pessoa, mesmo sem conta — dá pra desmarcar na página da sessão.",
  },
  {
    id: "export-analyser",
    date: "2026-09-28",
    title: "Exportar o Hunting Analyser",
    description:
      "Na página da sessão tem o botão Exportar Analyser: gera o texto no mesmo formato do Copy to Clipboard do jogo — da sessão ou da média da hunt (1 hora no seu ritmo médio, com monstros por hora). Dá pra colar em sites que leem o analyser, como o Guia de Build do Miguelnut (Hunt personalizada).",
  },
  {
    id: "sets-copy",
    date: "2026-09-27",
    title: "Duplicar e copiar partes de um set",
    description:
      "Em Meus sets, o botão Duplicar cria um set novo já igual ao escolhido — é só trocar o que muda (ex: a arma elemental). E dentro do set tem \"Copiar de outro set\": escolha o set e o que trazer (equipamento, postura ou Wheel), inclusive juntando a Wheel de um com o equipamento de outro.",
  },
  {
    id: "setup-no-skills",
    date: "2026-09-27",
    title: "Setup mais simples",
    description:
      "Saíram do setup os campos de crítico extra, skill (melee/distance/fist) e magic level — o set fica no boneco de equipamentos (com tier), postura e Wheel.",
  },
  {
    id: "gear-tiers",
    date: "2026-09-27",
    title: "Tier nos equipamentos do set",
    description:
      "Agora dá pra marcar o tier (Exaltation Forge) da arma, capacete, armadura, calça e bota — cada item só vai até o tier máximo da classe dele, igual no jogo. O set mostra a habilidade de cada tier (Onslaught, Momentum, Ruse, Transcendence e Amplification) com a chance de ativação da tabela da TibiaWiki, já somando o bônus da bota.",
  },
  {
    id: "group-session-party-only",
    date: "2026-09-27",
    title: "Modo Grupo: sessão só com o Party Hunt Analyser",
    description:
      "No Modo Grupo a Nova sessão pede só o Party Hunt Analyser (Copy to Clipboard) — ou o resultado copiado do LootSplitter do RubinOT. O app acha você na party, divide igual ao jogo e salva a sua parte, com a duração e o horário da party. O assistente fica Hunt → Grupo → Setup → Finalizar. Como o analyser da party não traz XP, essas sessões ficam fora das médias de XP. Colou o da party no Modo Solo? O app troca pro Modo Grupo sozinho.",
  },
  {
    id: "sets-no-print",
    date: "2026-09-27",
    title: "Tela de sets mais enxuta",
    description:
      "O print do set saiu — o boneco de equipamentos faz esse papel. A descrição de cada item agora quebra linha (sem rolar pro lado) e tier, skills e postura ficam ao lado do boneco, com bem menos rolagem.",
  },
  {
    id: "party-hunt-analyser",
    date: "2026-09-27",
    title: "Modo Grupo com Party Hunt Analyser e LootSplitter",
    description:
      "A Nova sessão ganhou o bloco Party Hunt Analyser (no jogo: janela Party Hunt → botão direito → Copy to Clipboard). A divisão é a mesma do LootSplitter do cliente: líder primeiro, média do balance e quem ficou acima transfere pra quem ficou abaixo — com o comando \"transfer N to Nome\" do banco pronto pra copiar. Tem os ajustes do Advanced (gasto extra por jogador e tirar alguém da divisão), aceita também o resultado copiado da janela LootSplitter e avisa se o analyser da party for de outra sessão.",
  },
  {
    id: "equipment-doll",
    date: "2026-09-27",
    title: "Equipamentos no set, igual ao inventário do jogo",
    description:
      "O setup e os seus sets ganharam o boneco de equipamentos no layout do inventário: toque no quadrado e escolha o item — cada um só mostra o que encaixa ali (capacete, armadura, anel...) e o que a sua vocação usa, com os 825 equipamentos da TibiaWiki. Paladino põe a aljava na mão do escudo, arma de duas mãos trava o escudo, e o app soma os bônus do set (skills e proteções). Aparece também na sessão, na comparação e na Comunidade.",
  },
  {
    id: "negative-balance-fix",
    date: "2026-09-27",
    title: "Correção: sessão com prejuízo aparecia como lucro",
    description:
      "Quando o Hunting Analyser fechava com Balance negativo (ex: -272k), o app salvava como +272k. Corrigido — e as sessões antigas já aparecem com o valor certo, sem precisar reimportar. Médias de lucro/h, saldo e rankings podem ter mudado por isso.",
  },
  {
    id: "party-mode",
    date: "2026-09-27",
    title: "Modo Grupo: hunts em party",
    description:
      "Novo alternador Solo / Grupo no topo. No Modo Grupo o app inteiro mostra só as hunts em party — Dashboard, Sessões, Comparar, Ranking e Comunidade — e ganha o resumo do seu grupo (com quem você mais caça, tamanho médio da party, quantas vezes foi líder). Na Nova sessão tem o passo Grupo: cole o Party Hunt Analyser e o lucro salvo vira a sua parte da divisão, mesmo sem ser o líder, com as transferências de cada um. Sessões antigas feitas em pt podem ser marcadas na página da sessão. As hunts em grupo saem das médias das suas hunts solo.",
  },
  {
    id: "boss-total-loot",
    date: "2026-09-27",
    title: "Rotação de Bosses: loot total do analyser",
    description:
      "Ao registrar uma rotação agora dá pra escolher o que entra no lucro: só o loot que cai de boss (padrão) ou o Loot total do Hunting Analyser, com o caminho incluído. A escolha fica lembrada pras próximas.",
  },
  {
    id: "item-prices",
    date: "2026-09-27",
    title: "Meus preços na Rotação de Bosses",
    description:
      "Nova aba Meus preços no Covil: guarde quanto cada item vale no market do seu servidor (drops raros, gold/silver token, delivery task...). Ao registrar uma rotação, escolha calcular com Meus preços ou com o preço de NPC — e o que você digitar lá também é salvo. Itens que ficaram de fora do loot de boss podem ser incluídos com um toque.",
  },
  {
    id: "weapons-by-vocation",
    date: "2026-09-27",
    title: "Armas da wiki no setup",
    description:
      "O campo Arma agora é uma lista com as 530 armas atuais da TibiaWiki, filtrada pela sua vocação — espadas, machados e clavas pro knight; arcos, bestas e arremesso pro paladino (com aljava); wands pro sorcerer; rods pro druid; punhos (katar, sai, claws...) pro monk. Mostra ícone, level, ataque/elemento ou dano, defesa, skills, slots de imbuement e o tier máximo.",
  },
  {
    id: "meus-sets",
    date: "2026-09-27",
    title: "Meus sets de equipamento",
    description:
      "Tela nova (menu Herói → Meus sets e o ícone azul no Dashboard): monte cada set com arma, skills, Wheel, postura e o print do equipamento, antes de caçar. Na hora de adicionar a sessão é só escolher o set — o setup e o print vão juntos, e aparecem na Comunidade se a sessão for pública.",
  },
  {
    id: "setup-presets-wheel",
    date: "2026-09-26",
    title: "Setup: presets, Wheel e charms mais fáceis",
    description:
      "Salve o setup como preset do personagem (ex.: Soulbleeder T0) e nas próximas sessões é só escolher. A Wheel of Destiny agora mostra os perks de Convicção e Revelação da sua vocação com os ícones do jogo — toque pra subir o estágio. Nos charms aparecem só os que ativaram no Miscellaneous: é só tocar nas criaturas em que cada um estava.",
  },
  {
    id: "session-setup",
    date: "2026-09-26",
    title: "Setup da sessão",
    description:
      "Novo passo (opcional) ao adicionar sessão e seção na sessão salva: arma e tier, skill, Magic Level, crítico extra, Wheel (dano e cura), postura (stance), magias aumentadas e Runas de Charm por criatura — tudo escolhido de listas da TibiaWiki. Os charms que dispararam no Miscellaneous já aparecem sugeridos. O setup aparece na comparação de sessões e, em sessões públicas, na Comunidade.",
  },
  {
    id: "admin-session-notes",
    date: "2026-09-27",
    title: "Observações lidas pela administração",
    description:
      "As observações das suas sessões continuam privadas para os outros jogadores, mas agora a administração consegue lê-las para transformar dicas de hunt (runas, skills, postura) em dados do app. Quanto mais detalhe você escrever, melhor a base de comparação fica.",
  },
  {
    id: "admin-hunt-rename",
    date: "2026-09-26",
    title: "Nomes de hunt organizados",
    description:
      "Hunts salvas com nomes estranhos agora podem ser corrigidas pela administração. Quando o nome corrigido já existe, as sessões são juntadas na mesma hunt — médias e comparativos ficam mais certos.",
  },
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
