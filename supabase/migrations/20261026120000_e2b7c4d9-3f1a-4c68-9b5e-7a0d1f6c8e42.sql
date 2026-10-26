-- Objetivo concluído (pedido em 2026-10-26): a pessoa marca o objetivo como conquistado e ele sai
-- da lista de andamento pra lista "Conquistados", com a data. null = em andamento.
-- Editar objetivo (nome, valor, moeda, imagem) não precisa de mudança: a policy "Users manage own
-- goals" já libera UPDATE do próprio objetivo.
-- Script idempotente. Rollback:
--   ALTER TABLE public.goals DROP COLUMN IF EXISTS completed_at;

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS completed_at timestamptz;

NOTIFY pgrst, 'reload schema';
