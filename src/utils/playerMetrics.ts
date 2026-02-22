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

  // Attacking: goals, shots on target, PA entries, creative actions
  // Weighted to reward direct goal involvement most, then chance creation
  const attackingThreat = Math.min(100, (
    player.goals * 15 +
    player.shotsOnTarget * 4 +
    player.penaltyAreaEntry * 3 +
    player.penaltyAreaPass * 2 +
    player.cutBacks * 3 +
    player.crosses * 1.5 +
    player.runInBehind * 4 +
    player.overlaps * 3
  ) / 3);

  // Defensive: tackles, clearances, blocks, interceptions, aerials, saves
  // Penalize defensive errors heavily
  const defensiveStrength = Math.min(100, Math.max(0, (
    player.tackles * 5 +
    player.clearance * 3 +
    player.blocks * 4 +
    player.interceptions * 4 +
    player.aerialDuelsWon * 3 +
    player.saves * 5 -
    player.defensiveErrors * 10
  ) / 3.5));

  // Passing: weighted blend of accuracy and progressive passing, penalized by bad touches
  const badTouchPenalty = player.passCount > 0
    ? Math.min(20, (player.badTouches / player.passCount) * 200)
    : 0;
  const passingQuality = Math.min(100, Math.max(0, (
    passAccuracy * 0.55 +
    metrics.progressivePassRate * 0.35 +
    (player.penaltyAreaPass > 0 ? 10 : 0)
    - badTouchPenalty
  )));

  // Set pieces: corner & throw-in success rates, free kicks taken
  const setpieceAbility = Math.min(100, (
    metrics.cornerSuccessRate * 0.4 +
    metrics.throwInSuccessRate * 0.3 +
    player.freeKicks * 8 +
    player.corners * 2
  ));

  // Discipline: starts at 100, penalized by fouls, cards, and defensive errors
  const discipline = Math.max(0, Math.min(100,
    100 -
    player.fouls * 4 -
    player.yellowCards * 8 -
    player.redCards * 25 -
    player.defensiveErrors * 6
  ));

  // Work Rate: pass volume, tackles, forward runs, fouls won across all thirds
  // Reflects overall involvement and effort across the pitch
  const totalFoulsWon = player.fwFinalThird + player.fwMiddleThird + player.fwDefensiveThird;
  const workRate = Math.min(100, (
    player.passCount * 0.4 +
    player.tackles * 3 +
    player.runInBehind * 2 +
    player.overlaps * 2 +
    totalFoulsWon * 1.5 +
    player.interceptions * 2
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
