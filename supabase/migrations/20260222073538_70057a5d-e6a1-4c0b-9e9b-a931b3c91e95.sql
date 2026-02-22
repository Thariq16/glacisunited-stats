
-- Add optional fields to players table
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg integer,
  ADD COLUMN IF NOT EXISTS preferred_foot text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS contract_end_date date,
  ADD COLUMN IF NOT EXISTS transfer_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS on_loan boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS injury_status text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS bio text;
