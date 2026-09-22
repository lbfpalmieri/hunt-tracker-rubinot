-- Distingue "confirmado que não existe na TibiaWiki" (permanent = true, ex.: criaturas
-- exclusivas do RubinOT como a linha "Roothing") de "não consegui checar agora, tenta de
-- novo logo" (permanent = false, ex.: bloqueio temporário de tráfego da TibiaWiki).
-- Sem essa distinção, os dois casos eram tratados como "não achei ainda" e a UI dizia
-- "aguarde, em desenvolvimento" mesmo pra criaturas que NUNCA vão ter esse dado.
ALTER TABLE public.monster_weakness_cache
  ADD COLUMN IF NOT EXISTS permanent boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
