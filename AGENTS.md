<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# RubinOT Hunt Tracker — contexto

App pt-BR (tema dark) para jogadores do RubinOT (Tibia alternativo) acompanharem
hunts: lucro, XP, monstros/h, sessões, comparativos, comunidade.

Stack: TanStack Start v1 + React 19 + Tailwind v4 + shadcn; backend Lovable Cloud
(Supabase: Google OAuth, Postgres RLS, Storage); server logic em createServerFn
(*.functions.ts em src/lib); rotas autenticadas em src/routes/_authenticated/.

Regras permanentes:
- Toda feature/fix/QoL ganha entrada no topo de WHATS_NEW em src/lib/whats-new.ts (pt-BR).
- Nunca exibir e-mail de usuários; identificar pelo nome do personagem ativo.
- Não alterar estrutura de banco sem pedido explícito; tabela public nova exige GRANT+RLS.
- Queries filtradas por user_id; community.functions.ts usa allowlist de colunas.
- Testar tudo no navegador (Playwright logado) antes de reportar; typecheck `bunx tsgo --noEmit`.
- Admin: lucasbuzioli@gmail.com, role em public.user_roles via has_role (schema private).
  Roles NUNCA em profile/users.

Cálculos: todo "/h" de sessão = total ÷ duração da própria sessão; nunca copiar o
"/h" do Hunting Analyser do jogo (janela maior). Média da hunt = média das sessões
(aggregateByHunt em compare.ts). Imbuements: keyOf = `${gearSlot}::${label}` — tipos
diferentes coexistem no item; mesmo tipo = renovação. Prey (prey.ts): máx 3 slots;
XP/Loot 40%, Dano 25%, Defesa 30%.

Telas: sessions.tsx (20/pág) e sessions.$id.tsx; import.tsx (colar export do Hunting
Analyser, parser.ts, sem OCR); imbuements.tsx (20h, horas+minutos); tools.linked-tasks.tsx
(linked_task_progress, barras geral/por sala, marcar tudo); tools.compare.tsx (até 4
hunts) e tools.comparisons.tsx (salvos privados); community.index.tsx (feed público,
vocações em grade); feedback.tsx (tickets com imagem no bucket feedback-attachments,
Inbox admin, export Markdown sem e-mails, histórico de resolvidos); rendimento.tsx
(level_snapshots + goals).

Mobile/perf: listas paginadas; imagens lazy; menu "Mais" vira drawer <1024px.

Banco (IAs externas): mudanças de estrutura são feitas via SQL, entregue pronto ao
usuário. Toda tabela nova em public precisa GRANT + RLS + policies no mesmo script;
queries sempre filtradas por user_id; roles NUNCA em profile/users.
