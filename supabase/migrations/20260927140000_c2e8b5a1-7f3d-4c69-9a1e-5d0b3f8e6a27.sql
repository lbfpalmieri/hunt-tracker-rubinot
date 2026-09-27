-- "Meus preços": valor de cada item pro usuário, por servidor (market do RubinOT ≠ NPC).
CREATE TABLE IF NOT EXISTS public.user_item_prices (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  world text NOT NULL,
  item text NOT NULL,
  price bigint NOT NULL CHECK (price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, world, item)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_item_prices TO authenticated;
GRANT ALL ON public.user_item_prices TO service_role;
ALTER TABLE public.user_item_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own item prices" ON public.user_item_prices;
CREATE POLICY "Users manage own item prices" ON public.user_item_prices FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
