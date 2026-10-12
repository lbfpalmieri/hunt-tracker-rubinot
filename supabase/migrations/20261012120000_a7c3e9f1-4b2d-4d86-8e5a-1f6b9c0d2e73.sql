-- Tutoriais por página seguem a conta (issue #15): lista das páginas em que o jogador marcou
-- "Não mostrar de novo". Coluna nova em tabela que já tem RLS, GRANT e policies (user_nav_prefs),
-- então nada de acesso novo. O app funciona sem ela (cai no navegador).
-- Rollback: ALTER TABLE public.user_nav_prefs DROP COLUMN IF EXISTS tutorials_hidden;
ALTER TABLE public.user_nav_prefs
  ADD COLUMN IF NOT EXISTS tutorials_hidden jsonb NOT NULL DEFAULT '[]'::jsonb;
