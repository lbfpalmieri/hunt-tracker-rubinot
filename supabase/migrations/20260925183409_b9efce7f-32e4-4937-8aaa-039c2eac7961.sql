ALTER TABLE public.feedback_tickets ADD COLUMN IF NOT EXISTS attachment_path text;
CREATE POLICY "Users upload own feedback attachments" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'feedback-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner or admin read feedback attachments" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'feedback-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Owner or admin delete feedback attachments" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'feedback-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'::public.app_role)));