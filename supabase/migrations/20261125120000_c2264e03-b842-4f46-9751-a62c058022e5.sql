-- Imbuements em mais de um item do mesmo tipo (pedido de jogador em 2026-10-22: "uso 2 rods, cada uma
-- com o seu imbuement e tempos diferentes").
-- A 2ª arma NÃO precisa de coluna: gear_slot já é texto e passa a aceitar "weapon#2" ("weapon" continua
-- sendo a 1ª, então nenhuma linha antiga muda).
-- Esta coluna guarda QUANDO o item ficou na mochila. No jogo o tempo do imbuement só corre com o item
-- equipado, então hunt feita com o item guardado não gasta tempo nem entra no custo.
-- Formato: [{"from": "<data>", "to": "<data>" | null}] (to null = ainda guardado). null = nunca guardado.
-- Só ADICIONA uma coluna nula: não reescreve nem apaga linha. A tabela já tem RLS e a policy
-- "Users manage own imbuements" (FOR ALL TO authenticated, auth.uid() = user_id), que cobre ler e gravar
-- a coluna nova; o GRANT e o RLS abaixo só reafirmam o que já existe.
-- Script idempotente. Rollback:
--   ALTER TABLE public.imbuements DROP CONSTRAINT IF EXISTS imbuements_stored_periods_check;
--   ALTER TABLE public.imbuements DROP COLUMN IF EXISTS stored_periods;

ALTER TABLE public.imbuements ADD COLUMN IF NOT EXISTS stored_periods jsonb;

-- Validação na porta: só lista, e curta (cada troca de item abre ou fecha 1 período).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'imbuements_stored_periods_check'
      AND conrelid = 'public.imbuements'::regclass
  ) THEN
    ALTER TABLE public.imbuements
      ADD CONSTRAINT imbuements_stored_periods_check CHECK (
        stored_periods IS NULL
        OR CASE
          WHEN jsonb_typeof(stored_periods) = 'array' THEN jsonb_array_length(stored_periods) <= 500
          ELSE false
        END
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.imbuements TO authenticated;
ALTER TABLE public.imbuements ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
