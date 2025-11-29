-- Add new columns for Run in Behind, Overlaps, and Minutes Played
ALTER TABLE player_match_stats 
ADD COLUMN IF NOT EXISTS run_in_behind integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "overlaps" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS minutes_played integer DEFAULT 0;