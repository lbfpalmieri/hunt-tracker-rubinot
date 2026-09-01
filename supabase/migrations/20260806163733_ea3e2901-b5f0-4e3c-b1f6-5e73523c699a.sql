DROP POLICY "Users manage own characters" ON public.characters;
CREATE POLICY "Users manage own characters" ON public.characters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users manage own hunts" ON public.hunts;
CREATE POLICY "Users manage own hunts" ON public.hunts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users manage own imbuements" ON public.imbuements;
CREATE POLICY "Users manage own imbuements" ON public.imbuements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users manage own sessions" ON public.hunt_sessions;
CREATE POLICY "Users manage own sessions" ON public.hunt_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);