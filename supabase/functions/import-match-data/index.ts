import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_NAME_LENGTH = 100;
const MAX_VENUE_LENGTH = 200;
const MAX_COMPETITION_LENGTH = 100;

// Validation schemas - more lenient for edge cases
const playerStatsSchema = z.object({
  jerseyNumber: z.number().int().min(1).max(99),
  playerName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  role: z.string().trim().max(50),
  passCount: z.number().int().min(0).max(10000),
  successfulPass: z.number().int().min(0).max(10000),
  missPass: z.number().int().min(0).max(10000),
  forwardPass: z.number().int().min(0).max(10000),
  backwardPass: z.number().int().min(0).max(10000),
  goals: z.number().int().min(0).max(100),
  penaltyAreaPass: z.number().int().min(0).max(10000),
  penaltyAreaEntry: z.number().int().min(0).max(10000),
  shotsAttempted: z.number().int().min(0).max(1000),
  shotsOnTarget: z.number().int().min(0).max(1000),
  saves: z.number().int().min(0).max(1000),
  defensiveErrors: z.number().int().min(0).max(1000),
  aerialDuelsWon: z.number().int().min(0).max(1000),
  aerialDuelsLost: z.number().int().min(0).max(1000),
  tackles: z.number().int().min(0).max(1000),
  clearance: z.number().int().min(0).max(1000),
  fouls: z.number().int().min(0).max(1000),
  foulsInFinalThird: z.number().int().min(0).max(1000),
  foulsInMiddleThird: z.number().int().min(0).max(1000),
  foulsInDefensiveThird: z.number().int().min(0).max(1000),
  foulWon: z.number().int().min(0).max(1000),
  fwFinalThird: z.number().int().min(0).max(1000),
  fwMiddleThird: z.number().int().min(0).max(1000),
  fwDefensiveThird: z.number().int().min(0).max(1000),
  cutBacks: z.number().int().min(0).max(1000),
  crosses: z.number().int().min(0).max(1000),
  freeKicks: z.number().int().min(0).max(1000),
  corners: z.number().int().min(0).max(1000),
  cornerFailed: z.number().int().min(0).max(1000),
  cornerSuccess: z.number().int().min(0).max(1000),
  throwIns: z.number().int().min(0).max(1000),
  tiFailed: z.number().int().min(0).max(1000),
  tiSuccess: z.number().int().min(0).max(1000),
  offside: z.number().int().min(0).max(1000),
});

const matchDataSchema = z.object({
  homeTeamName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  awayTeamName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  venue: z.string().trim().max(MAX_VENUE_LENGTH).optional(),
  competition: z.string().trim().max(MAX_COMPETITION_LENGTH).optional(),
});

interface PlayerStats {
  jerseyNumber: number;
  playerName: string;
  role: string;
  passCount: number;
  successfulPass: number;
  missPass: number;
  forwardPass: number;
  backwardPass: number;
  goals: number;
  penaltyAreaPass: number;
  penaltyAreaEntry: number;
  shotsAttempted: number;
  shotsOnTarget: number;
  saves: number;
  defensiveErrors: number;
  aerialDuelsWon: number;
  aerialDuelsLost: number;
  tackles: number;
  clearance: number;
  fouls: number;
  foulsInFinalThird: number;
  foulsInMiddleThird: number;
  foulsInDefensiveThird: number;
  foulWon: number;
  fwFinalThird: number;
  fwMiddleThird: number;
  fwDefensiveThird: number;
  cutBacks: number;
  crosses: number;
  freeKicks: number;
  corners: number;
  cornerFailed: number;
  cornerSuccess: number;
  throwIns: number;
  tiFailed: number;
  tiSuccess: number;
  offside: number;
}

// Helper to safely parse integer, returning 0 for invalid values
function safeInt(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;
  // Remove percentage signs and parse
  const cleaned = value.replace('%', '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// Check if a value looks like a percentage (contains % or is a decimal string)
function isPercentageColumn(value: string): boolean {
  return value.includes('%') || /^\d+\.\d+%?$/.test(value.trim());
}

function parseCSV(csvText: string): PlayerStats[] {
  const lines = csvText.trim().split('\n');
  
  // Validate CSV structure
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header to understand column structure
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  console.log('CSV Header columns:', header.length, 'headers:', header.slice(0, 15).join(', '));

  const players: PlayerStats[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, total rows, or rows without valid jersey numbers
    if (!line) continue;
    if (line.toLowerCase().includes('total')) continue;
    
    const values = line.split(',').map(v => v.trim());
    
    // Skip if first column (jersey number) is empty or not a valid number
    const jerseyNum = safeInt(values[0]);
    if (jerseyNum < 1 || jerseyNum > 99) {
      console.log(`Skipping line ${i + 1}: Invalid or empty jersey number "${values[0]}"`);
      continue;
    }
    
    // Skip if player name is empty
    if (!values[1] || values[1].trim() === '') {
      console.log(`Skipping line ${i + 1}: Empty player name`);
      continue;
    }

    // Filter out percentage columns - keep only non-percentage values
    // The CSV format has: Jersey#, Name, Role, then stat pairs of (value, percentage)
    // We need to extract just the value columns
    
    // First 3 columns are always: Jersey#, Player Name, Role
    const baseValues = [values[0], values[1], values[2] || ''];
    
    // For remaining columns, skip percentage columns
    const statValues: string[] = [];
    for (let j = 3; j < values.length; j++) {
      const val = values[j];
      // Skip if it looks like a percentage
      if (!isPercentageColumn(val)) {
        statValues.push(val);
      }
    }

    console.log(`Line ${i + 1}: Jersey=${jerseyNum}, Player=${values[1]}, Stats count=${statValues.length}`);

    // Map to expected structure
    // Expected order after filtering percentages:
    // 0: Pass Count, 1: Successful Pass, 2: Miss Pass, 3: Forward Pass, 4: Backward Pass,
    // 5: Goals, 6: Penalty Area Pass, 7: Penalty Area Entry, 8: Shots Attempted, 9: Shots on Target,
    // 10: Saves, 11: Defensive Errors, 12: Aerial Duels Won, 13: Aerial Duels Lost,
    // 14: Tackles, 15: Clearance, 16: Fouls, 17: Fouls Final Third, 18: Fouls Middle Third,
    // 19: Fouls Defensive Third, 20: Foul Won, 21: FW Final 3rd, 22: FW Middle 3rd, 23: FW Defensive 3rd,
    // 24: Cut Backs, 25: Crosses, 26: Free Kicks, 27: Corners, 28: Corner Failed, 29: Corner Success,
    // 30: Throw Ins, 31: TI Failed, 32: TI Success, 33: Offside

    const rawPlayer = {
      jerseyNumber: jerseyNum,
      playerName: values[1].trim(),
      role: (values[2] || '').trim(),
      passCount: safeInt(statValues[0]),
      successfulPass: safeInt(statValues[1]),
      missPass: safeInt(statValues[2]),
      forwardPass: safeInt(statValues[3]),
      backwardPass: safeInt(statValues[4]),
      goals: safeInt(statValues[5]),
      penaltyAreaPass: safeInt(statValues[6]),
      penaltyAreaEntry: safeInt(statValues[7]),
      shotsAttempted: safeInt(statValues[8]),
      shotsOnTarget: safeInt(statValues[9]),
      saves: safeInt(statValues[10]),
      defensiveErrors: safeInt(statValues[11]),
      aerialDuelsWon: safeInt(statValues[12]),
      aerialDuelsLost: safeInt(statValues[13]),
      tackles: safeInt(statValues[14]),
      clearance: safeInt(statValues[15]),
      fouls: safeInt(statValues[16]),
      foulsInFinalThird: safeInt(statValues[17]),
      foulsInMiddleThird: safeInt(statValues[18]),
      foulsInDefensiveThird: safeInt(statValues[19]),
      foulWon: safeInt(statValues[20]),
      fwFinalThird: safeInt(statValues[21]),
      fwMiddleThird: safeInt(statValues[22]),
      fwDefensiveThird: safeInt(statValues[23]),
      cutBacks: safeInt(statValues[24]),
      crosses: safeInt(statValues[25]),
      freeKicks: safeInt(statValues[26]),
      corners: safeInt(statValues[27]),
      cornerFailed: safeInt(statValues[28]),
      cornerSuccess: safeInt(statValues[29]),
      throwIns: safeInt(statValues[30]),
      tiFailed: safeInt(statValues[31]),
      tiSuccess: safeInt(statValues[32]),
      offside: safeInt(statValues[33]),
    };

    // Validate player data with zod schema
    try {
      const validatedPlayer = playerStatsSchema.parse(rawPlayer);
      players.push(validatedPlayer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`Validation error at line ${i + 1}:`, JSON.stringify(error.errors, null, 2));
        throw new Error(`Validation error at line ${i + 1}: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }

  if (players.length === 0) {
    throw new Error('CSV file contains no valid player data');
  }

  console.log(`Successfully parsed ${players.length} players`);
  return players;
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const formData = await req.formData();
    
    // Validate match data
    const rawMatchData = {
      homeTeamName: formData.get('homeTeamName') as string,
      awayTeamName: formData.get('awayTeamName') as string,
      matchDate: formData.get('matchDate') as string,
      homeScore: parseInt(formData.get('homeScore') as string) || 0,
      awayScore: parseInt(formData.get('awayScore') as string) || 0,
      venue: formData.get('venue') as string || '',
      competition: formData.get('competition') as string || 'League',
    };

    const validatedMatchData = matchDataSchema.parse(rawMatchData);
    const { homeTeamName, awayTeamName, matchDate, homeScore, awayScore, venue, competition } = validatedMatchData;
    
    // Get CSV files and validate size
    const homeTeam1stCSV = formData.get('homeTeam1stCSV') as File;
    const homeTeam2ndCSV = formData.get('homeTeam2ndCSV') as File;
    const awayTeam1stCSV = formData.get('awayTeam1stCSV') as File;
    const awayTeam2ndCSV = formData.get('awayTeam2ndCSV') as File;

    // Validate file sizes
    const files = [
      { file: homeTeam1stCSV, name: 'Home Team 1st Half' },
      { file: homeTeam2ndCSV, name: 'Home Team 2nd Half' },
      { file: awayTeam1stCSV, name: 'Away Team 1st Half' },
      { file: awayTeam2ndCSV, name: 'Away Team 2nd Half' },
    ];

    for (const { file, name } of files) {
      if (!file) {
        throw new Error(`Missing file: ${name}`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }
      if (!file.name.endsWith('.csv')) {
        throw new Error(`File ${name} must be a CSV file`);
      }
    }

    console.log('Processing match:', { homeTeamName, awayTeamName, matchDate });

    // Create or get teams
    const homeTeamSlug = createSlug(homeTeamName);
    const awayTeamSlug = createSlug(awayTeamName);

    const { data: homeTeam, error: homeTeamError } = await supabase
      .from('teams')
      .upsert({ name: homeTeamName, slug: homeTeamSlug }, { onConflict: 'slug' })
      .select()
      .single();

    if (homeTeamError) throw homeTeamError;

    const { data: awayTeam, error: awayTeamError } = await supabase
      .from('teams')
      .upsert({ name: awayTeamName, slug: awayTeamSlug }, { onConflict: 'slug' })
      .select()
      .single();

    if (awayTeamError) throw awayTeamError;

    console.log('Teams created/found:', { homeTeam: homeTeam.id, awayTeam: awayTeam.id });

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        match_date: matchDate,
        home_score: homeScore,
        away_score: awayScore,
        venue,
        competition,
      })
      .select()
      .single();

    if (matchError) throw matchError;

    console.log('Match created:', match.id);

    // Process home team stats
    const homeTeam1stText = await homeTeam1stCSV.text();
    const homeTeam2ndText = await homeTeam2ndCSV.text();
    
    console.log('Parsing home team 1st half CSV...');
    const homeStats1st = parseCSV(homeTeam1stText);
    console.log('Parsing home team 2nd half CSV...');
    const homeStats2nd = parseCSV(homeTeam2ndText);

    console.log('Parsed home team stats:', { half1: homeStats1st.length, half2: homeStats2nd.length });

    for (const stat of homeStats1st) {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .upsert(
          {
            team_id: homeTeam.id,
            jersey_number: stat.jerseyNumber,
            name: stat.playerName,
            role: stat.role,
          },
          { onConflict: 'team_id,jersey_number,name' }
        )
        .select()
        .single();

      if (playerError) throw playerError;

      await supabase.from('player_match_stats').upsert({
        player_id: player.id,
        match_id: match.id,
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

    for (const stat of homeStats2nd) {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', homeTeam.id)
        .eq('jersey_number', stat.jerseyNumber)
        .eq('name', stat.playerName)
        .single();

      if (!player) continue;

      await supabase.from('player_match_stats').upsert({
        player_id: player.id,
        match_id: match.id,
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

    // Process away team stats
    const awayTeam1stText = await awayTeam1stCSV.text();
    const awayTeam2ndText = await awayTeam2ndCSV.text();
    
    console.log('Parsing away team 1st half CSV...');
    const awayStats1st = parseCSV(awayTeam1stText);
    console.log('Parsing away team 2nd half CSV...');
    const awayStats2nd = parseCSV(awayTeam2ndText);

    console.log('Parsed away team stats:', { half1: awayStats1st.length, half2: awayStats2nd.length });

    for (const stat of awayStats1st) {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .upsert(
          {
            team_id: awayTeam.id,
            jersey_number: stat.jerseyNumber,
            name: stat.playerName,
            role: stat.role,
          },
          { onConflict: 'team_id,jersey_number,name' }
        )
        .select()
        .single();

      if (playerError) throw playerError;

      await supabase.from('player_match_stats').upsert({
        player_id: player.id,
        match_id: match.id,
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

    for (const stat of awayStats2nd) {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', awayTeam.id)
        .eq('jersey_number', stat.jerseyNumber)
        .eq('name', stat.playerName)
        .single();

      if (!player) continue;

      await supabase.from('player_match_stats').upsert({
        player_id: player.id,
        match_id: match.id,
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

    console.log('Match data import completed successfully');

    return new Response(
      JSON.stringify({ success: true, matchId: match.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error importing match data:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
