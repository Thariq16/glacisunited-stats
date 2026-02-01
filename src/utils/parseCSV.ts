export interface PlayerStats {
  jerseyNumber: string;
  playerName: string;
  role: string;
  passCount: number;
  successfulPass: number;
  successPassPercent: string;
  missPass: number;
  missPassPercent: string;
  forwardPass: number;
  forwardPassPercent: string;
  backwardPass: number;
  backwardPassPercent: string;
  goals: number;
  penaltyAreaPass: number;
  penaltyAreaEntry: number;
  runInBehind: number;
  overlaps: number;
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
  minutesPlayed: number;
  substituteAppearances: number;
}

export function parseCSV(csvText: string): PlayerStats[] {
  const lines = csvText.trim().split('\n');
  const players: PlayerStats[] = [];

  // Skip header and process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',');
    
    // Skip the total row (empty jersey number)
    if (!values[0] || !values[0].trim()) continue;

    const parseNumber = (val: string): number => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    // New CSV format with Run in Behind (col 13), Overlaps (col 14), Minutes Played (col 41)
    players.push({
      jerseyNumber: values[0]?.trim() || '',
      playerName: values[1]?.trim() || '',
      role: values[2]?.trim() || '',
      passCount: parseNumber(values[3]),
      successfulPass: parseNumber(values[4]),
      successPassPercent: values[5]?.trim() || '0%',
      missPass: parseNumber(values[6]),
      missPassPercent: values[7]?.trim() || '0%',
      forwardPass: parseNumber(values[8]),
      forwardPassPercent: values[9]?.trim() || '0%',
      backwardPass: parseNumber(values[10]),
      backwardPassPercent: values[11]?.trim() || '0%',
      goals: parseNumber(values[12]),
      penaltyAreaPass: parseNumber(values[13]),
      penaltyAreaEntry: parseNumber(values[14]),
      runInBehind: parseNumber(values[15]),
      overlaps: parseNumber(values[16]),
      shotsAttempted: parseNumber(values[17]),
      shotsOnTarget: parseNumber(values[18]),
      saves: parseNumber(values[19]),
      defensiveErrors: parseNumber(values[20]),
      aerialDuelsWon: parseNumber(values[21]),
      aerialDuelsLost: parseNumber(values[22]),
      tackles: parseNumber(values[23]),
      clearance: parseNumber(values[24]),
      fouls: parseNumber(values[25]),
      foulsInFinalThird: parseNumber(values[26]),
      foulsInMiddleThird: parseNumber(values[27]),
      foulsInDefensiveThird: parseNumber(values[28]),
      foulWon: parseNumber(values[29]),
      fwFinalThird: parseNumber(values[30]),
      fwMiddleThird: parseNumber(values[31]),
      fwDefensiveThird: parseNumber(values[32]),
      cutBacks: parseNumber(values[33]),
      crosses: parseNumber(values[34]),
      freeKicks: parseNumber(values[35]),
      corners: parseNumber(values[36]),
      cornerFailed: parseNumber(values[37]),
      cornerSuccess: parseNumber(values[38]),
      throwIns: parseNumber(values[39]),
      tiFailed: parseNumber(values[40]),
      tiSuccess: parseNumber(values[41]),
      offside: parseNumber(values[42]),
      minutesPlayed: parseNumber(values[43]),
      substituteAppearances: 0, // Not in CSV, calculated from events
    });
  }

  return players;
}

export function combineHalves(firstHalf: PlayerStats[], secondHalf: PlayerStats[]): PlayerStats[] {
  const combined: Map<string, PlayerStats> = new Map();

  // Add first half data
  firstHalf.forEach(player => {
    combined.set(player.playerName, { ...player });
  });

  // Combine with second half data
  secondHalf.forEach(player => {
    const existing = combined.get(player.playerName);
    if (existing) {
      // Sum up all numeric stats
      Object.keys(player).forEach(key => {
        if (typeof player[key as keyof PlayerStats] === 'number') {
          (existing[key as keyof PlayerStats] as number) += player[key as keyof PlayerStats] as number;
        }
      });
      
      // Recalculate percentages
      existing.successPassPercent = existing.passCount > 0 
        ? `${((existing.successfulPass / existing.passCount) * 100).toFixed(2)}%` 
        : '0%';
      existing.missPassPercent = existing.passCount > 0 
        ? `${((existing.missPass / existing.passCount) * 100).toFixed(2)}%` 
        : '0%';
      existing.forwardPassPercent = existing.passCount > 0 
        ? `${((existing.forwardPass / existing.passCount) * 100).toFixed(2)}%` 
        : '0%';
      existing.backwardPassPercent = existing.passCount > 0 
        ? `${((existing.backwardPass / existing.passCount) * 100).toFixed(2)}%` 
        : '0%';
    } else {
      combined.set(player.playerName, { ...player });
    }
  });

  return Array.from(combined.values());
}
