UPDATE public.characters SET vocation = CASE vocation
  WHEN 'Knight' THEN 'Elite Knight'
  WHEN 'Paladin' THEN 'Royal Paladin'
  WHEN 'Sorcerer' THEN 'Master Sorcerer'
  WHEN 'Druid' THEN 'Elder Druid'
  WHEN 'Monk' THEN 'Exalted Monk'
  ELSE vocation END
WHERE vocation IN ('Knight','Paladin','Sorcerer','Druid','Monk');

UPDATE public.hunt_sessions SET char_vocation = CASE char_vocation
  WHEN 'Knight' THEN 'Elite Knight'
  WHEN 'Paladin' THEN 'Royal Paladin'
  WHEN 'Sorcerer' THEN 'Master Sorcerer'
  WHEN 'Druid' THEN 'Elder Druid'
  WHEN 'Monk' THEN 'Exalted Monk'
  ELSE char_vocation END
WHERE char_vocation IN ('Knight','Paladin','Sorcerer','Druid','Monk');

ALTER TABLE public.characters
  ADD CONSTRAINT characters_vocation_promoted_check
  CHECK (vocation IN ('Elite Knight','Royal Paladin','Master Sorcerer','Elder Druid','Exalted Monk'));

ALTER TABLE public.hunt_sessions
  ADD CONSTRAINT hunt_sessions_char_vocation_promoted_check
  CHECK (char_vocation IS NULL OR char_vocation IN ('Elite Knight','Royal Paladin','Master Sorcerer','Elder Druid','Exalted Monk'));