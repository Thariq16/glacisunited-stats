
-- 1) Players: revoke sensitive columns from anon (public web)
REVOKE SELECT (date_of_birth, contract_end_date, transfer_status, injury_status, on_loan)
  ON public.players FROM anon;

-- 2) push_subscriptions: add user_id and scope policies
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: orphan rows have no owner; leave null and they become unreachable via RLS
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

DROP POLICY IF EXISTS "Authenticated users can insert push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can delete push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Subscriptions are not publicly readable" ON public.push_subscriptions;

CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) Storage org-logos: scope writes to org admins based on first path segment (org id)
DROP POLICY IF EXISTS "Authenticated users can upload org logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update org logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete org logos" ON storage.objects;

CREATE POLICY "Org admins can upload their org logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org admins can update their org logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'org-logos'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org admins can delete their org logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
