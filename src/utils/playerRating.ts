import { PlayerStats } from './parseCSV';

/**
 * Player Rating System
 * 
 * Provides a unified, normalized 1-10 rating system with:
 * - Per-90 minute normalization for fair comparison between starters and substitutes
 * - Position-based weighting for role-appropriate evaluation
 * - Detailed component breakdown for transparency
 */

export interface RatingComponents {
  passing: number;
  attacking: number;
  defending: number;
  discipline: number;
}

export interface Per90Stats {
  passesP90: number;
  successfulPassesP90: number;
  tacklesP90: number;
  goalsP90: number;
  shotsOnTargetP90: number;
  clearancesP90: number;
  aerialWinsP90: number;
}

export interface PlayerRatingResult {
  overall: number;
  components: RatingComponents;
  minutesPlayed: number;
  minutesAdjustment: number;
  per90Stats: Per90Stats;
}

// Minimum minutes to calculate a meaningful rating
const MIN_MINUTES_THRESHOLD = 15;

// Position detection based on role string
function detectPositionGroup(role: string | undefined): 'GK' | 'DEF' | 'MID' | 'FWD' | 'GENERAL' {
  const r = (role || '').toUpperCase();
  
  if (r.includes('GK') || r.includes('GOALKEEPER')) return 'GK';
  if (r.includes('CB') || r.includes('LB') || r.includes('RB') || r.includes('DEFENSE') || r.includes('DEF')) return 'DEF';
  if (r.includes('CM') || r.includes('CAM') || r.includes('CDM') || r.includes('DM') || r.includes('MIDFIELD') || r.includes('MID')) return 'MID';
  if (r.includes('FW') || r.includes('LW') || r.includes('RW') || r.includes('CF') || r.includes('ST') || r.includes('FORWARD') || r.includes('WINGER')) return 'FWD';
  
  return 'GENERAL';
}

// Normalize a stat to per-90 minutes
function normalizePer90(stat: number, minutesPlayed: number): number {
  if (minutesPlayed < MIN_MINUTES_THRESHOLD) return 0;
  return (stat / minutesPlayed) * 90;
}

// Apply sigmoid-like normalization to map raw score to 1-10 scale
// Centers around 6.0 for average performance, with natural distribution
function normalizeToScale(rawScore: number, baseline: number, scaleFactor: number): number {
  const normalized = 5 + 5 * Math.tanh((rawScore - baseline) / scaleFactor);
  return Math.max(1, Math.min(10, normalized));
}

// Calculate passing component score
function calculatePassingScore(player: PlayerStats, minutes: number): number {
  const passAccuracy = player.passCount > 0 
    ? (player.successfulPass / player.passCount) * 100 
    : 0;
  
  const progressiveRate = player.passCount > 0 
    ? (player.forwardPass / player.passCount) * 100 
    : 0;
  
  const penaltyAreaPassP90 = normalizePer90(player.penaltyAreaPass, minutes);
  
  // Weighted combination
  const rawScore = (passAccuracy * 0.5) + (progressiveRate * 0.3) + (penaltyAreaPassP90 * 2);
  
  return normalizeToScale(rawScore, 50, 25);
}

// Calculate attacking component score
function calculateAttackingScore(player: PlayerStats, minutes: number, positionGroup: string): number {
  const goalsP90 = normalizePer90(player.goals, minutes);
  const shotsOnTargetP90 = normalizePer90(player.shotsOnTarget, minutes);
  const penaltyAreaEntryP90 = normalizePer90(player.penaltyAreaEntry, minutes);
  const cutBacksP90 = normalizePer90(player.cutBacks, minutes);
  const runsInBehindP90 = normalizePer90(player.runInBehind, minutes);
  
  let rawScore: number;
  
  if (positionGroup === 'FWD') {
    // Forwards expected to contribute more offensively
    rawScore = (goalsP90 * 8) + (shotsOnTargetP90 * 3) + (penaltyAreaEntryP90 * 2) + (cutBacksP90 * 1.5) + (runsInBehindP90 * 2);
  } else if (positionGroup === 'MID') {
    // Midfielders balance attacking with creation
    rawScore = (goalsP90 * 10) + (shotsOnTargetP90 * 2) + (penaltyAreaEntryP90 * 3) + (cutBacksP90 * 2);
  } else if (positionGroup === 'DEF' || positionGroup === 'GK') {
    // Defenders/GKs not expected to attack much
    rawScore = (goalsP90 * 15) + (shotsOnTargetP90 * 3) + (penaltyAreaEntryP90 * 2);
  } else {
    rawScore = (goalsP90 * 10) + (shotsOnTargetP90 * 2.5) + (penaltyAreaEntryP90 * 2) + (cutBacksP90 * 1.5);
  }
  
  // Scale baselines based on position expectations
  const baseline = positionGroup === 'FWD' ? 3 : positionGroup === 'MID' ? 2 : 0.5;
  
  return normalizeToScale(rawScore, baseline, baseline * 2 + 1);
}

// Calculate defending component score
function calculateDefendingScore(player: PlayerStats, minutes: number, positionGroup: string): number {
  const tacklesP90 = normalizePer90(player.tackles, minutes);
  const clearancesP90 = normalizePer90(player.clearance, minutes);
  const aerialWinsP90 = normalizePer90(player.aerialDuelsWon, minutes);
  const savesP90 = normalizePer90(player.saves, minutes);
  const errorsP90 = normalizePer90(player.defensiveErrors, minutes);
  
  let rawScore: number;
  
  if (positionGroup === 'GK') {
    // Goalkeepers primarily judged on saves
    rawScore = (savesP90 * 4) - (errorsP90 * 5);
  } else if (positionGroup === 'DEF') {
    // Defenders expected high defensive output
    rawScore = (tacklesP90 * 2) + (clearancesP90 * 2) + (aerialWinsP90 * 2.5) - (errorsP90 * 4);
  } else if (positionGroup === 'MID') {
    // Midfielders should contribute defensively
    rawScore = (tacklesP90 * 2.5) + (clearancesP90 * 1) + (aerialWinsP90 * 1.5) - (errorsP90 * 3);
  } else {
    // Forwards less expected to defend
    rawScore = (tacklesP90 * 3) + (clearancesP90 * 1) + (aerialWinsP90 * 1) - (errorsP90 * 2);
  }
  
  const baseline = positionGroup === 'GK' ? 2 : positionGroup === 'DEF' ? 4 : positionGroup === 'MID' ? 2 : 0.5;
  
  return normalizeToScale(rawScore, baseline, baseline * 1.5 + 1);
}

// Calculate discipline component score
function calculateDisciplineScore(player: PlayerStats, minutes: number): number {
  const foulsP90 = normalizePer90(player.fouls, minutes);
  const foulsWonP90 = normalizePer90(player.foulWon, minutes);
  
  // Lower fouls + higher fouls won = better discipline
  // Start at 8 (good baseline) and adjust
  const rawScore = 8 - (foulsP90 * 0.8) + (foulsWonP90 * 0.3);
  
  return Math.max(1, Math.min(10, rawScore));
}

// Calculate minutes adjustment factor
function getMinutesAdjustment(minutesPlayed: number, matchDuration: number = 90): number {
  if (minutesPlayed >= matchDuration * 0.8) {
    // Played most of the match - no adjustment
    return 1.0;
  } else if (minutesPlayed >= matchDuration * 0.5) {
    // Played half or more - slight adjustment
    return 0.95;
  } else if (minutesPlayed >= MIN_MINUTES_THRESHOLD) {
    // Short appearance - larger adjustment to account for small sample
    return 0.9;
  } else {
    // Very short appearance - significant uncertainty
    return 0.8;
  }
}

/**
 * Calculate comprehensive player rating
 * 
 * @param player - Player statistics object
 * @param matchDuration - Duration of match in minutes (default 90)
 * @returns PlayerRatingResult with overall rating, components, and per-90 stats
 */
export function calculatePlayerRating(player: PlayerStats, matchDuration: number = 90): PlayerRatingResult {
  const minutes = Math.max(player.minutesPlayed, MIN_MINUTES_THRESHOLD);
  const positionGroup = detectPositionGroup(player.role);
  const minutesAdjustment = getMinutesAdjustment(player.minutesPlayed, matchDuration);
  
  // Calculate component scores
  const passingScore = calculatePassingScore(player, minutes);
  const attackingScore = calculateAttackingScore(player, minutes, positionGroup);
  const defendingScore = calculateDefendingScore(player, minutes, positionGroup);
  const disciplineScore = calculateDisciplineScore(player, minutes);
  
  // Position-based weighting for overall score
  let weights: { passing: number; attacking: number; defending: number; discipline: number };
  
  switch (positionGroup) {
    case 'GK':
      weights = { passing: 0.20, attacking: 0.05, defending: 0.60, discipline: 0.15 };
      break;
    case 'DEF':
      weights = { passing: 0.25, attacking: 0.10, defending: 0.50, discipline: 0.15 };
      break;
    case 'MID':
      weights = { passing: 0.35, attacking: 0.25, defending: 0.25, discipline: 0.15 };
      break;
    case 'FWD':
      weights = { passing: 0.20, attacking: 0.55, defending: 0.10, discipline: 0.15 };
      break;
    default:
      weights = { passing: 0.30, attacking: 0.30, defending: 0.25, discipline: 0.15 };
  }
  
  // Calculate weighted overall score
  let overallRaw = 
    (passingScore * weights.passing) +
    (attackingScore * weights.attacking) +
    (defendingScore * weights.defending) +
    (disciplineScore * weights.discipline);
  
  // Apply minutes adjustment (reduces confidence for short appearances)
  // This slightly pulls ratings toward average (6.0) for players with less time
  const overall = 6.0 + (overallRaw - 6.0) * minutesAdjustment;
  
  // Calculate per-90 stats for transparency
  const per90Stats: Per90Stats = {
    passesP90: Math.round(normalizePer90(player.passCount, minutes) * 10) / 10,
    successfulPassesP90: Math.round(normalizePer90(player.successfulPass, minutes) * 10) / 10,
    tacklesP90: Math.round(normalizePer90(player.tackles, minutes) * 10) / 10,
    goalsP90: Math.round(normalizePer90(player.goals, minutes) * 100) / 100,
    shotsOnTargetP90: Math.round(normalizePer90(player.shotsOnTarget, minutes) * 10) / 10,
    clearancesP90: Math.round(normalizePer90(player.clearance, minutes) * 10) / 10,
    aerialWinsP90: Math.round(normalizePer90(player.aerialDuelsWon, minutes) * 10) / 10,
  };
  
  return {
    overall: Math.round(overall * 10) / 10,
    components: {
      passing: Math.round(passingScore * 10) / 10,
      attacking: Math.round(attackingScore * 10) / 10,
      defending: Math.round(defendingScore * 10) / 10,
      discipline: Math.round(disciplineScore * 10) / 10,
    },
    minutesPlayed: player.minutesPlayed,
    minutesAdjustment,
    per90Stats,
  };
}

/**
 * Get color class for rating display
 */
export function getRatingColor(rating: number): string {
  if (rating >= 8) return "text-green-500";
  if (rating >= 7) return "text-emerald-500";
  if (rating >= 6) return "text-yellow-500";
  if (rating >= 5) return "text-orange-500";
  return "text-red-500";
}

/**
 * Get background color class for rating badge
 */
export function getRatingBgColor(rating: number): string {
  if (rating >= 8) return "bg-green-500/10";
  if (rating >= 7) return "bg-emerald-500/10";
  if (rating >= 6) return "bg-yellow-500/10";
  if (rating >= 5) return "bg-orange-500/10";
  return "bg-red-500/10";
}
