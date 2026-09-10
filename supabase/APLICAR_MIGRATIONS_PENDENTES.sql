-- ============================================================================
--  MIGRATIONS PENDENTES — rodar UMA VEZ no SQL Editor do Supabase / Lovable
-- ============================================================================
--  As features "Histórico de gastos" e "Observação da sessão" precisam destas
--  mudanças no banco. Este arquivo é 100% idempotente (seguro rodar de novo,
--  não quebra nada se parte já tiver sido aplicada). Consolida:
--    - supabase/migrations/20260904120000_...  (tabela expenses)
--    - supabase/migrations/20260909120000_...  (coluna notes em hunt_sessions)
-- ============================================================================

-- 1) Tabela de gastos --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  description text not null,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own expenses" ON public.expenses;
CREATE POLICY "Users manage own expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS expenses_character_idx
  ON public.expenses (character_id, created_at DESC);

-- 2) Observação livre na sessão -------------------------------------------------
ALTER TABLE public.hunt_sessions ADD COLUMN IF NOT EXISTS notes text;

-- 3) Recarrega o cache de schema do PostgREST (o "schema cache" do erro) ------
NOTIFY pgrst, 'reload schema';
