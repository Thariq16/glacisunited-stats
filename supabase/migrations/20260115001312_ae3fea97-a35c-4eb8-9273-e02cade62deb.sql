-- Update SELECT policies to require authentication instead of public access

-- Matches table
DROP POLICY IF EXISTS "Matches are publicly readable" ON public.matches;
CREATE POLICY "Matches are viewable by authenticated users"
  ON public.matches FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Players table
DROP POLICY IF EXISTS "Players are publicly readable" ON public.players;
CREATE POLICY "Players are viewable by authenticated users"
  ON public.players FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Match events table
DROP POLICY IF EXISTS "Match events are publicly readable" ON public.match_events;
CREATE POLICY "Match events are viewable by authenticated users"
  ON public.match_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Player match stats table
DROP POLICY IF EXISTS "Player match stats are publicly readable" ON public.player_match_stats;
CREATE POLICY "Player match stats are viewable by authenticated users"
  ON public.player_match_stats FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Teams table
DROP POLICY IF EXISTS "Teams are publicly readable" ON public.teams;
CREATE POLICY "Teams are viewable by authenticated users"
  ON public.teams FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);