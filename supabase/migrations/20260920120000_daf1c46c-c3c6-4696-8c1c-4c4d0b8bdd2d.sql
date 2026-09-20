-- Histórico de preço do Rubini Coin (quanto de gold 1 RC valia num servidor, numa data).
-- Alimenta a Calculadora de Rubini Coins: o jogador registra o preço do dia e, com o tempo,
-- o gráfico mostra a variação pra ele decidir se vale a pena vender agora.
-- Um registro por (usuário, servidor, dia): salvar de novo no mesmo dia atualiza o valor.
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

NOTIFY pgrst, 'reload schema';
