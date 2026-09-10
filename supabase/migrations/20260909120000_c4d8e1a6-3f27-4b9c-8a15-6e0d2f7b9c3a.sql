-- Observação livre da sessão (ex.: "testei essa build de runas") — sempre
-- privada, nunca exposta na Comunidade (não entra nas colunas selecionadas
-- em community.functions.ts).
ALTER TABLE public.hunt_sessions ADD COLUMN IF NOT EXISTS notes text;
