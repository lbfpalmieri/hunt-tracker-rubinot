CREATE TABLE public.level_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  level integer not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_snapshots TO authenticated;
GRANT ALL ON public.level_snapshots TO service_role;
ALTER TABLE public.level_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own level snapshots" ON public.level_snapshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX level_snapshots_character_idx ON public.level_snapshots (character_id, created_at);

CREATE TABLE public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  target_amount bigint not null default 0,
  currency_label text not null default 'Gold',
  image_url text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX goals_character_idx ON public.goals (character_id, created_at);