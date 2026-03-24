
-- Create seasons table
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Seasons are publicly readable
CREATE POLICY "Seasons are publicly readable" ON public.seasons
  FOR SELECT TO public USING (true);

-- Only admins can manage seasons
CREATE POLICY "Only admins can insert seasons" ON public.seasons
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update seasons" ON public.seasons
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete seasons" ON public.seasons
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add season_id to matches
ALTER TABLE public.matches ADD COLUMN season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL;

-- Auto-assign existing matches to a default season
-- First create a 2024/25 season (Aug 2024 - Mar 2025)
INSERT INTO public.seasons (name, start_date, end_date, status)
VALUES ('2024/25', '2024-08-01', '2025-03-31', 'active');

-- Assign existing matches that fall within that range
UPDATE public.matches
SET season_id = (SELECT id FROM public.seasons WHERE name = '2024/25' LIMIT 1)
WHERE match_date >= '2024-08-01' AND match_date <= '2025-03-31';
