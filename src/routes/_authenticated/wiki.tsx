import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  BookOpen,
  LayoutDashboard,
  Swords,
  Globe2,
  Sparkles,
  Calculator,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/wiki")({
  head: () => ({
    meta: [
      { title: "Wiki — RubinOT Hunt Tracker" },
      { name: "description", content: "Guia rápido de cada função do RubinOT Hunt Tracker." },
      { property: "og:title", content: "Wiki do RubinOT Hunt Tracker" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: WikiPage,
});

interface Section {
  id: string;
  icon: LucideIcon;
  title: string;
  to?: string;
  items: { label: string; text: string }[];
}

const SECTIONS: Section[] = [
  {
    id: "hunts",
    icon: Swords,
    title: "Hunts",
    items: [
      {
        label: "Nova sessão",
        text: "Cole os relatórios do Hunt Analyser (Hunting, Damage e Miscellaneous) do RubinOT e a sessão é salva com Raw XP/h, lucro/h, kills e evolução do personagem.",
      },
      {
        label: "Sessões",
        text: "Histórico completo, com abas Sessões (uma por uma) e Hunts (agrupadas por spot, com a média de todas as sessões daquele spot).",
      },
      {
        label: "Comparar sessões",
        text: "Escolhe até 4 sessões específicas (sem médias) lado a lado — bom pra testar runas, magias ou rotações diferentes na mesma spot.",
      },
      {
        label: "Dashboard da hunt",
        text: "Aberto a partir de uma hunt: resumo com médias, qual elemento causa mais dano nos monstros da hunt (baseado na TibiaWiki) e o bônus de Prey/Bounty separado do resto.",
      },
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard e rendimento",
    items: [
      {
        label: "Dashboard",
        text: "Visão geral do personagem ativo: totais, evolução ao longo do tempo e a hunt que mais rendeu.",
      },
      {
        label: "Meu rendimento",
        text: "Metas de gold/XP, histórico de gastos (compras pagas com o gold acumulado) e o quanto falta pra bater a meta.",
      },
      {
        label: "Todos os personagens",
        text: "Soma o progresso de todos os seus personagens cadastrados num só lugar.",
      },
    ],
  },
  {
    id: "community",
    icon: Globe2,
    title: "Comunidade",
    items: [
      {
        label: "Por hunt / Sessões",
        text: "Dados reais compartilhados pelos jogadores: Raw XP/h, lucro/h e kills/h de cada spot, com filtro por vocação, hunt e monstro.",
      },
      {
        label: "Calculadora (na Comunidade)",
        text: "Estima quanto tempo falta pra terminar uma bounty numa hunt, usando a média de kills/h dos dados públicos da comunidade.",
      },
      {
        label: "Tornar uma sessão pública",
        text: "No detalhe de uma sessão sua, dá pra marcar como pública — ela passa a contar nas médias da Comunidade (sem expor suas observações privadas).",
      },
    ],
  },
  {
    id: "tools",
    icon: Calculator,
    title: "Ferramentas",
    items: [
      {
        label: "Calculadora de Bounty / Linked Task",
        text: "Bounty: informe o monstro e a quantidade. Linked Task: some vários monstros de uma vez. Nos dois casos, mostra em qual hunt você termina mais rápido, com base no seu histórico.",
      },
      { label: "Comparar hunts", text: "Compara até 4 hunts (agregadas, com médias) lado a lado." },
      {
        label: "Ranking de hunts",
        text: "Ranking das suas hunts por Raw XP/h, lucro/h ou kills/h.",
      },
      {
        label: "Comparações salvas",
        text: "Comparativos que você salvou, com suas anotações de setup.",
      },
      {
        label: "Calculadora de Rubini Coins",
        text: "Informe o preço do RC e quanto gold quer juntar pra saber quantos RC vender. Salva o preço do dia e mostra o histórico num gráfico.",
      },
      {
        label: "Linked Tasks",
        text: "Todas as salas e tasks do RubinOT, com busca por task ou criatura e sugestão de elemento mais eficaz contra cada uma.",
      },
    ],
  },
  {
    id: "characters",
    icon: UserCircle2,
    title: "Personagens e imbuements",
    items: [
      {
        label: "Personagens",
        text: "Cadastro dos seus personagens (nome, vocação, servidor) — a base pra tudo mais.",
      },
      {
        label: "Imbuements",
        text: "Acompanha os slots de imbuement de cada personagem e avisa quando algum está perto de expirar.",
      },
    ],
  },
];

function WikiPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ajuda</div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <BookOpen className="h-7 w-7 text-rubi-gold" /> Wiki
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Guia rápido de cada função do sistema.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-rubi-blue/40 hover:text-foreground"
          >
            <s.icon className="h-3.5 w-3.5" /> {s.title}
          </a>
        ))}
      </div>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.id} id={s.id} className="card-surface scroll-mt-20 p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
              <s.icon className="h-5 w-5 text-rubi-gold" /> {s.title}
            </h2>
            <dl className="space-y-3">
              {s.items.map((item) => (
                <div key={item.label}>
                  <dt className="text-sm font-semibold">{item.label}</dt>
                  <dd className="mt-0.5 text-sm text-muted-foreground">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="card-surface mt-6 flex items-center gap-3 p-5">
        <Sparkles className="h-5 w-5 flex-none text-rubi-gold" />
        <p className="text-sm text-muted-foreground">
          Quer ver o que mudou recentemente? Confira o sino de{" "}
          <span className="font-semibold text-foreground">Novidades</span> no topo da página.
        </p>
      </div>
    </AppShell>
  );
}
