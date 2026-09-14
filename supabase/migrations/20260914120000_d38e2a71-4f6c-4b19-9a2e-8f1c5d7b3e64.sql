-- Level do personagem no momento em que a sessão foi salva. Usado "por baixo dos
-- panos" para, na Comunidade, calcular a média de level que frequenta cada spot
-- (ajuda a separar hunts por level/vocação no futuro). Null quando o personagem
-- nunca teve um level registrado — nesse caso a sessão fica de fora da média,
-- em vez de entrar como "level 0" e distorcer o número.
ALTER TABLE public.hunt_sessions
  ADD COLUMN IF NOT EXISTS char_level integer;

ALTER TABLE public.hunt_sessions
  DROP CONSTRAINT IF EXISTS hunt_sessions_char_level_check;
ALTER TABLE public.hunt_sessions
  ADD CONSTRAINT hunt_sessions_char_level_check CHECK (char_level IS NULL OR char_level > 0);

NOTIFY pgrst, 'reload schema';
