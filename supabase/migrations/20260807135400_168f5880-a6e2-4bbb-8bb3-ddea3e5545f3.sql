CREATE TABLE public.saved_comparisons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  hunts jsonb NOT NULL DEFAULT '[]'::jsonb,
  hunt_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  include_bounty boolean NOT NULL DEFAULT true,
  include_prey boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_comparisons TO authenticated;
GRANT ALL ON public.saved_comparisons TO service_role;

ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved comparisons"
ON public.saved_comparisons FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX saved_comparisons_user_created_idx ON public.saved_comparisons (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_comparisons_updated_at
BEFORE UPDATE ON public.saved_comparisons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();