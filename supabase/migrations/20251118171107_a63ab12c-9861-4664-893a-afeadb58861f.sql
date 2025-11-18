-- Add INSERT policies for data import

CREATE POLICY "Anyone can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert players"
  ON public.players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert player match stats"
  ON public.player_match_stats FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policies for upsert operations

CREATE POLICY "Anyone can update teams"
  ON public.teams FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON public.players FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can update matches"
  ON public.matches FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can update player match stats"
  ON public.player_match_stats FOR UPDATE
  USING (true)
  WITH CHECK (true);