-- Saldo de gold que não veio das hunts + objetivo principal (pedido em 2026-10-17).
-- 1) gold_adjustments: ajuste do saldo do personagem, positivo (itens vendidos, gold de antes de
--    usar o app) ou negativo. O app grava a diferença entre o saldo digitado ("quanto tenho no
--    jogo agora") e o que ele calcula. Entra no "Saldo atual" junto com hunts − imbuements − gastos.
-- 2) goals.is_main: o objetivo principal conta TODO o saldo atual do personagem; os outros seguem
--    contando só as hunts feitas depois de criados. No máximo 1 principal por personagem.
-- Script idempotente. Rollback:
--   DROP TABLE IF EXISTS public.gold_adjustments;
--   DROP INDEX IF EXISTS public.goals_one_main_per_character;
--   ALTER TABLE public.goals DROP COLUMN IF EXISTS is_main;

CREATE TABLE IF NOT EXISTS public.gold_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount bigint NOT NULL CHECK (amount <> 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gold_adjustments_character_idx ON public.gold_adjustments (character_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gold_adjustments TO authenticated;
GRANT ALL ON public.gold_adjustments TO service_role;
ALTER TABLE public.gold_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own gold adjustments" ON public.gold_adjustments;
CREATE POLICY "Users manage own gold adjustments" ON public.gold_adjustments FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS is_main boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS goals_one_main_per_character ON public.goals (character_id) WHERE is_main;

NOTIFY pgrst, 'reload schema';
