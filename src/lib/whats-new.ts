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
    id: "dividir-lucro-boss-pt-2026-10-10",
    date: "2026-10-10",
    title: "Rotação de Bosses: dividir o lucro com a PT",
    description:
      "Fez boss com PT fixa e o loot é dividido igualmente? No registro da rotação, informe quantos jogadores e marque \"Dividir o lucro com a PT\": loot, supplies e lucro salvos passam a ser só a sua parte, e o balanço de gold do personagem fica mais real. Sugestão do Lodrak.",
  },
  {
    id: "sem-print-equipamento-2026-10-10",
    date: "2026-10-10",
    title: "Sessão sem o print do equipamento",
    description:
      "O setup da sessão (boneco de equipamentos) já mostra o que você usou, então tiramos a caixa de colar print do equipamento da página da sessão. Sessões antigas que têm print continuam mostrando e dá pra remover. Sugestão do Lodrak.",
  },
  {
    id: "corrigir-tempo-analyser",
    date: "2026-10-09",
    title: "Corrigir o tempo do analyser na hora de colar",
    description:
      "Esqueceu de colar e o analyser ficou contando? Na Nova sessão (Solo e Grupo) e no registro da Rotação de Bosses agora tem \"Corrigir tempo\": ajuste as horas/minutos (ou use −5/−10/−15/−30 min e a barrinha) e XP/h, lucro/h e kills/h são recalculados com o tempo real. Loot, XP e kills continuam os do analyser.",
  },
  {
    id: "wheel-one-click-2026-10-07",
    date: "2026-10-07",
    title: "Wheel of Destiny: um clique enche a fatia",
    description:
      "Agora é igual ao jogo: clique numa fatia (botão esquerdo ou direito) e ela enche na hora; clique de novo pra esvaziar. Pra pôr só alguns pontos, continua tendo a barra e os botões +1/+10 no painel ao lado.",
  },
  {
    id: "wheel-fixes-2026-10-07",
    date: "2026-10-07",
    title: "Wheel of Destiny: ajustes de rolagem e toque",
    description:
      "A lista de mods das gemas agora rola normalmente (com o mouse e no celular) e abre logo abaixo do campo, com busca (ex. \"vida\", \"fogo\"). Dois toques numa fatia enchem/esvaziam também no iPhone, e no celular a tela não pula mais no meio do toque. Clicar fora da roda não fecha mais a janela sem querer — e se você mudou algo, o app pergunta antes de descartar.",
  },
  {
    id: "wheel-of-destiny-planner",
    date: "2026-10-07",
    title: "Wheel of Destiny de verdade, igual ao planejador do tibia.com",
    description:
      "No setup da sessão e em Meus sets, a lista de perks virou a roda completa: coloque o level (e os Promotion Scrolls / pontos extras) que o app calcula quantos pontos você tem, distribua nas 36 fatias abrindo do centro pra fora, veja as Revelações subindo de estágio nos cantos e encaixe as gemas com os mods — os Vessels ligam cada mod e o bônus de dano e cura é calculado sozinho. A roda fica salva no set e aparece desenhada na sessão, na Comunidade e no Comparar, então dá pra ver direitinho o que mudou de uma hunt pra outra.",
  },
  {
    id: "casa-nova-2026-10-05",
    date: "2026-10-05",
    title: "O site mudou de casa",
    description:
      "O Hunt Tracker agora roda em servidores próprios (Supabase + Cloudflare). Suas sessões, personagens e configurações vieram junto — é só entrar com o mesmo Google de sempre. Também ganhamos uma página de Privacidade explicando quais dados guardamos.",
  },
  {
    id: "site-mais-leve-2026-10-05",
    date: "2026-10-05",
    title: "Site mais leve e rápido",
    description:
      "Suas sessões abrem mais rápido e os números da Comunidade são reaproveitados por mais tempo, sem buscar tudo de novo a cada visita.",
  },
  {
    id: "visual-refresh-rubinot",
    date: "2026-10-05",
    title: "Visual novo no estilo do RubinOT: menu com itens do jogo e títulos em Cinzel",
    description:
      "O menu ganhou ícones com os sprites do próprio Tibia (como na wiki e no site do RubinOT), letra maior e mais clara, o item aberto destacado em dourado e as seções em Cinzel — a mesma fonte dos títulos do site oficial, que agora também aparece no título de cada página. No topo aparece o ícone da página em que você está. Os textos secundários e as bordas ficaram mais claros (antes tudo parecia apagado) e as listas de opções do navegador agora abrem no tema escuro.",
  },
  {
    id: "calc-fixes-2026-10",
    date: "2026-10-05",
    title: "Correções nos cálculos de XP/h e nos dados dos personagens",
    description:
      "Médias de hunt (Sessões → Hunts, Comparar, Ranking): o Raw XP/h saía mais baixo quando a hunt tinha sessões sem XP conhecido (bounty sem o valor informado ou grupo só com o Party Hunt) — agora a conta usa só o tempo das sessões que têm XP. Nos cards da Comunidade o XP/h também não é mais puxado pra baixo por sessões de grupo sem XP. Nos gráficos de evolução essas sessões não aparecem mais como 0. Hunts escritas com maiúscula diferente (\"Asura\" e \"asura\") agora contam juntas no Top spot e na Calculadora de monstros/h. Renomear um personagem atualiza o nome nas sessões da Comunidade, excluir o personagem ativo já seleciona o próximo, trocar a Bounty de uma sessão não deixa mais a criatura antiga gravada, e a sugestão de nome de hunt (pelas criaturas mortas) não separa mais a mesma criatura escrita com maiúscula diferente.",
  },
  {
    id: "linked-task-advice",
    date: "2026-10-05",
    title: "Linked Tasks: dano, set sugerido, imbuements e charms em cada task",
    description:
      "Ao abrir uma Linked Task, as informações agora ficam em abas (Combate, Set, Imbuements e Recompensas — mais fácil de ler, inclusive no celular). Além do elemento mais eficaz: o dano que você vai tomar daquelas criaturas, o set sugerido pra vocação e level do seu personagem, no boneco de inventário do jogo (Defensivo, Equilibrado ou Ofensivo — dá pra trocar a vocação), os imbuements (incluindo os de proteção), o charm certo pra cada criatura e os itens de carga pra levar na BP. O elemento mais eficaz agora sai na hora, sem esperar a wiki carregar. Dados da TibiaWiki.",
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
