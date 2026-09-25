CREATE TABLE public.linked_task_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, task_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linked_task_progress TO authenticated;
GRANT ALL ON public.linked_task_progress TO service_role;
ALTER TABLE public.linked_task_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own linked task progress" ON public.linked_task_progress FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);