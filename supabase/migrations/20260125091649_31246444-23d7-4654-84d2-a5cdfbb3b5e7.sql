-- Function to recalculate match scores from goal events
CREATE OR REPLACE FUNCTION update_match_scores()
RETURNS TRIGGER AS $$
DECLARE
  v_match_id uuid;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_home_score integer;
  v_away_score integer;
BEGIN
  -- Get the match_id from either NEW or OLD record
  v_match_id := COALESCE(NEW.match_id, OLD.match_id);
  
  -- Get team IDs for this match
  SELECT home_team_id, away_team_id 
  INTO v_home_team_id, v_away_team_id
  FROM matches 
  WHERE id = v_match_id;
  
  -- Count goals for each team
  SELECT 
    COALESCE(SUM(CASE WHEN p.team_id = v_home_team_id THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.team_id = v_away_team_id THEN 1 ELSE 0 END), 0)
  INTO v_home_score, v_away_score
  FROM match_events me
  JOIN players p ON me.player_id = p.id
  WHERE me.match_id = v_match_id
    AND me.event_type = 'shot'
    AND me.shot_outcome = 'goal';
  
  -- Update match scores
  UPDATE matches 
  SET home_score = v_home_score, away_score = v_away_score
  WHERE id = v_match_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for INSERT
CREATE TRIGGER trigger_update_match_scores_insert
AFTER INSERT ON match_events
FOR EACH ROW
WHEN (NEW.event_type = 'shot' AND NEW.shot_outcome = 'goal')
EXECUTE FUNCTION update_match_scores();

-- Trigger for UPDATE (when shot_outcome changes)
CREATE TRIGGER trigger_update_match_scores_update
AFTER UPDATE ON match_events
FOR EACH ROW
WHEN (
  (OLD.event_type = 'shot' AND OLD.shot_outcome = 'goal') OR
  (NEW.event_type = 'shot' AND NEW.shot_outcome = 'goal')
)
EXECUTE FUNCTION update_match_scores();

-- Trigger for DELETE
CREATE TRIGGER trigger_update_match_scores_delete
AFTER DELETE ON match_events
FOR EACH ROW
WHEN (OLD.event_type = 'shot' AND OLD.shot_outcome = 'goal')
EXECUTE FUNCTION update_match_scores();