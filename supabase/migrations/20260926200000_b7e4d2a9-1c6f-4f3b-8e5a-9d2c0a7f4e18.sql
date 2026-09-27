-- Setup estruturado da sessão (arma, skills, Wheel, stance, magias, Runas de Charm).
-- Público junto com a sessão (é estruturado, sem texto livre fora o nome da arma).
ALTER TABLE public.hunt_sessions ADD COLUMN IF NOT EXISTS setup jsonb;

NOTIFY pgrst, 'reload schema';
