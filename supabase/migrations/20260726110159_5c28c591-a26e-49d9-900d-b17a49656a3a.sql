CREATE OR REPLACE FUNCTION public.fill_session_character_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.char_name IS NULL OR btrim(NEW.char_name) = ''
     OR NEW.char_vocation IS NULL OR btrim(NEW.char_vocation) = '' THEN
    SELECT c.name, c.vocation INTO NEW.char_name, NEW.char_vocation
    FROM public.characters c
    WHERE c.id = NEW.character_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_session_character_info ON public.hunt_sessions;
CREATE TRIGGER trg_fill_session_character_info
BEFORE INSERT OR UPDATE ON public.hunt_sessions
FOR EACH ROW EXECUTE FUNCTION public.fill_session_character_info();