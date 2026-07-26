ALTER TABLE public.hunt_sessions
  ADD COLUMN IF NOT EXISTS bounty_difficulty text,
  ADD COLUMN IF NOT EXISTS bounty_tier text,
  ADD COLUMN IF NOT EXISTS bounty_xp bigint;

ALTER TABLE public.hunt_sessions
  ADD CONSTRAINT hunt_sessions_bounty_difficulty_check
  CHECK (bounty_difficulty IS NULL OR bounty_difficulty IN ('beginner','adept','expert','master'));

ALTER TABLE public.hunt_sessions
  ADD CONSTRAINT hunt_sessions_bounty_tier_check
  CHECK (bounty_tier IS NULL OR bounty_tier IN ('normal','silver','gold'));

ALTER TABLE public.hunt_sessions
  ADD CONSTRAINT hunt_sessions_bounty_xp_check
  CHECK (bounty_xp IS NULL OR bounty_xp >= 0);