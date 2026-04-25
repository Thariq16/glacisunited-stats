-- Sign-ups submitted from the public pricing page
CREATE TABLE public.service_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  team_name text,
  role text,
  package text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_signups ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can submit
CREATE POLICY "Anyone can submit a signup"
ON public.service_signups
FOR INSERT
WITH CHECK (true);

-- Only admins can view / manage
CREATE POLICY "Admins can view signups"
ON public.service_signups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update signups"
ON public.service_signups
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete signups"
ON public.service_signups
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_service_signups_updated_at
BEFORE UPDATE ON public.service_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_service_signups_created_at ON public.service_signups (created_at DESC);
CREATE INDEX idx_service_signups_status ON public.service_signups (status);