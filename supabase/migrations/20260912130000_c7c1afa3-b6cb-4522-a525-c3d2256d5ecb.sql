-- Liga uma morte à sessão de hunt em que ela aconteceu, quando registrada
-- direto na importação (rastreabilidade — a correção da Raw XP da sessão já
-- acontece no momento de salvar, isso aqui é só pra exibir "ver sessão").
ALTER TABLE public.deaths ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.hunt_sessions(id) ON DELETE SET NULL;
