-- ===== BJ Adam Consolidation =====
-- Move BJ Adam #5 stats to #25
UPDATE player_match_stats 
SET player_id = '78898c5c-9ef0-4260-953b-0741cef624d7'  -- #25
WHERE player_id = 'a3f7fd69-aace-44a0-914e-cc7f58ca937e'; -- #5

-- Move any match_events from #5 to #25
UPDATE match_events 
SET player_id = '78898c5c-9ef0-4260-953b-0741cef624d7'
WHERE player_id = 'a3f7fd69-aace-44a0-914e-cc7f58ca937e';

-- Move any match_events target_player_id from #5 to #25
UPDATE match_events 
SET target_player_id = '78898c5c-9ef0-4260-953b-0741cef624d7'
WHERE target_player_id = 'a3f7fd69-aace-44a0-914e-cc7f58ca937e';

-- Move any match_events substitute_player_id from #5 to #25
UPDATE match_events 
SET substitute_player_id = '78898c5c-9ef0-4260-953b-0741cef624d7'
WHERE substitute_player_id = 'a3f7fd69-aace-44a0-914e-cc7f58ca937e';

-- Move any match_squad entries from #5 to #25
UPDATE match_squad 
SET player_id = '78898c5c-9ef0-4260-953b-0741cef624d7'
WHERE player_id = 'a3f7fd69-aace-44a0-914e-cc7f58ca937e';

-- Mark BJ Adam #5 as hidden
UPDATE players SET hidden = true 
WHERE id = 'a3f7fd69-aace-44a0-914e-cc7f58ca937e';