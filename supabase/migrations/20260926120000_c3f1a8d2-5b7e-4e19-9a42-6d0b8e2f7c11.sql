-- Preferências do menu (fixados + menu lateral fixado aberto), uma linha por usuário.
CREATE TABLE IF NOT EXISTS public.user_nav_prefs (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned text[] NOT NULL DEFAULT '{}',
  sidebar_expanded boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_nav_prefs TO authenticated;
GRANT ALL ON public.user_nav_prefs TO service_role;

ALTER TABLE public.user_nav_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own nav prefs" ON public.user_nav_prefs;
CREATE POLICY "Users manage own nav prefs" ON public.user_nav_prefs FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
