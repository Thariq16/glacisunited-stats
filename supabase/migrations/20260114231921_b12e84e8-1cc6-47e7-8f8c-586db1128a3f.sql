-- Add status to matches table
ALTER TABLE public.matches 
ADD COLUMN status text NOT NULL DEFAULT 'scheduled';

-- Create match_events table for persistent event storage
CREATE TABLE public.match_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  half integer NOT NULL,
  minute integer NOT NULL,
  x numeric NOT NULL DEFAULT 50,
  y numeric NOT NULL DEFAULT 50,
  end_x numeric,
  end_y numeric,
  successful boolean NOT NULL DEFAULT true,
  shot_outcome text,
  aerial_outcome text,
  target_player_id UUID REFERENCES public.players(id),
  substitute_player_id UUID REFERENCES public.players(id),
  phase_id text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_events
CREATE POLICY "Match events are publicly readable"
  ON public.match_events FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert match events"
  ON public.match_events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update match events"
  ON public.match_events FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete match events"
  ON public.match_events FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX idx_match_events_player_id ON public.match_events(player_id);