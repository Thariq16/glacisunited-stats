export type EventType =
  | 'pass'
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
  | 'corner'
  | 'throw_in'
  | 'free_kick'
  | 'run_in_behind'
  | 'overlap'
  | 'penalty_area_entry'
  | 'penalty_area_pass'
  | 'defensive_error';

export type ShotOutcome = 'goal' | 'on_target' | 'off_target' | 'blocked';
export type AerialOutcome = 'won' | 'lost';
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
  eventType: EventType;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  successful: boolean;
  shotOutcome?: ShotOutcome;
  aerialOutcome?: AerialOutcome;
  targetPlayerId?: string;
  minute: number;
  half: number;
  phaseId?: string;
}

export interface Phase {
  id: string;
  phaseNumber: number;
  half: number;
  outcome?: PhaseOutcome;
  eventIds: string[];
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
  category: 'passing' | 'shooting' | 'defensive' | 'set_piece' | 'movement';
}> = {
  pass: { label: 'Pass', requiresEndPosition: true, category: 'passing' },
  shot: { label: 'Shot', requiresEndPosition: false, category: 'shooting' },
  tackle_won: { label: 'Tackle Won', requiresEndPosition: false, category: 'defensive' },
  tackle_not_won: { label: 'Tackle Not Won', requiresEndPosition: false, category: 'defensive' },
  foul_committed: { label: 'Foul Committed', requiresEndPosition: false, category: 'defensive' },
  foul_won: { label: 'Foul Won', requiresEndPosition: false, category: 'defensive' },
  carry: { label: 'Carry', requiresEndPosition: true, category: 'movement' },
  dribble: { label: 'Dribble', requiresEndPosition: true, category: 'movement' },
  clearance: { label: 'Clearance', requiresEndPosition: false, category: 'defensive' },
  aerial_duel: { label: 'Aerial Duel', requiresEndPosition: false, category: 'defensive' },
  save: { label: 'Save', requiresEndPosition: false, category: 'defensive' },
  cross: { label: 'Cross', requiresEndPosition: true, category: 'passing' },
  corner: { label: 'Corner', requiresEndPosition: false, category: 'set_piece' },
  throw_in: { label: 'Throw In', requiresEndPosition: false, category: 'set_piece' },
  free_kick: { label: 'Free Kick', requiresEndPosition: false, category: 'set_piece' },
  run_in_behind: { label: 'Run in Behind', requiresEndPosition: true, category: 'movement' },
  overlap: { label: 'Overlap', requiresEndPosition: true, category: 'movement' },
  penalty_area_entry: { label: 'Penalty Area Entry', requiresEndPosition: false, category: 'movement' },
  penalty_area_pass: { label: 'Penalty Area Pass', requiresEndPosition: true, category: 'passing' },
  defensive_error: { label: 'Defensive Error', requiresEndPosition: false, category: 'defensive' },
};

export const EVENTS_WITH_UNSUCCESSFUL: EventType[] = [
  'pass', 'carry', 'dribble', 'cross', 'corner', 'throw_in', 'penalty_area_pass'
];
