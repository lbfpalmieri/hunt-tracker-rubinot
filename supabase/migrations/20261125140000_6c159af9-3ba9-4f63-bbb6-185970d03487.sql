-- Ficha do personagem (sugestões de Balosin, 19/11/2026, e Yin Sylvan, 20/10/2026): skills base,
-- Loyalty, níveis do Bounty Talisman e os charms (major e minor) com o nível de cada um. Uma linha
-- por personagem, a ficha em jsonb (o app valida o formato em src/lib/character-sheet.ts). O
-- Otimizador de charms (/tools/charms) lê os charms daqui.
-- Tabela nova: não mexe em nenhum dado existente. Sem ela, o app mostra a ficha vazia.
-- Script idempotente. Rollback:
--   DROP TABLE IF EXISTS public.character_sheets;

CREATE TABLE IF NOT EXISTS public.character_sheets (
  character_id uuid PRIMARY KEY REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(sheet) = 'object' AND pg_column_size(sheet) < 16384),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_sheets_user_idx ON public.character_sheets (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_sheets TO authenticated;
GRANT ALL ON public.character_sheets TO service_role;
ALTER TABLE public.character_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own character sheets" ON public.character_sheets;
-- Só o dono lê e grava; e só grava ficha de personagem que é dele (sem isso, alguém poderia ocupar a
-- linha do personagem de outra pessoa, já que a chave é o character_id).
CREATE POLICY "Users manage own character sheets" ON public.character_sheets FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);

NOTIFY pgrst, 'reload schema';
