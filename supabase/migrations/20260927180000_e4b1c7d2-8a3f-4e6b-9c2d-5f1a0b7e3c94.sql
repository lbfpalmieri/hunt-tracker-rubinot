-- Modo Grupo: hunt em party.
-- hunt_sessions.party = { size, members[] (Party Hunt Analyser), self, personal } — ver src/lib/party.ts.
-- null = sessão solo. A Comunidade só expõe tamanho/divisão, nunca os nomes dos membros.
ALTER TABLE public.hunt_sessions ADD COLUMN IF NOT EXISTS party jsonb;

-- Modo escolhido (Solo/Grupo) acompanha a conta, junto com as preferências do menu.
ALTER TABLE public.user_nav_prefs ADD COLUMN IF NOT EXISTS play_mode text NOT NULL DEFAULT 'solo';
ALTER TABLE public.user_nav_prefs DROP CONSTRAINT IF EXISTS user_nav_prefs_play_mode_check;
ALTER TABLE public.user_nav_prefs
  ADD CONSTRAINT user_nav_prefs_play_mode_check CHECK (play_mode IN ('solo', 'party'));

NOTIFY pgrst, 'reload schema';
