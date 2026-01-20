-- Add seconds column to match_events table for precise mm:ss timestamps
ALTER TABLE public.match_events 
ADD COLUMN seconds integer DEFAULT 0;