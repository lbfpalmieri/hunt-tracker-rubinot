-- Presets de setup por personagem (arma, skills, Wheel, postura). Charms não entram.
CREATE TABLE IF NOT EXISTS public.setup_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  setup jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setup_presets TO authenticated;
GRANT ALL ON public.setup_presets TO service_role;
ALTER TABLE public.setup_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own setup presets" ON public.setup_presets;
CREATE POLICY "Users manage own setup presets" ON public.setup_presets FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
