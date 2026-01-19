-- Add hidden column to players table if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;

-- ===== BJ Emmanuel Consolidation (from previous plan) =====
-- Move stats from jersey #16 to jersey #9
UPDATE player_match_stats 
SET player_id = 'b124ffff-852b-468a-9926-2e1673b4cf6c' 
WHERE player_id = 'b01bd2ad-5919-472b-ba39-b6f2618014f0';

-- Move stats from jersey #25 to jersey #9  
UPDATE player_match_stats 
SET player_id = 'b124ffff-852b-468a-9926-2e1673b4cf6c' 
WHERE player_id = '48524055-3de8-4b1c-9985-fdd4811b7e23';

-- Move stats from jersey #26 to jersey #9
UPDATE player_match_stats 
SET player_id = 'b124ffff-852b-468a-9926-2e1673b4cf6c' 
WHERE player_id = 'b6c44bda-9f1c-480a-8bb0-e8d48dd35610';

-- Mark BJ Emmanuel duplicates as hidden
UPDATE players SET hidden = true 
WHERE id IN (
  'b01bd2ad-5919-472b-ba39-b6f2618014f0',
  '48524055-3de8-4b1c-9985-fdd4811b7e23',
  'b6c44bda-9f1c-480a-8bb0-e8d48dd35610'
);

-- Update BJ Emmanuel #9 role
UPDATE players SET role = 'LW' WHERE id = 'b124ffff-852b-468a-9926-2e1673b4cf6c';

-- ===== K Klaudio Consolidation =====
-- Move K Klaudio #9 stats to #10
UPDATE player_match_stats 
SET player_id = '77b2ac73-e94d-45aa-90d8-b8fb2bcebd83'
WHERE player_id = '7fc73eeb-f47e-4557-ba6c-6d5280c6657e';

-- Mark K Klaudio #9 as hidden
UPDATE players SET hidden = true 
WHERE id = '7fc73eeb-f47e-4557-ba6c-6d5280c6657e';

-- ===== AE Thomas Consolidation =====
-- Move AE Thomas #23 stats to #6
UPDATE player_match_stats 
SET player_id = '0767f2f6-caba-4285-8e72-82af6001e67b'
WHERE player_id = '71857df1-cce5-4cce-befa-6860674e5b31';

-- Mark AE Thomas #23 as hidden
UPDATE players SET hidden = true 
WHERE id = '71857df1-cce5-4cce-befa-6860674e5b31';