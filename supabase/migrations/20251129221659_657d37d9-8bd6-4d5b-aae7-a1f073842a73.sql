-- Create helper function for coach check
CREATE OR REPLACE FUNCTION public.is_coach(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'coach'::app_role
  )
$$;

-- Create match_comments table
CREATE TABLE public.match_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_comments ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_match_comments_updated_at
BEFORE UPDATE ON public.match_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins have full access to match comments"
ON public.match_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Coaches can read comments
CREATE POLICY "Coaches can view match comments"
ON public.match_comments
FOR SELECT
USING (is_coach(auth.uid()));