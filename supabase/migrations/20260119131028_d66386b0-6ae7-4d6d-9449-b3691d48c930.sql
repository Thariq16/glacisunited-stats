-- Create match_squad table to persist squad selections
CREATE TABLE public.match_squad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_type text NOT NULL CHECK (team_type IN ('home', 'away')),
  status text NOT NULL CHECK (status IN ('starting', 'substitute')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);

-- Enable RLS
ALTER TABLE public.match_squad ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Match squad is publicly readable"
ON public.match_squad
FOR SELECT
USING (true);

-- Admin-only insert
CREATE POLICY "Only admins can insert match squad"
ON public.match_squad
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin-only update
CREATE POLICY "Only admins can update match squad"
ON public.match_squad
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin-only delete
CREATE POLICY "Only admins can delete match squad"
ON public.match_squad
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));