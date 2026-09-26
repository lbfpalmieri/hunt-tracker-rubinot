-- Rotação de Bosses.

-- 1) Catálogo de bosses (dados da TibiaWiki), uma linha só (id = 1). Todo mundo logado lê;
--    só admin grava (a sincronização roda no navegador do admin, a API da wiki bloqueia servidor).
CREATE TABLE IF NOT EXISTS public.boss_catalog_cache (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.boss_catalog_cache TO authenticated;
GRANT ALL ON public.boss_catalog_cache TO service_role;
ALTER TABLE public.boss_catalog_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read boss catalog" ON public.boss_catalog_cache;
CREATE POLICY "Authenticated read boss catalog" ON public.boss_catalog_cache FOR SELECT TO authenticated
USING (true);
DROP POLICY IF EXISTS "Admin insert boss catalog" ON public.boss_catalog_cache;
CREATE POLICY "Admin insert boss catalog" ON public.boss_catalog_cache FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admin update boss catalog" ON public.boss_catalog_cache;
CREATE POLICY "Admin update boss catalog" ON public.boss_catalog_cache FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Rotações do usuário (lista de bosses com nome).
CREATE TABLE IF NOT EXISTS public.boss_rotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  bosses text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS boss_rotations_user_idx ON public.boss_rotations (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boss_rotations TO authenticated;
GRANT ALL ON public.boss_rotations TO service_role;
ALTER TABLE public.boss_rotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own boss rotations" ON public.boss_rotations;
CREATE POLICY "Users manage own boss rotations" ON public.boss_rotations FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) Cada vez que o usuário faz a rotação (dados do Hunting Analyser).
CREATE TABLE IF NOT EXISTS public.boss_rotation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  rotation_id uuid NOT NULL REFERENCES public.boss_rotations(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  ran_at timestamptz NOT NULL DEFAULT now(),
  duration_sec int NOT NULL DEFAULT 0,
  loot bigint NOT NULL DEFAULT 0,
  supplies bigint NOT NULL DEFAULT 0,
  balance bigint NOT NULL DEFAULT 0,
  xp bigint NOT NULL DEFAULT 0,
  party_size int NOT NULL DEFAULT 1,
  bosses_killed text[] NOT NULL DEFAULT '{}',
  drops jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS boss_rotation_runs_rotation_idx ON public.boss_rotation_runs (rotation_id, ran_at);
CREATE INDEX IF NOT EXISTS boss_rotation_runs_user_idx ON public.boss_rotation_runs (user_id, character_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boss_rotation_runs TO authenticated;
GRANT ALL ON public.boss_rotation_runs TO service_role;
ALTER TABLE public.boss_rotation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own boss rotation runs" ON public.boss_rotation_runs;
CREATE POLICY "Users manage own boss rotation runs" ON public.boss_rotation_runs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) Ajuste pessoal "solo / time" por boss (a wiki não tem esse dado; o app estima pela vida).
CREATE TABLE IF NOT EXISTS public.user_boss_prefs (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  party jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_boss_prefs TO authenticated;
GRANT ALL ON public.user_boss_prefs TO service_role;
ALTER TABLE public.user_boss_prefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own boss prefs" ON public.user_boss_prefs;
CREATE POLICY "Users manage own boss prefs" ON public.user_boss_prefs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
