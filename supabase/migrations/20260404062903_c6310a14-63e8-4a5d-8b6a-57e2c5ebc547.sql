ALTER TABLE public.organizations
  ADD COLUMN primary_color text DEFAULT NULL,
  ADD COLUMN accent_color text DEFAULT NULL;