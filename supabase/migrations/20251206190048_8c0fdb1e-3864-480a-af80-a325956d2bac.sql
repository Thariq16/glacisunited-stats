-- Add parent_id column for reply threading
ALTER TABLE public.match_comments 
ADD COLUMN parent_id uuid REFERENCES public.match_comments(id) ON DELETE CASCADE;

-- Create index for faster reply lookups
CREATE INDEX idx_match_comments_parent_id ON public.match_comments(parent_id);

-- Allow coaches to insert replies (comments with parent_id)
CREATE POLICY "Coaches can add replies to comments"
ON public.match_comments
FOR INSERT
TO authenticated
WITH CHECK (
  is_coach(auth.uid()) AND parent_id IS NOT NULL
);