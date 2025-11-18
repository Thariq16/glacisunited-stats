-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  jersey_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, jersey_number, name)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  match_date DATE NOT NULL,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  venue TEXT,
  competition TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player match stats table
CREATE TABLE public.player_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  half INTEGER NOT NULL CHECK (half IN (1, 2)),
  pass_count INTEGER DEFAULT 0,
  successful_pass INTEGER DEFAULT 0,
  miss_pass INTEGER DEFAULT 0,
  forward_pass INTEGER DEFAULT 0,
  backward_pass INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  penalty_area_pass INTEGER DEFAULT 0,
  penalty_area_entry INTEGER DEFAULT 0,
  shots_attempted INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  defensive_errors INTEGER DEFAULT 0,
  aerial_duels_won INTEGER DEFAULT 0,
  aerial_duels_lost INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  clearance INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  fouls_final_third INTEGER DEFAULT 0,
  fouls_middle_third INTEGER DEFAULT 0,
  fouls_defensive_third INTEGER DEFAULT 0,
  foul_won INTEGER DEFAULT 0,
  fw_final_3rd INTEGER DEFAULT 0,
  fw_middle_3rd INTEGER DEFAULT 0,
  fw_defensive_3rd INTEGER DEFAULT 0,
  cut_backs INTEGER DEFAULT 0,
  crosses INTEGER DEFAULT 0,
  free_kicks INTEGER DEFAULT 0,
  corners INTEGER DEFAULT 0,
  corner_failed INTEGER DEFAULT 0,
  corner_success INTEGER DEFAULT 0,
  throw_ins INTEGER DEFAULT 0,
  ti_failed INTEGER DEFAULT 0,
  ti_success INTEGER DEFAULT 0,
  offside INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, match_id, half)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (sports statistics are public data)
CREATE POLICY "Teams are publicly readable"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Players are publicly readable"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Matches are publicly readable"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Player match stats are publicly readable"
  ON public.player_match_stats FOR SELECT
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_players_team_id ON public.players(team_id);
CREATE INDEX idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_player_match_stats_player ON public.player_match_stats(player_id);
CREATE INDEX idx_player_match_stats_match ON public.player_match_stats(match_id);