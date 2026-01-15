-- Make matches publicly readable
DROP POLICY IF EXISTS "Matches are viewable by authenticated users" ON public.matches;
CREATE POLICY "Matches are publicly readable"
  ON public.matches FOR SELECT
  USING (true);

-- Make players publicly readable
DROP POLICY IF EXISTS "Players are viewable by authenticated users" ON public.players;
CREATE POLICY "Players are publicly readable"
  ON public.players FOR SELECT
  USING (true);

-- Make match_events publicly readable
DROP POLICY IF EXISTS "Match events are viewable by authenticated users" ON public.match_events;
CREATE POLICY "Match events are publicly readable"
  ON public.match_events FOR SELECT
  USING (true);

-- Make player_match_stats publicly readable
DROP POLICY IF EXISTS "Player match stats are viewable by authenticated users" ON public.player_match_stats;
CREATE POLICY "Player match stats are publicly readable"
  ON public.player_match_stats FOR SELECT
  USING (true);

-- Make teams publicly readable
DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON public.teams;
CREATE POLICY "Teams are publicly readable"
  ON public.teams FOR SELECT
  USING (true);

-- Make profiles publicly readable
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

-- NOTE: match_comments table already has correct policies:
-- - Admins have full access
-- - Coaches can view and reply
-- No changes needed for match_comments