import { PlayerStats } from './parseCSV';

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
  // Import dynamically to avoid circular dependencies
  const { calculatePlayerRating } = require('./playerRating');
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

  const attackingThreat = Math.min(100, (
    player.goals * 10 +
    player.shotsOnTarget * 3 +
    player.penaltyAreaEntry * 2 +
    player.cutBacks * 2 +
    player.crosses +
    player.runInBehind * 3 +
    player.overlaps * 2
  ) / 2.5);

  const defensiveStrength = Math.min(100, (
    player.tackles * 4 +
    player.clearance * 2 +
    player.aerialDuelsWon * 3 +
    player.saves * 5 -
    player.defensiveErrors * 10
  ) / 3);

  const passingQuality = Math.min(100, (
    passAccuracy * 0.6 +
    metrics.progressivePassRate * 0.4
  ));

  const setpieceAbility = Math.min(100, (
    metrics.cornerSuccessRate * 0.4 +
    player.freeKicks * 10 +
    metrics.throwInSuccessRate * 0.3
  ));

  const workRate = Math.min(100, (
    player.passCount * 0.5 +
    player.tackles * 3 +
    (player.fwFinalThird + player.fwMiddleThird + player.fwDefensiveThird) * 2
  ) / 2);

  return {
    attackingThreat: Math.round(attackingThreat),
    defensiveStrength: Math.round(defensiveStrength),
    passingQuality: Math.round(passingQuality),
    setpieceAbility: Math.round(setpieceAbility),
    discipline: metrics.disciplineScore,
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
