ALTER TABLE public.feedback_tickets ADD COLUMN IF NOT EXISTS char_name text;
ALTER TABLE public.feedback_messages ADD COLUMN IF NOT EXISTS char_name text;