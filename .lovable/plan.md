## Comparar Hunts

Nova ferramenta em **Mais → Comparar hunts**, ao lado da Calculadora de monstros/h. Permite selecionar até 4 sessões (suas ou da comunidade) clicando nos cards; a tabela comparativa é gerada automaticamente logo abaixo.

### Como funciona

1. Duas abas de origem: **Minhas sessões** e **Comunidade** — é possível misturar as duas na mesma comparação.
2. Busca por nome da hunt, personagem ou vocação, com os cards listados em grid.
3. Clicar no card seleciona (borda dourada + check). Clicar de novo remove. Limite de 4; ao atingir o limite, os demais ficam desabilitados com aviso.
4. Assim que houver 2+ selecionadas, a tabela aparece abaixo, uma coluna por hunt.
5. Em cada linha, o melhor valor fica verde e o pior vermelho (com a direção correta: Supplies/h e Dano recebido/h invertem a lógica).
6. Botão "Limpar seleção" e link para abrir o detalhe de cada sessão.

### Linhas da tabela

Duração · Raw XP · Raw XP/h · XP com bônus · Balance · Lucro/h · Loot/h · Supplies/h · Kills totais · Kills/h · Dano causado/h · Dano recebido/h · Top 3 monstros.

Regras já existentes no app são respeitadas:
- Raw XP normalizada por Bounty Task (desconta o bônus fixo) — coluna marcada com o selo de Bounty.
- Colunas com Prey ativa recebem a marca sutil dourada ("Loot com Prey +40%" etc.), igual ao detalhe da sessão, para deixar claro que o valor não está "puro".

### Layout

O print anexado mostra a tela: abas + busca no topo, faixa de cards selecionáveis, e a tabela comparativa abaixo com destaque verde/vermelho.

### Detalhes técnicos

- Nova rota `src/routes/_authenticated/tools.compare.tsx` (registrada no menu Mais do AppShell, desktop e mobile).
- Sessões próprias vêm do store local; sessões públicas via `getCommunitySessions` (server fn já existente) — sem novas tabelas nem migração.
- Novo `src/lib/compare.ts` com a normalização de uma sessão (própria ou da comunidade) para um formato único de métricas, reaproveitando `huntRawXp` (bounty) e os helpers de prey.
- Componentes: `HuntPickerCard` e `CompareTable` em `src/components/compare/`.
- Estado de seleção só na URL/local (`useState`), nada persistido.
- `head()` próprio com título e descrição da ferramenta.
- Tabela com scroll horizontal no mobile; nas telas pequenas as colunas viram cards empilhados por métrica.
