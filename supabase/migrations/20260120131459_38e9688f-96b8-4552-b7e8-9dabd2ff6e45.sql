-- Create attacking_phases table to store phase metadata
CREATE TABLE public.attacking_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  half INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('goal', 'shot', 'lost_possession')),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attacking_phases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Phases are publicly readable"
  ON public.attacking_phases FOR SELECT USING (true);

CREATE POLICY "Only admins can insert phases"
  ON public.attacking_phases FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update phases"
  ON public.attacking_phases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete phases"
  ON public.attacking_phases FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_attacking_phases_updated_at
  BEFORE UPDATE ON public.attacking_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();