
-- Table to store push notification subscriptions from PWA users
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (no auth required for PWA users)
CREATE POLICY "Anyone can insert push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);

-- Only edge functions (service role) can read subscriptions for sending
CREATE POLICY "Subscriptions are not publicly readable"
  ON public.push_subscriptions FOR SELECT
  USING (false);

-- Allow users to delete their own subscription by endpoint
CREATE POLICY "Anyone can delete their own subscription"
  ON public.push_subscriptions FOR DELETE
  USING (true);
