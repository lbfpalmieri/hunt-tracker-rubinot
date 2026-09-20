-- ============================================================================
--  MIGRATIONS PENDENTES — rodar UMA VEZ no SQL Editor do Supabase / Lovable
-- ============================================================================
--  Este arquivo é 100% idempotente (seguro rodar de novo, não quebra nada se
--  algum bloco já tiver sido aplicado). Consolida:
--    - supabase/migrations/20260912120000_...  (tabela deaths)
--    - supabase/migrations/20260912130000_...  (coluna session_id em deaths)
--    - supabase/migrations/20260912140000_...  (level aceita null em deaths)
--    - supabase/migrations/20260914120000_...  (char_level em hunt_sessions)
--    - supabase/migrations/20260920120000_...  (tabela rc_price_entries — Calculadora de Rubini Coins)
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

-- 3) Level vira opcional (detecção automática pode não saber o level ainda) --
ALTER TABLE public.deaths ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.deaths DROP CONSTRAINT IF EXISTS deaths_level_check;
ALTER TABLE public.deaths ADD CONSTRAINT deaths_level_check CHECK (level IS NULL OR level > 0);

-- 4) Level do personagem no momento do save, em hunt_sessions -----------------
--    Usado "por baixo dos panos" pela Comunidade para calcular a média de
--    level que frequenta cada spot. Null fica de fora da média (não entra
--    como "level 0").
ALTER TABLE public.hunt_sessions ADD COLUMN IF NOT EXISTS char_level integer;
ALTER TABLE public.hunt_sessions DROP CONSTRAINT IF EXISTS hunt_sessions_char_level_check;
ALTER TABLE public.hunt_sessions ADD CONSTRAINT hunt_sessions_char_level_check CHECK (char_level IS NULL OR char_level > 0);

-- 5) Histórico de preço do Rubini Coin (Calculadora de Rubini Coins) ----------
CREATE TABLE IF NOT EXISTS public.rc_price_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world text not null,
  price bigint not null check (price > 0),
  target_gold bigint check (target_gold is null or target_gold > 0),
  recorded_on date not null default current_date,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rc_price_entries TO authenticated;
GRANT ALL ON public.rc_price_entries TO service_role;

ALTER TABLE public.rc_price_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own rc prices" ON public.rc_price_entries;
CREATE POLICY "Users manage own rc prices" ON public.rc_price_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS rc_price_entries_user_world_day_idx
  ON public.rc_price_entries (user_id, world, recorded_on);

-- 6) Recarrega o cache de schema do PostgREST (o "schema cache" do erro) ------
NOTIFY pgrst, 'reload schema';
