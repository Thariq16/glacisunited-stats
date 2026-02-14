export type EventType =
  | 'pass'
  | 'key_pass'
  | 'assist'
  | 'shot'
  | 'tackle_won'
  | 'tackle_not_won'
  | 'foul_committed'
  | 'foul_won'
  | 'carry'
  | 'dribble'
  | 'clearance'
  | 'aerial_duel'
  | 'save'
  | 'cross'
  | 'cutback'
  | 'corner'
  | 'throw_in'
  | 'free_kick'
  | 'run_in_behind'
  | 'overlap'
  | 'penalty_area_entry'
  | 'penalty_area_pass'
  | 'defensive_error'
  | 'substitution'
  | 'yellow_card'
  | 'red_card'
  | 'penalty'
  | 'offside'
  | 'goal_kick'
  | 'kick_off'
  | 'goal_restart'
  | 'block'
  | 'bad_touch';

export type ShotOutcome = 'goal' | 'on_target' | 'off_target' | 'blocked';
export type AerialOutcome = 'won' | 'lost';
export type CornerDeliveryType = 'inswing' | 'outswing' | 'short';
export type PhaseOutcome = 'goal' | 'shot' | 'lost_possession';

export interface Position {
  x: number;
  y: number;
}

export interface LocalEvent {
  id: string;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  teamId?: string;
  eventType: EventType;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  successful: boolean;
  shotOutcome?: ShotOutcome;
  aerialOutcome?: AerialOutcome;
  cornerDeliveryType?: CornerDeliveryType;
  targetPlayerId?: string;
  targetPlayerName?: string;
  targetJerseyNumber?: number;
  substitutePlayerId?: string;
  substitutePlayerName?: string;
  substituteJerseyNumber?: number;
  minute: number;
  seconds?: number;
  half: number;
  phaseId?: string;
}

export interface Phase {
  id: string;
  phaseNumber: number;
  half: number;
  outcome?: PhaseOutcome;
  eventIds: string[];
  teamId?: string;
}

export interface EventLoggerState {
  selectedHalf: 1 | 2;
  selectedTeamType: 'home' | 'away';
  selectedPlayerId: string | null;
  selectedEventType: EventType | null;
  startPosition: Position | null;
  endPosition: Position | null;
  isUnsuccessful: boolean;
  shotOutcome: ShotOutcome | null;
  aerialOutcome: AerialOutcome | null;
  cornerDeliveryType: CornerDeliveryType | null;
  targetPlayerId: string | null;
  minute: number;
  currentPhase: Phase | null;
  phases: Phase[];
  events: LocalEvent[];
  recentPlayerIds: string[];
}

export const EVENT_CONFIG: Record<EventType, {
  label: string;
  requiresEndPosition: boolean;
  requiresTargetPlayer?: boolean;
  requiresSubstitutePlayer?: boolean;
  category: 'passing' | 'shooting' | 'defensive' | 'set_piece' | 'movement' | 'without_ball';
}> = {
  pass: { label: 'Pass', requiresEndPosition: true, requiresTargetPlayer: true, category: 'passing' },
  key_pass: { label: 'Key Pass', requiresEndPosition: true, requiresTargetPlayer: true, category: 'passing' },
  assist: { label: 'Assist', requiresEndPosition: true, requiresTargetPlayer: true, category: 'passing' },
  shot: { label: 'Shot', requiresEndPosition: true, category: 'shooting' },
  tackle_won: { label: 'Tackle Won', requiresEndPosition: false, category: 'defensive' },
  tackle_not_won: { label: 'Tackle Not Won', requiresEndPosition: false, category: 'defensive' },
  foul_committed: { label: 'Foul Committed', requiresEndPosition: false, category: 'defensive' },
  foul_won: { label: 'Foul Won', requiresEndPosition: false, category: 'defensive' },
  carry: { label: 'Carry', requiresEndPosition: true, category: 'movement' },
  dribble: { label: 'Dribble', requiresEndPosition: true, category: 'movement' },
  clearance: { label: 'Clearance', requiresEndPosition: true, category: 'defensive' },
  aerial_duel: { label: 'Aerial Duel', requiresEndPosition: false, category: 'defensive' },
  save: { label: 'Save', requiresEndPosition: false, category: 'defensive' },
  cross: { label: 'Cross', requiresEndPosition: true, requiresTargetPlayer: true, category: 'passing' },
  cutback: { label: 'Cutback', requiresEndPosition: true, requiresTargetPlayer: true, category: 'passing' },
  corner: { label: 'Corner', requiresEndPosition: true, requiresTargetPlayer: true, category: 'set_piece' },
  throw_in: { label: 'Throw In', requiresEndPosition: true, requiresTargetPlayer: true, category: 'set_piece' },
  free_kick: { label: 'Free Kick', requiresEndPosition: true, requiresTargetPlayer: true, category: 'set_piece' },
  run_in_behind: { label: 'Run in Behind', requiresEndPosition: true, category: 'movement' },
  overlap: { label: 'Overlap', requiresEndPosition: true, category: 'movement' },
  penalty_area_entry: { label: 'Penalty Area Entry', requiresEndPosition: false, category: 'movement' },
  penalty_area_pass: { label: 'Penalty Area Pass', requiresEndPosition: true, category: 'passing' },
  defensive_error: { label: 'Defensive Error', requiresEndPosition: false, category: 'defensive' },
  substitution: { label: 'Substitution', requiresEndPosition: false, requiresSubstitutePlayer: true, category: 'without_ball' },
  yellow_card: { label: 'Yellow Card', requiresEndPosition: false, category: 'without_ball' },
  red_card: { label: 'Red Card', requiresEndPosition: false, category: 'without_ball' },
  penalty: { label: 'Penalty', requiresEndPosition: true, category: 'set_piece' },
  offside: { label: 'Offside', requiresEndPosition: false, category: 'movement' },
  goal_kick: { label: 'Goal Kick', requiresEndPosition: true, requiresTargetPlayer: true, category: 'set_piece' },
  kick_off: { label: 'Kick Off', requiresEndPosition: true, requiresTargetPlayer: true, category: 'set_piece' },
  goal_restart: { label: 'Goal Restart', requiresEndPosition: true, requiresTargetPlayer: true, category: 'set_piece' },
  block: { label: 'Block', requiresEndPosition: false, category: 'defensive' },
  bad_touch: { label: 'Bad Touch', requiresEndPosition: true, category: 'without_ball' },
};

export const EVENTS_WITH_UNSUCCESSFUL: EventType[] = [
  'pass', 'key_pass', 'assist', 'carry', 'dribble', 'cross', 'cutback', 'corner', 'throw_in', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart', 'penalty_area_pass'
];

export const EVENTS_WITH_TARGET_PLAYER: EventType[] = [
  'pass', 'key_pass', 'assist', 'throw_in', 'cross', 'cutback', 'corner', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart', 'penalty_area_pass'
];

// Events where the ball moves to the end position (for ball tracking)
export const BALL_MOVEMENT_EVENTS: EventType[] = [
  'pass', 'key_pass', 'assist', 'carry', 'dribble', 'cross', 'cutback', 'throw_in', 'corner', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart', 'penalty_area_pass', 'run_in_behind', 'overlap', 'clearance'
];

// Events where the player has the ball at start position
export const BALL_POSSESSION_EVENTS: EventType[] = [
  'pass', 'key_pass', 'assist', 'shot', 'carry', 'dribble', 'clearance', 'cross', 'cutback', 'corner', 'throw_in', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart', 'penalty_area_entry', 'penalty_area_pass'
];

// Events that break ball continuity (next event should NOT auto-inherit position)
// These situations mean the ball position is reset or unpredictable
export const CONTINUITY_BREAKING_EVENTS: EventType[] = [
  'shot',           // Ball goes to goal/keeper/out
  'clearance',      // Ball cleared away, could go anywhere
  'aerial_duel',    // Ball could drop anywhere
  'tackle_won',     // Regained possession, position may differ
  'tackle_not_won', // Lost possession
  'foul_committed', // Play stops, free kick at different position
  'foul_won',       // Play stops, free kick position
  'defensive_error', // Turnover
  'save',           // Keeper action
  'offside',        // Loses possession, free kick to opponent
  'penalty',        // Shot goes to goal
  'block',          // Ball deflected, unpredictable position
];

// Ball trail type for movement history
export interface BallTrailPoint {
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  jerseyNumber: number;
  playerName: string;
  targetJerseyNumber?: number;
  targetPlayerName?: string;
  eventType: EventType;
  successful: boolean;
}

// Event category groupings for UI tabs
export type EventCategory = 'passing' | 'movement' | 'shooting' | 'defensive' | 'set_piece' | 'without_ball';

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; events: EventType[] }> = {
  passing: {
    label: 'Passing',
    events: ['pass', 'key_pass', 'assist', 'cross', 'cutback', 'penalty_area_pass'],
  },
  movement: {
    label: 'Movement',
    events: ['carry', 'dribble', 'run_in_behind', 'overlap', 'penalty_area_entry', 'offside'],
  },
  shooting: {
    label: 'Shooting',
    events: ['shot'],
  },
  defensive: {
    label: 'Defensive',
    events: ['tackle_won', 'tackle_not_won', 'block', 'clearance', 'aerial_duel', 'save', 'foul_committed', 'foul_won', 'defensive_error'],
  },
  set_piece: {
    label: 'Set Piece',
    events: ['corner', 'throw_in', 'free_kick', 'penalty', 'goal_kick', 'kick_off', 'goal_restart'],
  },
  without_ball: {
    label: 'Other',
    events: ['substitution', 'yellow_card', 'red_card', 'bad_touch'],
  },
};
