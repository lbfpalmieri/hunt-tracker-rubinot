ALTER TABLE public.hunt_sessions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gear_url text,
  ADD COLUMN IF NOT EXISTS char_name text,
  ADD COLUMN IF NOT EXISTS char_vocation text;

UPDATE public.hunt_sessions s
SET char_name = c.name, char_vocation = c.vocation
FROM public.characters c
WHERE c.id = s.character_id
  AND (s.char_name IS NULL OR s.char_vocation IS NULL);

CREATE INDEX IF NOT EXISTS hunt_sessions_public_idx
  ON public.hunt_sessions (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS hunt_sessions_vocation_idx
  ON public.hunt_sessions (char_vocation);
CREATE INDEX IF NOT EXISTS hunt_sessions_hunt_name_idx
  ON public.hunt_sessions (hunt_name);

GRANT SELECT ON public.hunt_sessions TO anon;

DROP POLICY IF EXISTS "Anyone can view public sessions" ON public.hunt_sessions;
CREATE POLICY "Anyone can view public sessions"
ON public.hunt_sessions
FOR SELECT
TO anon, authenticated
USING (is_public = true);