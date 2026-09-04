-- Histórico de gastos: compras dentro do jogo pagas com o gold acumulado
-- (fora do fluxo de hunts/imbuements), pra explicar divergências entre o
-- Balance calculado e o gold que o personagem realmente tem.
CREATE TABLE public.expenses (
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
CREATE POLICY "Users manage own expenses" ON public.expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX expenses_character_idx ON public.expenses (character_id, created_at DESC);
