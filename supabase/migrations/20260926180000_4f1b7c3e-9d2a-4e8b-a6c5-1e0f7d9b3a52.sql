-- Criatura da Bounty Task da sessão (Task Board). Opcional; sessões antigas ficam NULL.
ALTER TABLE public.hunt_sessions ADD COLUMN IF NOT EXISTS bounty_creature text;

NOTIFY pgrst, 'reload schema';
