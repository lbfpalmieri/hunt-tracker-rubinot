# RubinOT Hunt Tracker — "É sobre RubinOT"

App web para acompanhar evolução nas hunts do RubinOT: cola os 3 blocos de texto do jogo (Hunting Analyser, Damage/Input Analyser, Miscellaneous), o sistema faz o parse e salva a sessão vinculada a um personagem. Dashboard com métricas, histórico e comparativos.

## Escopo (defaults escolhidos)

- **Sem login**: tudo salvo localmente no navegador (localStorage). Rápido, privado, funciona offline. Fácil migrar para nuvem depois.
- **Personagens**: cadastro simples (nome, vocação, mundo) — sessões vinculadas ao personagem selecionado.
- **Importação**: 3 textareas (Hunting, Damage, Miscellaneous) + opção de colar tudo junto que o parser separa por cabeçalhos. Nome da hunt/spot editável antes de salvar.
- **Loot**: usa o Balance do próprio relatório (simples). Tabela de preços custom fica para v2.

## Estrutura de rotas

- `/` — Dashboard (cards de resumo do personagem ativo + gráfico de evolução + últimas sessões)
- `/import` — Importar nova sessão (3 textareas, preview do parse, salvar)
- `/sessions` — Histórico completo, filtros por personagem/spot, ordenação
- `/sessions/$id` — Detalhe de uma sessão (loot, kills, dano por criatura, dano recebido)
- `/characters` — Gerenciar personagens
- `/about` — Sobre + créditos @Ésobrerubinot

## Design

- **Tema dark** de fundo (quase preto azulado), cores fortes de destaque puxando da paleta do logo RubinOT: azul vibrante `#3AA9E8` e laranja/dourado `#F5A524` + acentos.
- **Minimalista moderno**: tipografia Space Grotesk (títulos) + Inter (corpo), cards com bordas sutis, dados grandes e legíveis, micro-animações discretas (fade/slide).
- Logo RubinOT no header, avatar do canal + handle `@Ésobrerubinot` no footer.
- Ícones lucide-react. Gráficos com Recharts (área/linha para XP/h e lucro/h ao longo do tempo).

## Métricas exibidas

Cards no dashboard (personagem ativo, agregado): XP/h médio, Lucro/h médio, Total de sessões, Horas jogadas, Balance total, Melhor hunt (spot).
Por sessão: XP/h, Raw XP/h, Loot, Supplies, Balance, Dano/h, Healing/h, duração, kills totais, top monstro.
Gráficos: evolução de XP/h e Lucro/h por sessão (linha), distribuição de kills por criatura (barra), pizza de tipos de dano recebido.

## Parser

Módulo `src/lib/parser.ts` puro (testável) com 3 funções:
- `parseHunting(text)` → { startedAt, endedAt, durationSec, rawXp, xpGain, xpPerHour, rawXpPerHour, loot, supplies, balance, damage, damagePerHour, healing, healingPerHour, kills: [{name, count}], lootedItems: [{name, count}] }
- `parseDamage(text)` → { totalReceived, maxDps, damageTypes: [{type, value, pct}], damageSources: [{source, value, pct}] }
- `parseMiscellaneous(text)` → { session, charm: {...}, imbuement: {...}, itemUpgrade: {...} }
- Regex tolerante a `.` e `,` como separador de milhar, formato `hh:mm`, e ao formato pt-BR/en.

## Persistência

- `localStorage` com chaves `rubinot:characters` e `rubinot:sessions`.
- Hook `useLocalStore<T>(key)` + tipagem forte.
- Export/Import JSON (backup) na tela de personagens.

## Detalhes técnicos

- TanStack Start + Router (já configurado). Todas as rotas usam `createFileRoute` com `head()` próprio (título/description por página).
- Estado global leve via Zustand (personagem ativo + sessões).
- Tokens de design em `src/styles.css` (@theme): `--color-rubi-blue`, `--color-rubi-gold`, gradientes e sombras semânticas. Sem cores hardcoded nos componentes.
- Logo do RubinOT e avatar do canal salvos via `lovable-assets` a partir dos uploads.
- SEO: title/description específicos em cada rota, og:image apenas nas leaf com hero (dashboard).

## Fora do escopo desta v1

- Login/nuvem (fica como próximo passo caso queira sincronizar entre dispositivos).
- Tabela de preços editável por item (usa Balance do relatório).
- Integração automática com cliente do jogo (o Tibia/RubinOT exporta apenas texto).

Pronto para implementar assim que aprovar.