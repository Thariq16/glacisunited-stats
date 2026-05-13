DROP POLICY IF EXISTS "Anyone can insert push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete their own subscription" ON public.push_subscriptions;

CREATE POLICY "Authenticated users can insert push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);