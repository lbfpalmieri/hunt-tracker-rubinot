# Redução de custo do banco

## O que encontrei
- Banco pequeno (273 sessões, ~1,5 MB). Nenhuma consulta é lenta de verdade (média 4–19 ms); o custo vem de **repetição**.
- **Não existem tarefas agendadas** (nenhum job rodando sozinho).
- **Não há polling** batendo no banco: o único timer (`RendimentoNudge`) só mostra um aviso na tela, sem buscar dados.
- Maiores gastos (soma de tempo):
  1. Números da Comunidade/página inicial: lê até 1000 sessões públicas inteiras **+ uma contagem separada**, a cada visita (~1600 vezes). Cache de só 5 min.
  2. Carregar as sessões do usuário: filtro por usuário **sem índice próprio** (~1300 vezes).
  3. Lista de monstros/hunts da Comunidade: lê 400 sessões inteiras a cada 10 min por visitante.

## O que vou mudar
1. **Índice novo** em sessões por usuário + data (acelera abrir o app logado).
2. **Números da Comunidade:** remover a segunda consulta (contagem) — a contagem sai da própria lista; e guardar o resultado por 30 min no navegador (antes 5 min).
3. **Lista de monstros/hunts:** guardar por 1 h (antes 10 min) — muda raramente.
4. Sino de Novidades: entrada curta "site mais leve".

Nada muda no que o jogador vê; os números da Comunidade podem demorar até 30 min pra atualizar.

## Detalhes técnicos
- Migração: `CREATE INDEX IF NOT EXISTS hunt_sessions_user_created_idx ON public.hunt_sessions (user_id, created_at DESC);` (também entregue em SQL no `APLICAR_MIGRATIONS_PENDENTES.sql`).
- `getCommunityStats`: tirar o `count: exact head`; `sessions = data.length` (limite 1000 → se bater 1000, usar contagem como fallback).
- `staleTime` em `routes/index.tsx` e `community.index.tsx`: stats 30 min, monsters 60 min.
- Economia real só se confirma depois comparando o uso; hoje é uma estimativa.
