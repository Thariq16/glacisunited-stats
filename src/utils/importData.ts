import { supabase } from '@/integrations/supabase/client';
import { parseCSV } from './parseCSV';

export async function importTeams() {
  const teams = [
    { name: 'Glacis United', slug: 'glacis-united' },
    { name: 'Europa Point FC', slug: 'europa-point' },
  ];

  const { data, error } = await supabase
    .from('teams')
    .upsert(teams, { onConflict: 'slug', ignoreDuplicates: false })
    .select();

  if (error) throw error;
  return data;
}

export async function importMatch(
  homeTeamSlug: string,
  awayTeamSlug: string,
  matchDate: string,
  homeScore: number,
  awayScore: number,
  venue: string,
  competition: string
) {
  // Get team IDs
  const { data: teams } = await supabase
    .from('teams')
    .select('id, slug')
    .in('slug', [homeTeamSlug, awayTeamSlug]);

  if (!teams || teams.length !== 2) throw new Error('Teams not found');

  const homeTeam = teams.find(t => t.slug === homeTeamSlug);
  const awayTeam = teams.find(t => t.slug === awayTeamSlug);

  const { data, error } = await supabase
    .from('matches')
    .insert({
      home_team_id: homeTeam!.id,
      away_team_id: awayTeam!.id,
      match_date: matchDate,
      home_score: homeScore,
      away_score: awayScore,
      venue,
      competition,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function importPlayerStats(
  teamSlug: string,
  matchId: string,
  csvData1st: string,
  csvData2nd: string
) {
  // Get team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', teamSlug)
    .single();

  if (!team) throw new Error('Team not found');

  // Parse CSV data
  const stats1st = parseCSV(csvData1st);
  const stats2nd = parseCSV(csvData2nd);

  // Import players and their stats
  for (const stat of stats1st) {
    // Insert or get player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .upsert(
        {
          team_id: team.id,
          jersey_number: parseInt(stat.jerseyNumber) || 0,
          name: stat.playerName,
          role: stat.role,
        },
        { onConflict: 'team_id,jersey_number,name' }
      )
      .select()
      .single();

    if (playerError) throw playerError;

    // Insert 1st half stats
    await supabase.from('player_match_stats').upsert({
      player_id: player.id,
      match_id: matchId,
      half: 1,
      pass_count: stat.passCount,
      successful_pass: stat.successfulPass,
      miss_pass: stat.missPass,
      forward_pass: stat.forwardPass,
      backward_pass: stat.backwardPass,
      goals: stat.goals,
      penalty_area_pass: stat.penaltyAreaPass,
      penalty_area_entry: stat.penaltyAreaEntry,
      shots_attempted: stat.shotsAttempted,
      shots_on_target: stat.shotsOnTarget,
      saves: stat.saves,
      defensive_errors: stat.defensiveErrors,
      aerial_duels_won: stat.aerialDuelsWon,
      aerial_duels_lost: stat.aerialDuelsLost,
      tackles: stat.tackles,
      clearance: stat.clearance,
      fouls: stat.fouls,
      fouls_final_third: stat.foulsInFinalThird,
      fouls_middle_third: stat.foulsInMiddleThird,
      fouls_defensive_third: stat.foulsInDefensiveThird,
      foul_won: stat.foulWon,
      fw_final_3rd: stat.fwFinalThird,
      fw_middle_3rd: stat.fwMiddleThird,
      fw_defensive_3rd: stat.fwDefensiveThird,
      cut_backs: stat.cutBacks,
      crosses: stat.crosses,
      free_kicks: stat.freeKicks,
      corners: stat.corners,
      corner_failed: stat.cornerFailed,
      corner_success: stat.cornerSuccess,
      throw_ins: stat.throwIns,
      ti_failed: stat.tiFailed,
      ti_success: stat.tiSuccess,
      offside: stat.offside,
    });
  }

  // Import 2nd half stats
  for (const stat of stats2nd) {
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', team.id)
      .eq('jersey_number', parseInt(stat.jerseyNumber) || 0)
      .eq('name', stat.playerName)
      .single();

    if (!player) continue;

    await supabase.from('player_match_stats').upsert({
      player_id: player.id,
      match_id: matchId,
      half: 2,
      pass_count: stat.passCount,
      successful_pass: stat.successfulPass,
      miss_pass: stat.missPass,
      forward_pass: stat.forwardPass,
      backward_pass: stat.backwardPass,
      goals: stat.goals,
      penalty_area_pass: stat.penaltyAreaPass,
      penalty_area_entry: stat.penaltyAreaEntry,
      shots_attempted: stat.shotsAttempted,
      shots_on_target: stat.shotsOnTarget,
      saves: stat.saves,
      defensive_errors: stat.defensiveErrors,
      aerial_duels_won: stat.aerialDuelsWon,
      aerial_duels_lost: stat.aerialDuelsLost,
      tackles: stat.tackles,
      clearance: stat.clearance,
      fouls: stat.fouls,
      fouls_final_third: stat.foulsInFinalThird,
      fouls_middle_third: stat.foulsInMiddleThird,
      fouls_defensive_third: stat.foulsInDefensiveThird,
      foul_won: stat.foulWon,
      fw_final_3rd: stat.fwFinalThird,
      fw_middle_3rd: stat.fwMiddleThird,
      fw_defensive_3rd: stat.fwDefensiveThird,
      cut_backs: stat.cutBacks,
      crosses: stat.crosses,
      free_kicks: stat.freeKicks,
      corners: stat.corners,
      corner_failed: stat.cornerFailed,
      corner_success: stat.cornerSuccess,
      throw_ins: stat.throwIns,
      ti_failed: stat.tiFailed,
      ti_success: stat.tiSuccess,
      offside: stat.offside,
    });
  }
}
