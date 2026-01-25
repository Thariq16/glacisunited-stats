/**
 * Expected Goals (xG) Calculation System
 * 
 * Calculates the probability of a shot resulting in a goal based on:
 * - Distance from goal center
 * - Angle to goal
 * - Shot type (penalty, header, foot)
 * 
 * Uses a coordinate system where:
 * - x: 0-100 (0 = own goal line, 100 = opponent goal line)
 * - y: 0-100 (0 = left touchline, 100 = right touchline)
 * - Goal is centered at x=100, y=50
 */

// Pitch dimensions (in meters, standard pitch)
const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;
const GOAL_WIDTH = 7.32;

// Goal center position in our coordinate system
const GOAL_X = 100;
const GOAL_Y = 50;

// Goal posts positions (y-coordinates)
const GOAL_POST_LEFT = 50 - (GOAL_WIDTH / PITCH_WIDTH) * 50;  // ~44.6
const GOAL_POST_RIGHT = 50 + (GOAL_WIDTH / PITCH_WIDTH) * 50; // ~55.4

export interface ShotEvent {
  x: number;
  y: number;
  shotOutcome?: string | null;
  isHeader?: boolean;
  isPenalty?: boolean;
}

export interface XGResult {
  xG: number;
  distance: number;
  angle: number;
  zone: 'penalty_box' | 'six_yard_box' | 'outside_box';
}

/**
 * Convert coordinate percentages to meters
 */
function toMeters(x: number, y: number): { xM: number; yM: number } {
  return {
    xM: (x / 100) * PITCH_LENGTH,
    yM: (y / 100) * PITCH_WIDTH,
  };
}

/**
 * Calculate distance from shot position to goal center (in meters)
 */
function calculateDistance(x: number, y: number): number {
  const { xM, yM } = toMeters(x, y);
  const goalXM = PITCH_LENGTH;
  const goalYM = PITCH_WIDTH / 2;
  
  return Math.sqrt(Math.pow(goalXM - xM, 2) + Math.pow(goalYM - yM, 2));
}

/**
 * Calculate angle to goal (in degrees)
 * This is the angle subtended by the goal from the shot position
 */
function calculateGoalAngle(x: number, y: number): number {
  const { xM, yM } = toMeters(x, y);
  const goalXM = PITCH_LENGTH;
  
  // Goal post positions in meters
  const postLeftYM = (PITCH_WIDTH - GOAL_WIDTH) / 2;
  const postRightYM = (PITCH_WIDTH + GOAL_WIDTH) / 2;
  
  // Vectors to each post
  const toLeftPost = Math.atan2(postLeftYM - yM, goalXM - xM);
  const toRightPost = Math.atan2(postRightYM - yM, goalXM - xM);
  
  // Angle between the two vectors (in degrees)
  const angle = Math.abs(toRightPost - toLeftPost) * (180 / Math.PI);
  
  return Math.min(180, Math.max(0, angle));
}

/**
 * Determine the zone where the shot was taken
 */
function determineZone(x: number, y: number): 'penalty_box' | 'six_yard_box' | 'outside_box' {
  // Six-yard box: x >= 94.3 (6 yards from goal line), y between ~37 and ~63
  const sixYardX = 100 - (5.5 / PITCH_LENGTH) * 100; // ~94.8
  const sixYardYMin = 50 - (9.16 / PITCH_WIDTH) * 50; // ~43.3
  const sixYardYMax = 50 + (9.16 / PITCH_WIDTH) * 50; // ~56.7
  
  // Penalty box: x >= 84.3 (18 yards from goal line), y between ~21 and ~79
  const penaltyBoxX = 100 - (16.5 / PITCH_LENGTH) * 100; // ~84.3
  const penaltyBoxYMin = 50 - (20.16 / PITCH_WIDTH) * 50; // ~35.2
  const penaltyBoxYMax = 50 + (20.16 / PITCH_WIDTH) * 50; // ~64.8
  
  if (x >= sixYardX && y >= sixYardYMin && y <= sixYardYMax) {
    return 'six_yard_box';
  }
  
  if (x >= penaltyBoxX && y >= penaltyBoxYMin && y <= penaltyBoxYMax) {
    return 'penalty_box';
  }
  
  return 'outside_box';
}

/**
 * Calculate xG for a single shot
 * 
 * Uses a logistic regression-inspired model:
 * - Base probability from distance (exponential decay)
 * - Angle multiplier (wider angle = higher chance)
 * - Zone bonuses
 * - Shot type adjustments
 */
export function calculateShotXG(shot: ShotEvent): XGResult {
  // Handle penalties separately
  if (shot.isPenalty) {
    return {
      xG: 0.76, // Historical penalty conversion rate
      distance: 11, // 12 yards
      angle: 45,
      zone: 'penalty_box',
    };
  }
  
  const distance = calculateDistance(shot.x, shot.y);
  const angle = calculateGoalAngle(shot.x, shot.y);
  const zone = determineZone(shot.x, shot.y);
  
  // Base xG from distance (exponential decay)
  // Closer shots have higher xG
  let baseXG = Math.exp(-0.1 * distance);
  
  // Angle multiplier (0-1 based on angle, max at ~45 degrees)
  const angleMultiplier = Math.min(1, angle / 45);
  
  // Zone bonuses
  let zoneMultiplier = 1;
  if (zone === 'six_yard_box') {
    zoneMultiplier = 1.8; // Very high chance from 6-yard box
  } else if (zone === 'penalty_box') {
    zoneMultiplier = 1.3; // Good chance from penalty box
  } else {
    zoneMultiplier = 0.7; // Lower chance from outside
  }
  
  // Header penalty (headers are harder to convert)
  const headerMultiplier = shot.isHeader ? 0.7 : 1;
  
  // Calculate final xG
  let xG = baseXG * angleMultiplier * zoneMultiplier * headerMultiplier;
  
  // Clamp between 0.01 and 0.95
  xG = Math.max(0.01, Math.min(0.95, xG));
  
  return {
    xG: Math.round(xG * 100) / 100,
    distance: Math.round(distance * 10) / 10,
    angle: Math.round(angle * 10) / 10,
    zone,
  };
}

/**
 * Calculate total xG for multiple shots
 */
export function calculateTotalXG(shots: ShotEvent[]): number {
  return shots.reduce((total, shot) => total + calculateShotXG(shot).xG, 0);
}

/**
 * Calculate xG overperformance (goals - xG)
 * Positive = scoring more than expected
 * Negative = scoring less than expected
 */
export function calculateXGOverperformance(shots: ShotEvent[], actualGoals: number): number {
  const totalXG = calculateTotalXG(shots);
  return Math.round((actualGoals - totalXG) * 100) / 100;
}

/**
 * Get xG quality rating (how good are the chances being created)
 * Returns average xG per shot
 */
export function calculateXGQuality(shots: ShotEvent[]): number {
  if (shots.length === 0) return 0;
  return Math.round((calculateTotalXG(shots) / shots.length) * 100) / 100;
}

export interface PlayerXGStats {
  totalXG: number;
  actualGoals: number;
  overperformance: number;
  shotCount: number;
  xGPerShot: number;
  shots: Array<ShotEvent & { xG: number }>;
}

/**
 * Calculate comprehensive xG stats for a player's shots
 */
export function calculatePlayerXGStats(shots: ShotEvent[], actualGoals: number): PlayerXGStats {
  const shotsWithXG = shots.map(shot => ({
    ...shot,
    xG: calculateShotXG(shot).xG,
  }));
  
  const totalXG = shotsWithXG.reduce((sum, s) => sum + s.xG, 0);
  
  return {
    totalXG: Math.round(totalXG * 100) / 100,
    actualGoals,
    overperformance: Math.round((actualGoals - totalXG) * 100) / 100,
    shotCount: shots.length,
    xGPerShot: shots.length > 0 ? Math.round((totalXG / shots.length) * 100) / 100 : 0,
    shots: shotsWithXG,
  };
}
