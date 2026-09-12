-- Histórico de mortes: registra a XP perdida em cada morte (level, bênçãos e
-- promoted no momento), pra descontar do "Raw XP total" e chegar numa "XP
-- líquida" de verdade — igual ao Balance/Saldo atual, só que pra experiência.
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
CREATE POLICY "Users manage own deaths" ON public.deaths FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX deaths_character_idx ON public.deaths (character_id, created_at DESC);
