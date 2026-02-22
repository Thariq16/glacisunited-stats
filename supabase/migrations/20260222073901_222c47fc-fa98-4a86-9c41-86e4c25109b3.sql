
-- Allow coaches to update players
CREATE POLICY "Coaches can update players"
ON public.players
FOR UPDATE
USING (is_coach(auth.uid()))
WITH CHECK (is_coach(auth.uid()));

-- Allow coaches to insert players
CREATE POLICY "Coaches can insert players"
ON public.players
FOR INSERT
WITH CHECK (is_coach(auth.uid()));
