-- ============================================================================
--  MIGRATION PENDENTE — rodar UMA VEZ no SQL Editor do Supabase / Lovable
-- ============================================================================
--  A feature "Mortes" (débito de XP em Meu rendimento/Dashboard) precisa desta
--  tabela nova. Este arquivo é 100% idempotente (seguro rodar de novo, não
--  quebra nada se já tiver sido aplicado). Consolida:
--    - supabase/migrations/20260912120000_...  (tabela deaths)
--    - supabase/migrations/20260912130000_...  (coluna session_id em deaths)
-- ============================================================================

-- 1) Tabela de mortes ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deaths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  level numeric(8,2) not null check (level > 0),
  blessings smallint not null default 0 check (blessings >= 0 and blessings <= 7),
  promoted boolean not null default false,
  xp_lost bigint not null check (xp_lost >= 0),
  note text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deaths TO authenticated;
GRANT ALL ON public.deaths TO service_role;

ALTER TABLE public.deaths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own deaths" ON public.deaths;
CREATE POLICY "Users manage own deaths" ON public.deaths
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS deaths_character_idx
  ON public.deaths (character_id, created_at DESC);

-- 2) Liga a morte à sessão em que aconteceu (registro direto na importação) --
ALTER TABLE public.deaths ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.hunt_sessions(id) ON DELETE SET NULL;

-- 3) Recarrega o cache de schema do PostgREST (o "schema cache" do erro) ------
NOTIFY pgrst, 'reload schema';
