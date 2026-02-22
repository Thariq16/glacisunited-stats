
-- Add playing time columns to matches table
ALTER TABLE public.matches
  ADD COLUMN h1_injury_time_seconds integer DEFAULT 0,
  ADD COLUMN h2_injury_time_seconds integer DEFAULT 0,
  ADD COLUMN h1_playing_time_seconds integer DEFAULT 2700,
  ADD COLUMN h2_playing_time_seconds integer DEFAULT 2700;
