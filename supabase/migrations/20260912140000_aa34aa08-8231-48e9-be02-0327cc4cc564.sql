-- Detecção automática de morte na importação: quando a Raw XP colada vem
-- negativa, o sistema registra a morte sozinho usando o valor observado
-- (sem pedir level/bênçãos/promoted) — nesse caso o level do personagem pode
-- não ser conhecido ainda. Relaxa a constraint pra permitir null.
ALTER TABLE public.deaths ALTER COLUMN level DROP NOT NULL;
ALTER TABLE public.deaths DROP CONSTRAINT IF EXISTS deaths_level_check;
ALTER TABLE public.deaths ADD CONSTRAINT deaths_level_check CHECK (level IS NULL OR level > 0);
