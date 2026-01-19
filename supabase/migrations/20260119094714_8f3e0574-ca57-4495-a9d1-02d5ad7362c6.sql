-- Add attack direction field to matches table
-- If true, home team attacks left goal in first half (and right in second half)
-- If false, home team attacks right goal in first half (and left in second half)
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS home_attacks_left boolean DEFAULT true;