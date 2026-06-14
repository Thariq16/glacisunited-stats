CREATE TABLE public.match_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  club_name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  match_date DATE,
  opponent TEXT,
  competition TEXT,
  package TEXT NOT NULL CHECK (package IN ('essentials', 'pro')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyst_notes TEXT,
  invoice_amount NUMERIC(10,2)
);

GRANT INSERT ON public.match_submissions TO anon, authenticated;
GRANT ALL ON public.match_submissions TO service_role;

ALTER TABLE public.match_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated marketing visitors) can submit a match
CREATE POLICY "Anyone can submit a match"
  ON public.match_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service_role / backend can read or modify; no client SELECT policy on purpose.