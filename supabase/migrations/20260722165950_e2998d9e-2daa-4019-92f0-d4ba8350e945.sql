
CREATE TABLE public.imbuements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic','intricate','powerful')),
  gold_token_cost BIGINT NOT NULL DEFAULT 0,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imbuements TO authenticated;
GRANT ALL ON public.imbuements TO service_role;
ALTER TABLE public.imbuements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own imbuements" ON public.imbuements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_imbuements_char ON public.imbuements(character_id, created_at);
