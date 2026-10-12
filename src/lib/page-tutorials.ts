import { create } from "zustand";

/**
 * Tutorial passo a passo de cada página (janelinha que abre na primeira visita). O jogador pode
 * marcar "Não mostrar de novo" (lembrado por página, neste navegador), pular só por esta visita ou
 * abrir de novo pelo botão de ajuda do cabeçalho. Texto descreve o que a tela faz hoje: ao mudar
 * uma tela, ajuste os passos dela aqui.
 */
export interface Tutorial {
  /** Chave da página (usada pra lembrar o "não mostrar de novo"). */
  key: string;
  title: string;
  steps: { title: string; text: string }[];
}

const T = (key: string, title: string, steps: [string, string][]): Tutorial => ({
  key,
  title,
  steps: steps.map(([t, text]) => ({ title: t, text })),
});

export const TUTORIALS: Tutorial[] = [
  T("dashboard", "Seu painel", [
    ["Resumo das hunts", "Aqui ficam os números das suas sessões: lucro, XP e tempo jogado do personagem ativo."],
    ["Troque de personagem", "No canto de cima você escolhe o personagem ativo. Tudo no app passa a mostrar os dados dele."],
    ["Solo ou Grupo", "O alternador Solo / Grupo filtra as hunts do app inteiro e troca a cor de destaque."],
  ]),
  T("import", "Nova sessão", [
    ["Cole o Hunting Analyser", "Copie o bloco no jogo e cole com Ctrl+V em qualquer lugar da tela. O app reconhece em qual bloco ele entra."],
    ["Blocos opcionais", "Input Analyser (dano recebido) e Miscellaneous (charms e imbuements) enriquecem a sessão, mas não são obrigatórios."],
    ["Adicionar sessão", "O assistente pergunta a hunt, depois Bounty Task, Prey e Setup, e no fim salva. Hunt em party usa o Modo Grupo."],
    ["Analyser contando a mais?", "Se esqueceu de colar na hora, use Corrigir tempo: os totais ficam e o \"/h\" é recalculado."],
  ]),
  T("sessions", "Sessões", [
    ["Sessões ou Hunts", "Alterne entre a lista de sessões e as hunts agrupadas, que mostram a média de cada spot."],
    ["Filtre e ordene", "Busque pelo nome da hunt, escolha o personagem e ordene por lucro/h, XP/h ou duração."],
    ["Exporte tudo", "Os botões CSV e JSON baixam todas as suas sessões, pra planilha ou backup."],
    ["Abra uma sessão", "Dentro dela você renomeia a hunt, vê o valor de cada item do loot e pode excluir (com Desfazer)."],
  ]),
  T("characters", "Personagens", [
    ["Cadastre seus chars", "Preencha nome, vocação e mundo. Cole um print do outfit com Ctrl+V se quiser."],
    ["Edite quando mudar", "O lápis corrige nome, vocação ou mundo sem perder o histórico de sessões."],
    ["Personagem ativo", "Ative o char que você está jogando; as telas passam a mostrar os dados dele."],
  ]),
  T("rendimento", "Rendimento", [
    ["Duas abas", "Meu rendimento mostra o personagem ativo; Todos os personagens compara a conta inteira."],
    ["Level, metas e gastos", "Registre seu level, defina metas de gold e anote gastos e mortes pra o saldo bater com o jogo."],
  ]),
  T("calculadoras", "Calculadoras", [
    ["Monstros/h e Bounty", "Escolha a criatura (ou as da Linked Task) e veja em qual hunt seu histórico termina a task mais rápido."],
    ["Rubini Coins", "A outra aba converte e compara valores de Rubini Coins."],
  ]),
  T("linked-tasks", "Linked Tasks", [
    ["Escolha a sala e a task", "Toque numa task pra abrir o conselho dela."],
    ["Conselho da task", "Abas de Combate (elemento, dano, onde você já caçou), Set, Imbuements e Recompensas. Criatura fraca não pede set caro."],
    ["Acompanhe o progresso", "Marque as tasks concluídas; o progresso geral e por sala aparece no topo."],
  ]),
  T("imbuements", "Imbuements", [
    ["Controle o tempo", "Registre cada imbuement com horas e minutos restantes (duram 20h de jogo)."],
    ["Renove a tempo", "O app avisa quando falta pouco, pra você não perder o efeito no meio da hunt."],
  ]),
  T("bosses", "Rotação de Bosses", [
    ["Catálogo de bosses", "Veja os bosses e crie rotações com os que você faz."],
    ["Registre execuções", "Informe o loot e os supplies; o lucro conta só itens que caem de boss. Boss tem cooldown, então não há lucro por hora."],
    ["Meus preços", "Seus preços por servidor ficam salvos e valem também no loot das sessões."],
  ]),
  T("equipamentos", "Meus sets", [
    ["Monte seu set", "Escolha equipamento e postura por personagem no boneco do inventário."],
    ["Use na sessão", "Ao salvar uma sessão, escolha o set pra preencher o setup dela de uma vez."],
  ]),
  T("rodas", "Minhas rodas", [
    ["Planeje a Wheel of Destiny", "Distribua os pontos nas fatias; a roda só libera fatia com a vizinha cheia."],
    ["Salve e reaproveite", "Rodas salvas podem ser aplicadas em qualquer sessão, separadas do set."],
  ]),
  T("ranking", "Ranking", [
    ["Compare resultados", "Veja as melhores hunts por lucro/h e XP/h entre as sessões do modo atual."],
  ]),
  T("comparisons", "Comparações salvas", [
    ["Reveja comparativos", "Aqui ficam as comparações de hunts que você salvou. Elas são privadas."],
  ]),
  T("feedback", "Sugestões e bugs", [
    ["Conte o que achou", "Descreva a sugestão ou o bug e anexe uma imagem se ajudar."],
    ["Acompanhe a resposta", "Você vê o status do que enviou e as respostas na própria página."],
  ]),
];

/** Qual tutorial vale para a rota. Páginas públicas e sem tutorial devolvem null. */
export function tutorialFor(pathname: string): Tutorial | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  const key =
    p === "/dashboard" ? "dashboard"
    : p === "/import" ? "import"
    : p === "/sessions" ? "sessions"
    : p === "/characters" ? "characters"
    : p === "/rendimento" || p === "/overview" ? "rendimento"
    : p === "/tools/monster-calculator" || p === "/tools/rubini-coins" ? "calculadoras"
    : p === "/tools/linked-tasks" ? "linked-tasks"
    : p === "/imbuements" ? "imbuements"
    : p === "/bosses" ? "bosses"
    : p === "/equipamentos" ? "equipamentos"
    : p === "/rodas" ? "rodas"
    : p === "/tools/ranking" ? "ranking"
    : p === "/tools/comparisons" ? "comparisons"
    : p === "/feedback" ? "feedback"
    : null;
  return key ? (TUTORIALS.find((t) => t.key === key) ?? null) : null;
}

// ---------------------------------------------------------------- "não mostrar de novo"

const HIDDEN_KEY = "rubinot:tutorials-hidden";
const SKIP_KEY = "rubinot:tutorials-skipped";

function read(storage: () => Storage, key: string): string[] {
  try {
    const raw = storage().getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function write(storage: () => Storage, key: string, list: string[]) {
  try {
    storage().setItem(key, JSON.stringify(list));
  } catch {
    // sem storage: o tutorial só reaparece na próxima visita
  }
}

/**
 * "Não mostrar de novo": o navegador guarda a lista (vale pra visitante e sem rede); com login, o
 * nav-prefs.ts também grava na conta (user_nav_prefs.tutorials_hidden) e o tutorial segue o jogador
 * entre aparelhos. Se a coluna ainda não existe no banco, continua só no navegador.
 */
let onChange: ((list: string[]) => void) | null = null;
/** O nav-prefs registra aqui pra salvar na conta toda vez que a lista muda. */
export const onHiddenChange = (fn: ((list: string[]) => void) | null) => {
  onChange = fn;
};
export const getHiddenTutorials = () => read(() => localStorage, HIDDEN_KEY);
/** Troca a lista inteira (vinda da conta) sem disparar o salvamento de volta. */
export const replaceHiddenTutorials = (list: string[]) => {
  write(() => localStorage, HIDDEN_KEY, [...new Set(list)]);
  // A conta pode responder depois da página abrir: avisa a tela pra rever se ainda deve mostrar.
  useTutorialUi.setState((s) => ({ hiddenVersion: s.hiddenVersion + 1 }));
};

export const isTutorialHidden = (key: string) => getHiddenTutorials().includes(key);
export const hideTutorial = (key: string) => {
  replaceHiddenTutorials([...getHiddenTutorials(), key]);
  onChange?.(getHiddenTutorials());
};
export const resetTutorials = () => {
  replaceHiddenTutorials([]);
  write(() => sessionStorage, SKIP_KEY, []);
  onChange?.([]);
};
/** "Pular tutorial": some só nesta visita ao app (volta no próximo acesso, a menos que marque "não mostrar de novo"). */
export const isTutorialSkipped = (key: string) => read(() => sessionStorage, SKIP_KEY).includes(key);
export const skipTutorial = (key: string) =>
  write(() => sessionStorage, SKIP_KEY, [...new Set([...read(() => sessionStorage, SKIP_KEY), key])]);

/** Deve abrir sozinho nesta visita? */
export const shouldAutoOpen = (key: string) => !isTutorialHidden(key) && !isTutorialSkipped(key);

/** Abertura manual (botão de ajuda do cabeçalho). */
export const useTutorialUi = create<{
  manualKey: string | null;
  openManual: (k: string | null) => void;
  /** Sobe toda vez que a lista de "não mostrar de novo" é trocada. */
  hiddenVersion: number;
}>((set) => ({ manualKey: null, openManual: (manualKey) => set({ manualKey }), hiddenVersion: 0 }));
