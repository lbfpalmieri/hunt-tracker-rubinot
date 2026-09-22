CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "Users read own tickets" ON public.feedback_tickets;
DROP POLICY "Admins update tickets" ON public.feedback_tickets;
DROP POLICY "Owner or admin delete tickets" ON public.feedback_tickets;
DROP POLICY "Read messages of accessible tickets" ON public.feedback_messages;
DROP POLICY "Write messages on accessible tickets" ON public.feedback_messages;

CREATE POLICY "Users read own tickets" ON public.feedback_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update tickets" ON public.feedback_tickets
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin delete tickets" ON public.feedback_tickets
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Read messages of accessible tickets" ON public.feedback_messages
  FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.feedback_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Write messages on accessible tickets" ON public.feedback_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      private.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.feedback_tickets t
        WHERE t.id = ticket_id AND t.user_id = auth.uid()
      )
    )
  );

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);