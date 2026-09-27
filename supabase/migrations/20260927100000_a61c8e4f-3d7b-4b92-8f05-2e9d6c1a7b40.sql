-- Print do equipamento de cada set (mesmo formato do gear_url da sessão: data URL WebP comprimido).
ALTER TABLE public.setup_presets ADD COLUMN IF NOT EXISTS gear_url text;

NOTIFY pgrst, 'reload schema';
