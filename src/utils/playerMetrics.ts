import { PlayerStats } from './parseCSV';
import { calculatePlayerRating } from './playerRating';

export interface AdvancedMetrics {
  shotConversionRate: number;
  shotAccuracy: number;
  aerialDuelSuccessRate: number;
  cornerSuccessRate: number;
  throwInSuccessRate: number;
  progressivePassRate: number;
  attackingContribution: number;
  defensiveContribution: number;
  disciplineScore: number;
  foulRate: number;
  foulsCommittedVsWonRatio: number;
  performanceRating: number;
}

export function calculateAdvancedMetrics(player: PlayerStats): AdvancedMetrics {
  const shotConversionRate = player.shotsAttempted > 0 
    ? (player.goals / player.shotsAttempted) * 100 
    : 0;

  const shotAccuracy = player.shotsAttempted > 0
    ? (player.shotsOnTarget / player.shotsAttempted) * 100
    : 0;

  const totalAerialDuels = player.aerialDuelsWon + player.aerialDuelsLost;
  const aerialDuelSuccessRate = totalAerialDuels > 0
    ? (player.aerialDuelsWon / totalAerialDuels) * 100
    : 0;

  const cornerSuccessRate = player.corners > 0
    ? (player.cornerSuccess / player.corners) * 100
    : 0;

  const throwInSuccessRate = player.throwIns > 0
    ? (player.tiSuccess / player.throwIns) * 100
    : 0;

  const progressivePassRate = player.passCount > 0
    ? (player.forwardPass / player.passCount) * 100
    : 0;

  const attackingContribution = 
    player.penaltyAreaPass + 
    player.penaltyAreaEntry + 
    player.cutBacks + 
    player.crosses +
    player.runInBehind * 2 +
    player.overlaps * 2 +
    player.goals * 3 +
    player.shotsOnTarget * 2;

  const defensiveContribution = 
    player.tackles * 2 + 
    player.clearance + 
    player.aerialDuelsWon +
    player.saves * 3;

  const totalFouls = player.fouls > 0 ? player.fouls : 1;
  const disciplineScore = Math.max(0, 100 - (player.fouls * 5 + player.defensiveErrors * 10));

  const foulRate = player.fouls;

  const foulsCommittedVsWonRatio = player.fouls > 0
    ? player.foulWon / player.fouls
    : player.foulWon;

  // Use the unified player rating system for performance rating
  const ratingResult = calculatePlayerRating(player);
  const performanceRating = ratingResult.overall;

  return {
    shotConversionRate: Math.round(shotConversionRate * 10) / 10,
    shotAccuracy: Math.round(shotAccuracy * 10) / 10,
    aerialDuelSuccessRate: Math.round(aerialDuelSuccessRate * 10) / 10,
    cornerSuccessRate: Math.round(cornerSuccessRate * 10) / 10,
    throwInSuccessRate: Math.round(throwInSuccessRate * 10) / 10,
    progressivePassRate: Math.round(progressivePassRate * 10) / 10,
    attackingContribution,
    defensiveContribution,
    disciplineScore: Math.round(disciplineScore),
    foulRate,
    foulsCommittedVsWonRatio: Math.round(foulsCommittedVsWonRatio * 10) / 10,
    performanceRating: Math.round(performanceRating * 10) / 10,
  };
}

// Legacy function removed - now using unified playerRating.ts

export interface TacticalProfile {
  attackingThreat: number;
  defensiveStrength: number;
  passingQuality: number;
  setpieceAbility: number;
  discipline: number;
  workRate: number;
}

export function calculateTacticalProfile(player: PlayerStats, metrics: AdvancedMetrics): TacticalProfile {
  const passAccuracy = player.passCount > 0 
    ? (player.successfulPass / player.passCount) * 100 
    : 0;

  // === ATTACKING THREAT ===
  // Weighted heavily toward final-third activity & direct goal involvement
  // Final-third passes, shots, PA entries, creative actions all contribute
  const finalThirdPassRatio = player.passCount > 0 ? player.passesFinalThird / player.passCount : 0;
  const attackingThreat = Math.min(100, (
    player.goals * 15 +
    player.shotsOnTarget * 4 +
    player.shotsFinalThird * 1.5 +
    player.penaltyAreaEntry * 3 +
    player.penaltyAreaPass * 2 +
    player.cutBacks * 3 +
    player.crosses * 1.5 +
    player.runInBehind * 4 +
    player.overlaps * 3 +
    finalThirdPassRatio * 20 + // bonus for final-third passing proportion
    player.tacklesFinalThird * 2 // pressing high = attacking intent
  ) / 3);

  // === DEFENSIVE STRENGTH ===
  // Defensive-third actions weighted most, middle-third less, final-third least
  // Blocks, interceptions, clearances in own third matter most
  const defensiveStrength = Math.min(100, Math.max(0, (
    player.tacklesDefensiveThird * 6 +
    player.tacklesMiddleThird * 4 +
    player.tacklesFinalThird * 2 +
    player.clearancesDefensiveThird * 5 +
    player.clearancesMiddleThird * 3 +
    player.clearancesFinalThird * 1 +
    player.blocksDefensiveThird * 5 +
    player.blocksMiddleThird * 3 +
    player.blocksFinalThird * 1 +
    player.interceptionsDefensiveThird * 5 +
    player.interceptionsMiddleThird * 3 +
    player.interceptionsFinalThird * 1 +
    player.aerialsDefensiveThird * 3 +
    player.aerialsMiddleThird * 2 +
    player.saves * 5 -
    player.defensiveErrors * 10
  ) / 3.5));

  // === PASSING QUALITY ===
  // Pass accuracy + progressive passing + final-third involvement
  // Penalized by bad touches (especially in own third where it's more costly)
  const badTouchPenalty = player.passCount > 0
    ? Math.min(20, (
        (player.badTouchesDefensiveThird * 3 + player.badTouchesMiddleThird * 2 + player.badTouchesFinalThird * 1) 
        / player.passCount
      ) * 150)
    : 0;
  const passingQuality = Math.min(100, Math.max(0, (
    passAccuracy * 0.50 +
    metrics.progressivePassRate * 0.30 +
    (player.passesFinalThird > 0 ? Math.min(15, player.passesFinalThird * 0.3) : 0) +
    (player.penaltyAreaPass > 0 ? 10 : 0)
    - badTouchPenalty
  )));

  // === SET PIECE ABILITY ===
  // Corner & throw-in success rates, free kicks taken
  const setpieceAbility = Math.min(100, (
    metrics.cornerSuccessRate * 0.4 +
    metrics.throwInSuccessRate * 0.3 +
    player.freeKicks * 8 +
    player.corners * 2
  ));

  // === DISCIPLINE ===
  // Fouls in defensive third are more damaging (closer to own goal)
  const discipline = Math.max(0, Math.min(100,
    100 -
    player.foulsInDefensiveThird * 6 -
    player.foulsInMiddleThird * 4 -
    player.foulsInFinalThird * 2 -
    player.yellowCards * 8 -
    player.redCards * 25 -
    player.defensiveErrors * 6
  ));

  // === WORK RATE ===
  // Reflects total involvement across the pitch — actions in all zones
  // Middle-third activity weighted highest (transition zone = effort indicator)
  const totalFoulsWon = player.fwFinalThird + player.fwMiddleThird + player.fwDefensiveThird;
  const workRate = Math.min(100, (
    player.passCount * 0.3 +
    player.tacklesMiddleThird * 4 + // pressing in transition
    player.tacklesDefensiveThird * 2 +
    player.tacklesFinalThird * 3 +
    player.interceptionsMiddleThird * 3 +
    player.interceptionsDefensiveThird * 2 +
    player.interceptionsFinalThird * 2 +
    player.runInBehind * 2 +
    player.overlaps * 2 +
    totalFoulsWon * 1.5
  ) / 2);

  return {
    attackingThreat: Math.round(attackingThreat),
    defensiveStrength: Math.round(defensiveStrength),
    passingQuality: Math.round(passingQuality),
    setpieceAbility: Math.round(setpieceAbility),
    discipline: Math.round(discipline),
    workRate: Math.round(workRate),
  };
}

export interface PositionAnalysis {
  primary: string;
  foulDistribution: {
    finalThird: number;
    middleThird: number;
    defensiveThird: number;
  };
  foulsWonDistribution: {
    finalThird: number;
    middleThird: number;
    defensiveThird: number;
  };
}

export function analyzePositioning(player: PlayerStats): PositionAnalysis {
  const totalFouls = player.foulsInFinalThird + player.foulsInMiddleThird + player.foulsInDefensiveThird || 1;
  const totalFoulsWon = player.fwFinalThird + player.fwMiddleThird + player.fwDefensiveThird || 1;

  let primary = 'Balanced';
  if (player.fwFinalThird + player.foulsInFinalThird > player.fwMiddleThird + player.fwDefensiveThird) {
    primary = 'Attacking';
  } else if (player.fwDefensiveThird + player.foulsInDefensiveThird > player.fwMiddleThird + player.fwFinalThird) {
    primary = 'Defensive';
  } else {
    primary = 'Midfield';
  }

  return {
    primary,
    foulDistribution: {
      finalThird: Math.round((player.foulsInFinalThird / totalFouls) * 100),
      middleThird: Math.round((player.foulsInMiddleThird / totalFouls) * 100),
      defensiveThird: Math.round((player.foulsInDefensiveThird / totalFouls) * 100),
    },
    foulsWonDistribution: {
      finalThird: Math.round((player.fwFinalThird / totalFoulsWon) * 100),
      middleThird: Math.round((player.fwMiddleThird / totalFoulsWon) * 100),
      defensiveThird: Math.round((player.fwDefensiveThird / totalFoulsWon) * 100),
    },
  };
}
