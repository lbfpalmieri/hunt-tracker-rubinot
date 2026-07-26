# Raw XP como métrica principal

Hoje o app mostra **XP Gain / XP/h** (valor com bônus) como métrica principal e a Raw XP só como texto secundário. A mudança inverte essa prioridade: **Raw XP** passa a ser o número em destaque em todos os lugares, e a XP com bônus vira a informação secundária.

Os dois valores já são lidos do Hunting Analyser (`rawXp`, `rawXpPerHour`, `xpGain`, `xpPerHour`) e já estão salvos no banco — não precisa migração nem re-import de sessões antigas.

## O que muda em cada tela

**Dashboard**
- Card de experiência: destaque em **Raw XP total** (soma de `rawXp`), com a XP com bônus como linha secundária.
- Gráfico de evolução: a linha azul passa a ser **Raw XP/h** (`rawXp ÷ horas`) em vez de XP/h.
- Lista de sessões recentes: mostra `raw xp/h`.
- Textos dos ícones de info atualizados para explicar Raw XP (valor bruto, sem bônus de eventos/XP boost) e onde a XP com bônus aparece.

**Sessões (lista)**
- Mini-stat principal: **Raw XP/h**.
- Ordenação "Melhor XP/h" passa a ordenar por Raw XP/h.

**Detalhe da sessão**
- Card principal: **Raw XP ganha**, com "XP ganha (com bônus)" como hint. Mantém o padrão atual de mostrar valores totais (sem taxa horária no card), conforme já definido antes.

**Nova sessão (preview do import)**
- Linha de preview passa a mostrar Raw XP e Raw XP/h.

**Comunidade**
- Cards de hunt agregada: métrica **Raw XP/h** (média ponderada: `Σ rawXp ÷ Σ horas`).
- Cards/linhas de sessão: **Raw XP**.
- Filtro de ordenação "Maior XP/h" → "Maior Raw XP/h".
- Detalhe da sessão pública: destaque em Raw XP.

**Textos de SEO/marketing**
- Landing, about e metadados: "XP/h" → "Raw XP/h".

## Detalhes técnicos

- `community.functions.ts` já retorna `rawXp` por sessão; a agregação em `community.index.tsx` passa a acumular `rawXp` além de `xpGain` para calcular `rawXpPerHour`.
- Nenhuma mudança de schema, parser ou store. Sessões antigas já têm `rawXp` gravado; caso alguma tenha `rawXp = 0` (log sem a linha), a UI cai para exibir a XP com bônus como fallback para não mostrar zero.
