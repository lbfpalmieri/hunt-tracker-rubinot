-- Rodas salvas (Wheel of Destiny) por personagem, SEPARADAS dos sets (setup_presets): a pessoa
-- cadastra as rodas em /rodas e escolhe qual usou na sessão ou na execução de boss, sem precisar
-- duplicar o set de equipamento. Script idempotente (pode rodar de novo sem quebrar nada).

-- 1) Tabela das rodas ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wheel_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  wheel jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, name)
);
CREATE INDEX IF NOT EXISTS wheel_presets_user_idx ON public.wheel_presets (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wheel_presets TO authenticated;
GRANT ALL ON public.wheel_presets TO service_role;
ALTER TABLE public.wheel_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own wheel presets" ON public.wheel_presets;
CREATE POLICY "Users manage own wheel presets" ON public.wheel_presets FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Set e roda usados na execução de boss (mesmo formato do hunt_sessions.setup) --------------
ALTER TABLE public.boss_rotation_runs ADD COLUMN IF NOT EXISTS setup jsonb;

-- 3) Rodas que estavam DENTRO dos sets viram rodas salvas ------------------------------------
-- Os sets não são alterados (a roda antiga continua no jsonb, só deixa de ser lida). Sets do mesmo
-- personagem com a roda idêntica viram UMA roda, com o nome do set mais antigo.
INSERT INTO public.wheel_presets (user_id, character_id, name, wheel, created_at, updated_at)
SELECT DISTINCT ON (character_id, setup -> 'wheel')
  user_id, character_id, name, setup -> 'wheel', created_at, updated_at
FROM public.setup_presets
WHERE jsonb_typeof(setup -> 'wheel') = 'object'
ORDER BY character_id, setup -> 'wheel', created_at
ON CONFLICT (character_id, name) DO NOTHING;

NOTIFY pgrst, 'reload schema';
