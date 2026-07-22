CREATE TABLE public.hunts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (character_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunts TO authenticated;
GRANT ALL ON public.hunts TO service_role;
ALTER TABLE public.hunts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hunts" ON public.hunts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);