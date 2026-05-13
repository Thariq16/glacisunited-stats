DROP POLICY IF EXISTS "Anyone can submit a signup" ON public.service_signups;

CREATE POLICY "Anyone can submit a signup"
ON public.service_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(email) BETWEEN 3 AND 320
  AND length(full_name) BETWEEN 1 AND 200
  AND length(package) BETWEEN 1 AND 100
  AND (message IS NULL OR length(message) <= 2000)
  AND (team_name IS NULL OR length(team_name) <= 200)
  AND (phone IS NULL OR length(phone) <= 50)
  AND (role IS NULL OR length(role) <= 100)
);