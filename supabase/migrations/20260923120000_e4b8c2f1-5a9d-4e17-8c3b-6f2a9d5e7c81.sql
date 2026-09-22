-- Cache compartilhado (não por usuário) pra duas fontes externas que a Linked Tasks
-- e o Dashboard de hunt consultam. Antes isso vivia em memória do processo Node, mas
-- o app publica pra Cloudflare Workers: cada request pode cair numa instância
-- diferente, então memória de processo não é um cache confiável em produção — o
-- certo é persistir. Só o service_role escreve (via supabaseAdmin nos server
-- functions); leitura liberada pra qualquer usuário autenticado.

-- 1) Snapshot das salas/tasks da wiki.rubinot.com (ver rubinot-linked-tasks-scrape
--    na memória) — uma linha só, reescrita inteira a cada sincronização.
CREATE TABLE IF NOT EXISTS public.linked_tasks_cache (
  id smallint primary key default 1,
  rooms jsonb not null,
  synced_at timestamptz not null default now(),
  constraint linked_tasks_cache_singleton check (id = 1)
);

GRANT SELECT ON public.linked_tasks_cache TO authenticated;
GRANT ALL ON public.linked_tasks_cache TO service_role;

ALTER TABLE public.linked_tasks_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read linked tasks cache" ON public.linked_tasks_cache;
CREATE POLICY "Authenticated users can read linked tasks cache" ON public.linked_tasks_cache
  FOR SELECT TO authenticated USING (true);

-- 2) Resistência elemental de monstro, puxada da TibiaWiki (Infobox_Criatura). Uma
--    linha por monstro; `mods = null` quer dizer "consultamos e não achamos/veio
--    bloqueado" (guardado por menos tempo que um resultado válido — ver TTLs em
--    monster-weakness.functions.ts).
CREATE TABLE IF NOT EXISTS public.monster_weakness_cache (
  name text primary key,
  mods jsonb,
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.monster_weakness_cache TO authenticated;
GRANT ALL ON public.monster_weakness_cache TO service_role;

ALTER TABLE public.monster_weakness_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read monster weakness cache" ON public.monster_weakness_cache;
CREATE POLICY "Authenticated users can read monster weakness cache" ON public.monster_weakness_cache
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
