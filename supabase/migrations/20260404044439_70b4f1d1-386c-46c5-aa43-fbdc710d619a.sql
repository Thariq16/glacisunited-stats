-- Allow public read access to organizations (for org selector page)
CREATE POLICY "Organizations are publicly readable"
ON public.organizations
FOR SELECT
USING (true);
