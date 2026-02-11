import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MatchComments } from '@/components/MatchComments';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Save, Undo2, CheckCircle, MessageSquare, ChevronDown, ArrowRight, MoveLeft, MoveRight, Link2 } from 'lucide-react';
import { toast } from 'sonner';

import { PitchDiagram } from '@/components/match-events/PitchDiagram';
import { EventTypeSelector } from '@/components/match-events/EventTypeSelector';
import { PlayerSelector } from '@/components/match-events/PlayerSelector';
import { EventModifiers } from '@/components/match-events/EventModifiers';
// PhaseControls removed - phases are now created by selecting events in EventList
import { EventList } from '@/components/match-events/EventList';
import { KeyboardShortcuts } from '@/components/match-events/KeyboardShortcuts';
import { PenaltyAreaSuggestion } from '@/components/match-events/PenaltyAreaSuggestion';
import { PhaseStrip } from '@/components/match-events/PhaseStrip';
import {
  EventType,
  ShotOutcome,
  AerialOutcome,
  CornerDeliveryType,
  PhaseOutcome,
  Position,
  LocalEvent,
  Phase,
  EVENT_CONFIG,
  BALL_MOVEMENT_EVENTS,
  BALL_POSSESSION_EVENTS,
  EVENTS_WITH_TARGET_PLAYER,
  CONTINUITY_BREAKING_EVENTS,
  BallTrailPoint,
} from '@/components/match-events/types';
import { BallPosition } from '@/components/match-events/PitchDiagram';
import { GoalMouthDiagram, ShotPlacement } from '@/components/match-events/GoalMouthDiagram';
import { useMatchEventQueries } from '../hooks';
import { useMatchEventMutations } from '../hooks';

function AdminMatchEventsContent() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasSetInProgress = useRef(false);

  // Use extracted queries hook
  const {
    matchData,
    savedPhases,
    firstHalfEvents,
    secondHalfEvents,
    dbSquad,
    matchLoading,
    phasesLoading,
    eventsLoading,
    squadLoading,
  } = useMatchEventQueries(matchId);

  // Use extracted mutations hook
  const {
    saveEventMutation,
    deleteEventMutation,
    completeMatchMutation,
    createPhaseMutation,
    updatePhaseMutation,
    deletePhaseMutation,
    updateDirectionMutation,
  } = useMatchEventMutations(matchId);

  // Combine events for internal calculations
  const savedEvents = useMemo(() => [...firstHalfEvents, ...secondHalfEvents], [firstHalfEvents, secondHalfEvents]);

  // State management
  const [selectedHalf, setSelectedHalf] = useState<1 | 2>(1);
  const [selectedTeamType, setSelectedTeamType] = useState<'home' | 'away'>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [startPosition, setStartPosition] = useState<Position | null>(null);
  const [endPosition, setEndPosition] = useState<Position | null>(null);
  const [isUnsuccessful, setIsUnsuccessful] = useState(false);
  const [shotOutcome, setShotOutcome] = useState<ShotOutcome | null>(null);
  const [aerialOutcome, setAerialOutcome] = useState<AerialOutcome | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [substitutePlayerId, setSubstitutePlayerId] = useState<string | null>(null);
  const [cornerDeliveryType, setCornerDeliveryType] = useState<CornerDeliveryType | null>(null);
  const [shotPlacement, setShotPlacement] = useState<ShotPlacement | null>(null);
  const [minute, setMinute] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [stickyPlayer, setStickyPlayer] = useState(false);

  // Chain mode and auto-advance settings
  const [chainModeEnabled, setChainModeEnabled] = useState(false);
  const autoAdvanceSeconds = 2; // Auto-advance time by 2 seconds per event

  // Direction setup state
  const [directionConfirmed, setDirectionConfirmed] = useState(false);
  const [pendingHomeAttacksLeft, setPendingHomeAttacksLeft] = useState<boolean>(true);

  // Phase state
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Events state (local display only, DB is source of truth)
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [recentPlayerIds, setRecentPlayerIds] = useState<string[]>([]);
  const [recentTargetPlayerIds, setRecentTargetPlayerIds] = useState<string[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);

  // Penalty area suggestion state - tracks both passer and receiver
  const [penaltyAreaSuggestion, setPenaltyAreaSuggestion] = useState<{
    visible: boolean;
    passerId: string;
    passerName: string;
    passerJerseyNumber: number;
    receiverId: string | null;
    receiverName: string | null;
    receiverJerseyNumber: number | null;
    position: Position;
    eventType: EventType; // To distinguish pass vs carry
  } | null>(null);

  // Transform saved events to LocalEvent format and cache to sessionStorage
  useEffect(() => {
    if (savedEvents.length > 0) {
      const localEvents: LocalEvent[] = savedEvents.map((e: any) => ({
        id: e.id,
        playerId: e.player_id,
        playerName: e.player?.name || 'Unknown',
        jerseyNumber: e.player?.jersey_number || 0,
        teamId: e.player?.team_id,
        eventType: e.event_type as EventType,
        x: Number(e.x),
        y: Number(e.y),
        endX: e.end_x ? Number(e.end_x) : undefined,
        endY: e.end_y ? Number(e.end_y) : undefined,
        successful: e.successful,
        shotOutcome: e.shot_outcome as ShotOutcome | undefined,
        aerialOutcome: e.aerial_outcome as AerialOutcome | undefined,
        targetPlayerId: e.target_player_id,
        targetPlayerName: e.target?.name,
        targetJerseyNumber: e.target?.jersey_number,
        substitutePlayerId: e.substitute_player_id,
        substitutePlayerName: e.substitute?.name,
        substituteJerseyNumber: e.substitute?.jersey_number,
        minute: e.minute,
        seconds: e.seconds ?? 0,
        half: e.half,
        phaseId: e.phase_id,
      }));
      setEvents(localEvents);

      // Cache events to sessionStorage for faster access on reload
      if (matchId) {
        sessionStorage.setItem(`match-${matchId}-events`, JSON.stringify(localEvents));
      }
    }
  }, [savedEvents, matchId]);

  // Reconstruct phases from database
  useEffect(() => {
    if (savedPhases.length > 0 && events.length > 0) {
      const reconstructedPhases: Phase[] = savedPhases.map((p: any) => ({
        id: p.id,
        phaseNumber: p.phase_number,
        half: p.half,
        outcome: p.outcome as PhaseOutcome,
        teamId: p.team_id,
        eventIds: events
          .filter((e: LocalEvent) => e.phaseId === p.id)
          .map((e: LocalEvent) => e.id),
      }));
      setPhases(reconstructedPhases);

      // Cache phases to sessionStorage
      if (matchId) {
        sessionStorage.setItem(`match-${matchId}-phases`, JSON.stringify(reconstructedPhases));
      }
    }
  }, [savedPhases, events, matchId]);

  // Initialize direction state from match data and check if already confirmed
  useEffect(() => {
    if (matchData) {
      // If match has direction set and has events, direction is confirmed
      if (matchData.home_attacks_left !== null) {
        setPendingHomeAttacksLeft(matchData.home_attacks_left);
        // If there are already events, direction was already confirmed
        if (savedEvents.length > 0) {
          setDirectionConfirmed(true);
        }
      }
    }
  }, [matchData, savedEvents.length]);

  // Set match status to "in_progress" when entering
  useEffect(() => {
    if (matchId && matchData && !hasSetInProgress.current && matchData.status !== 'in_progress') {
      hasSetInProgress.current = true;
      supabase
        .from('matches')
        .update({ status: 'in_progress' })
        .eq('id', matchId)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to update match status:', error);
          }
        });
    }
  }, [matchId, matchData]);

  // Get selected team ID
  const selectedTeamId = selectedTeamType === 'home'
    ? matchData?.home_team?.id
    : matchData?.away_team?.id;

  // Squad state
  const [homeSquad, setHomeSquad] = useState<Array<{
    id: string;
    name: string;
    jersey_number: number;
    role?: string | null;
    status: 'starting' | 'substitute';
  }>>([]);
  const [awaySquad, setAwaySquad] = useState<Array<{
    id: string;
    name: string;
    jersey_number: number;
    role?: string | null;
    status: 'starting' | 'substitute';
  }>>([]);
  const [squadSource, setSquadSource] = useState<'session' | 'database' | 'fallback' | null>(null);

  // Load squad: session storage first, then database, then fallback to all players
  useEffect(() => {
    if (matchId) {
      // Try session storage first
      const homeData = sessionStorage.getItem(`match-${matchId}-home-squad`);
      const awayData = sessionStorage.getItem(`match-${matchId}-away-squad`);

      if (homeData && awayData) {
        try {
          setHomeSquad(JSON.parse(homeData));
          setAwaySquad(JSON.parse(awayData));
          setSquadSource('session');
          return;
        } catch (e) {
          console.error('Failed to parse squad from session:', e);
        }
      }

      // Try database
      if (dbSquad && dbSquad.length > 0) {
        const homeFromDb = dbSquad
          .filter((s: any) => s.team_type === 'home' && s.player)
          .map((s: any) => ({
            id: s.player.id,
            name: s.player.name,
            jersey_number: s.player.jersey_number,
            role: s.player.role,
            status: s.status as 'starting' | 'substitute',
          }));
        const awayFromDb = dbSquad
          .filter((s: any) => s.team_type === 'away' && s.player)
          .map((s: any) => ({
            id: s.player.id,
            name: s.player.name,
            jersey_number: s.player.jersey_number,
            role: s.player.role,
            status: s.status as 'starting' | 'substitute',
          }));

        if (homeFromDb.length > 0 || awayFromDb.length > 0) {
          setHomeSquad(homeFromDb);
          setAwaySquad(awayFromDb);
          setSquadSource('database');

          // Cache to session storage for faster access
          sessionStorage.setItem(`match-${matchId}-home-squad`, JSON.stringify(homeFromDb));
          sessionStorage.setItem(`match-${matchId}-away-squad`, JSON.stringify(awayFromDb));
          return;
        }
      }

      // No squad found - will fallback to all players
      if (!squadLoading && dbSquad !== undefined) {
        setSquadSource('fallback');
      }
    }
  }, [matchId, dbSquad, squadLoading]);

  // Fetch players for selected team (fallback if no squad in session)
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players-for-events', selectedTeamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, jersey_number, role')
        .eq('team_id', selectedTeamId)
        .order('jersey_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId,
  });

  // Use squad players if available, otherwise use all players
  const players = selectedTeamType === 'home'
    ? (homeSquad.length > 0 ? homeSquad : allPlayers)
    : (awaySquad.length > 0 ? awaySquad : allPlayers);

  // Calculate substitution status from events
  const { subbedOffPlayerIds, subbedOnPlayerIds } = useMemo(() => {
    const subbedOff: string[] = [];
    const subbedOn: string[] = [];

    // Find all substitution events for the current team
    const teamPlayerIds = new Set(players.map(p => p.id));

    events.forEach(event => {
      if (event.eventType === 'substitution') {
        // The player_id is the one going OFF
        if (teamPlayerIds.has(event.playerId)) {
          subbedOff.push(event.playerId);
        }
        // The substitute_player_id is the one coming ON
        if (event.substitutePlayerId && teamPlayerIds.has(event.substitutePlayerId)) {
          subbedOn.push(event.substitutePlayerId);
        }
      }
    });

    return { subbedOffPlayerIds: subbedOff, subbedOnPlayerIds: subbedOn };
  }, [events, players]);

  // Event type config
  const requiresEndPosition = selectedEventType
    ? EVENT_CONFIG[selectedEventType].requiresEndPosition
    : false;

  // Check if event is a "without ball" event that doesn't require pitch position
  const isWithoutBallEvent = selectedEventType && ['substitution', 'yellow_card', 'red_card'].includes(selectedEventType);

  // Calculate ball position from last ball-related event
  const ballPosition = useMemo((): BallPosition | null => {
    if (events.length === 0) return null;

    // Get successful ball-related events only
    const ballEvents = events.filter(e =>
      e.successful && BALL_POSSESSION_EVENTS.includes(e.eventType)
    );

    if (ballEvents.length === 0) return null;

    const lastBallEvent = ballEvents[ballEvents.length - 1];

    // If the event has a target player and end position (like a pass), 
    // the ball is at end position with target player
    if (BALL_MOVEMENT_EVENTS.includes(lastBallEvent.eventType) &&
      lastBallEvent.endX !== undefined &&
      lastBallEvent.endY !== undefined) {

      // For events with target player, show target player's jersey
      if (EVENTS_WITH_TARGET_PLAYER.includes(lastBallEvent.eventType) && lastBallEvent.targetPlayerId) {
        const targetPlayer = players.find(p => p.id === lastBallEvent.targetPlayerId);
        if (targetPlayer) {
          return {
            x: lastBallEvent.endX,
            y: lastBallEvent.endY,
            jerseyNumber: targetPlayer.jersey_number,
            playerName: targetPlayer.name,
          };
        }
      }

      // For movement events like carry/dribble, same player has the ball at end position
      return {
        x: lastBallEvent.endX,
        y: lastBallEvent.endY,
        jerseyNumber: lastBallEvent.jerseyNumber,
        playerName: lastBallEvent.playerName,
      };
    }

    // Otherwise ball is at start position with the player who made the event
    return {
      x: lastBallEvent.x,
      y: lastBallEvent.y,
      jerseyNumber: lastBallEvent.jerseyNumber,
      playerName: lastBallEvent.playerName,
    };
  }, [events, players]);

  // Calculate ball movement trail (last 5 ball events)
  const ballTrail = useMemo((): BallTrailPoint[] => {
    if (events.length === 0) return [];

    // Get ball-related events (both successful and unsuccessful for trail)
    const ballEvents = events.filter(e =>
      BALL_POSSESSION_EVENTS.includes(e.eventType)
    );

    // Get last 5 events for trail
    const trailEvents = ballEvents.slice(-5);

    return trailEvents.map(event => {
      const targetPlayer = event.targetPlayerId
        ? players.find(p => p.id === event.targetPlayerId)
        : null;

      return {
        x: event.x,
        y: event.y,
        endX: event.endX,
        endY: event.endY,
        jerseyNumber: event.jerseyNumber,
        playerName: event.playerName,
        targetJerseyNumber: targetPlayer?.jersey_number,
        targetPlayerName: targetPlayer?.name,
        eventType: event.eventType,
        successful: event.successful,
      };
    });
  }, [events, players]);

  // Calculate suggested start position from last event's end position
  // Only suggest if the last event doesn't break continuity
  const suggestedStartPosition = useMemo((): Position | null => {
    if (events.length === 0) return null;

    const lastEvent = events[events.length - 1];

    // Don't suggest if last event was unsuccessful (turnover/interception)
    if (!lastEvent.successful) return null;

    // Don't suggest if last event breaks continuity
    if (CONTINUITY_BREAKING_EVENTS.includes(lastEvent.eventType)) return null;

    // If event has end position, suggest that as next start
    if (lastEvent.endX !== undefined && lastEvent.endY !== undefined) {
      return { x: lastEvent.endX, y: lastEvent.endY };
    }

    // For events without end position but with ball (like penalty_area_entry), 
    // suggest the event position
    if (BALL_POSSESSION_EVENTS.includes(lastEvent.eventType)) {
      return { x: lastEvent.x, y: lastEvent.y };
    }

    return null;
  }, [events]);

  // Penalty area detection helper
  // Left penalty area: x: 0-17, y: 20-80
  // Right penalty area: x: 83-100, y: 20-80
  const isInOpponentPenaltyArea = useCallback((x: number, y: number): boolean => {
    // Get home team's attack direction for this half
    const homeAttacksLeftThisHalf = selectedHalf === 1
      ? matchData?.home_attacks_left
      : !matchData?.home_attacks_left;

    // Determine which penalty area is the "opponent's" based on current team
    // If home team attacks left, their opponent's penalty is on the LEFT
    // If home team attacks right, their opponent's penalty is on the RIGHT
    const opponentPenaltyOnRight = selectedTeamType === 'home'
      ? !homeAttacksLeftThisHalf  // Home attacks right = opponent penalty on right
      : homeAttacksLeftThisHalf;   // Away attacks opposite direction

    const inYRange = y >= 20 && y <= 80;

    if (opponentPenaltyOnRight) {
      return x >= 83 && inYRange;
    } else {
      return x <= 17 && inYRange;
    }
  }, [matchData?.home_attacks_left, selectedHalf, selectedTeamType]);

  // Check if event warrants penalty area entry suggestion
  const checkPenaltyAreaEntry = useCallback((
    eventType: EventType,
    startX: number,
    startY: number,
    endX: number | undefined,
    endY: number | undefined,
    successful: boolean,
    playerId: string,
    targetPlayerIdParam: string | null
  ) => {
    // Only check for ball movement events that could enter penalty area
    const relevantEvents: EventType[] = ['carry', 'dribble', 'pass', 'key_pass', 'assist', 'run_in_behind', 'cross', 'throw_in', 'cutback', 'penalty_area_pass'];
    if (!relevantEvents.includes(eventType)) return;
    // Penalty area entries count regardless of whether the pass/cross was successful
    if (endX === undefined || endY === undefined) return;

    // Check if the ball ends up in the penalty area
    const endedInside = isInOpponentPenaltyArea(endX, endY);

    if (endedInside) {
      // Find the passer
      const passer = players.find(p => p.id === playerId);
      // Find the receiver (if a target player was selected)
      const receiver = targetPlayerIdParam ? players.find(p => p.id === targetPlayerIdParam) : null;

      // For carry/dribble, the passer is also the receiver (self-entry)
      const isSelfEntry = ['carry', 'dribble'].includes(eventType);

      if (passer) {
        setPenaltyAreaSuggestion({
          visible: true,
          passerId: passer.id,
          passerName: passer.name,
          passerJerseyNumber: passer.jersey_number,
          receiverId: isSelfEntry ? passer.id : (receiver?.id ?? null),
          receiverName: isSelfEntry ? passer.name : (receiver?.name ?? null),
          receiverJerseyNumber: isSelfEntry ? passer.jersey_number : (receiver?.jersey_number ?? null),
          position: { x: endX, y: endY },
          eventType,
        });
      }
    }
  }, [isInOpponentPenaltyArea, players]);

  // Clear current event
  const clearEvent = useCallback(() => {
    setStartPosition(null);
    setEndPosition(null);
    setIsUnsuccessful(false);
    setShotOutcome(null);
    setAerialOutcome(null);
    setCornerDeliveryType(null);
    setTargetPlayerId(null);
    setSubstitutePlayerId(null);
    setShotPlacement(null);
    if (!stickyPlayer) {
      setSelectedPlayerId(null);
    }
    setSelectedEventType(null);
  }, [stickyPlayer]);

  // Time adjustment helper - respects half minimum (2nd half starts at 45)
  const adjustTime = useCallback((delta: number) => {
    setSeconds(prev => {
      let newSeconds = prev + delta;
      let minuteChange = 0;

      while (newSeconds >= 60) {
        newSeconds -= 60;
        minuteChange++;
      }
      while (newSeconds < 0) {
        newSeconds += 60;
        minuteChange--;
      }

      if (minuteChange !== 0) {
        setMinute(m => {
          const minMinute = selectedHalf === 2 ? 45 : 0;
          return Math.max(minMinute, m + minuteChange);
        });
      }
      return Math.max(0, newSeconds);
    });
  }, [selectedHalf]);

  // Handle player selection
  const handlePlayerSelect = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
    setRecentPlayerIds((prev) => {
      const filtered = prev.filter((id) => id !== playerId);
      return [playerId, ...filtered].slice(0, 5);
    });
  }, []);

  // Save event
  const saveEvent = useCallback(async () => {
    // For substitution events, require both player going OFF and coming ON
    if (selectedEventType === 'substitution') {
      if (!selectedPlayerId) {
        toast.error('Select the player going OFF');
        return;
      }
      if (!substitutePlayerId) {
        toast.error('Select the substitute coming ON');
        return;
      }
    } else if (!selectedPlayerId || !selectedEventType) {
      toast.error('Please select a player and event type');
      return;
    }

    // Only require position for non-card/substitution events
    if (!isWithoutBallEvent && !startPosition) {
      toast.error('Please click on the pitch to mark the position');
      return;
    }

    if (requiresEndPosition && !endPosition) {
      toast.error('This event type requires an end position');
      return;
    }

    if (selectedEventType === 'shot' && !shotOutcome) {
      toast.error('Please select a shot outcome');
      return;
    }

    if (selectedEventType === 'aerial_duel' && !aerialOutcome) {
      toast.error('Please select an aerial duel outcome');
      return;
    }

    if (selectedEventType === 'corner' && !cornerDeliveryType) {
      toast.error('Please select a corner delivery type');
      return;
    }

    if (!matchId) return;

    try {
      await saveEventMutation.mutateAsync({
        match_id: matchId,
        player_id: selectedPlayerId,
        event_type: selectedEventType!,
        half: selectedHalf,
        minute,
        seconds,
        x: startPosition?.x ?? 50,
        y: startPosition?.y ?? 50,
        end_x: endPosition?.x,
        end_y: endPosition?.y,
        successful: !isUnsuccessful,
        shot_outcome: shotOutcome || undefined,
        aerial_outcome: aerialOutcome || undefined,
        corner_delivery_type: cornerDeliveryType || undefined,
        target_player_id: targetPlayerId || undefined,
        substitute_player_id: substitutePlayerId || undefined,
        phase_id: currentPhase?.id,
      });

      // Check for penalty area entry after saving
      if (startPosition && endPosition) {
        checkPenaltyAreaEntry(
          selectedEventType!,
          startPosition.x,
          startPosition.y,
          endPosition.x,
          endPosition.y,
          !isUnsuccessful,
          selectedPlayerId,
          targetPlayerId
        );
      }

      // Update recent target players if target was specified
      if (targetPlayerId) {
        setRecentTargetPlayerIds(prev => {
          const filtered = prev.filter(id => id !== targetPlayerId);
          return [targetPlayerId, ...filtered].slice(0, 5);
        });
      }

      // Auto-advance time by configured seconds
      setSeconds(prev => {
        const newSeconds = prev + autoAdvanceSeconds;
        if (newSeconds >= 60) {
          setMinute(m => m + 1);
          return newSeconds - 60;
        }
        return newSeconds;
      });

      toast.success('Event saved');
      clearEvent();
    } catch (error) {
      toast.error('Failed to save event');
      console.error(error);
    }
  }, [
    matchId,
    selectedPlayerId,
    selectedEventType,
    startPosition,
    endPosition,
    requiresEndPosition,
    isWithoutBallEvent,
    shotOutcome,
    aerialOutcome,
    isUnsuccessful,
    targetPlayerId,
    substitutePlayerId,
    minute,
    seconds,
    selectedHalf,
    currentPhase,
    clearEvent,
    saveEventMutation,
    checkPenaltyAreaEntry,
    autoAdvanceSeconds,
  ]);

  // Chain Mode: save an event from current ball position to clicked position
  const saveChainEvent = useCallback(async (endPos: Position) => {
    if (!matchId || !selectedPlayerId) {
      toast.error('Select a player first');
      return;
    }

    // Use selected event type or default to pass
    const eventType = selectedEventType || 'pass';
    const config = EVENT_CONFIG[eventType];

    // Only allow events that require end position for chain mode
    if (!config.requiresEndPosition) {
      toast.error(`${config.label} doesn't support Chain Mode (no end position)`);
      return;
    }

    // Use current ball position, suggested position, or start position
    const startPos = startPosition || suggestedStartPosition || { x: 50, y: 34 };

    try {
      await saveEventMutation.mutateAsync({
        match_id: matchId,
        player_id: selectedPlayerId,
        event_type: eventType,
        half: selectedHalf,
        minute,
        seconds,
        x: startPos.x,
        y: startPos.y,
        end_x: endPos.x,
        end_y: endPos.y,
        successful: !isUnsuccessful,
        target_player_id: targetPlayerId || undefined,
        phase_id: currentPhase?.id,
      });

      // Check for penalty area entry
      checkPenaltyAreaEntry(
        eventType,
        startPos.x,
        startPos.y,
        endPos.x,
        endPos.y,
        !isUnsuccessful,
        selectedPlayerId,
        targetPlayerId
      );

      // Update recent players
      setRecentPlayerIds(prev => {
        const filtered = prev.filter(id => id !== selectedPlayerId);
        return [selectedPlayerId, ...filtered].slice(0, 5);
      });

      // Set the end position as next start position for chaining
      setStartPosition(endPos);
      setEndPosition(null);

      // Auto-advance time
      setSeconds(prev => {
        const newSeconds = prev + autoAdvanceSeconds;
        if (newSeconds >= 60) {
          setMinute(m => m + 1);
          return newSeconds - 60;
        }
        return newSeconds;
      });

      // If target player was set, make them the new selected player
      if (targetPlayerId) {
        // Update recent target players
        setRecentTargetPlayerIds(prev => {
          const filtered = prev.filter(id => id !== targetPlayerId);
          return [targetPlayerId, ...filtered].slice(0, 5);
        });

        setSelectedPlayerId(targetPlayerId);
        setRecentPlayerIds(prev => {
          const filtered = prev.filter(id => id !== targetPlayerId);
          return [targetPlayerId, ...filtered].slice(0, 5);
        });
        setTargetPlayerId(null);
      }

      // Reset unsuccessful flag
      setIsUnsuccessful(false);

      toast.success(`Chain ${config.label.toLowerCase()} saved`);
    } catch (error) {
      toast.error(`Failed to save chain ${config.label.toLowerCase()}`);
      console.error(error);
    }
  }, [
    matchId, selectedPlayerId, selectedEventType, startPosition, suggestedStartPosition,
    selectedHalf, minute, seconds, isUnsuccessful, targetPlayerId, currentPhase,
    saveEventMutation, checkPenaltyAreaEntry, autoAdvanceSeconds
  ]);

  // Undo last event (delete from DB)
  const undoLastEvent = useCallback(async () => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    try {
      await deleteEventMutation.mutateAsync(lastEvent.id);
      toast.info('Event removed');
    } catch (error) {
      toast.error('Failed to remove event');
    }
  }, [events, deleteEventMutation]);

  // Delete event
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
      toast.info('Event deleted');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  }, [deleteEventMutation]);

  // Edit event (loads it back into the form, deletes from DB)
  const handleEditEvent = useCallback(async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    setSelectedPlayerId(event.playerId);
    setSelectedEventType(event.eventType);
    setStartPosition({ x: event.x, y: event.y });
    setEndPosition(event.endX !== undefined ? { x: event.endX, y: event.endY! } : null);
    setIsUnsuccessful(!event.successful);
    setShotOutcome(event.shotOutcome || null);
    setAerialOutcome(event.aerialOutcome || null);
    setTargetPlayerId(event.targetPlayerId || null);
    setSubstitutePlayerId(event.substitutePlayerId || null);
    setMinute(Math.floor(event.minute));
    setSeconds(event.seconds ?? 0);

    // Delete from DB (will be re-added on save)
    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      console.error('Failed to delete event for edit:', error);
    }
  }, [events, deleteEventMutation]);

  // Phase controls - now handled via event selection in EventList
  const handleCreatePhase = useCallback(async (eventIds: string[], outcome: PhaseOutcome, teamId: string) => {
    const phaseId = crypto.randomUUID();
    const phaseNumber = phases.length + 1;

    try {
      // 1. Insert into attacking_phases table
      const { error: phaseError } = await supabase
        .from('attacking_phases')
        .insert({
          id: phaseId,
          match_id: matchId,
          phase_number: phaseNumber,
          half: selectedHalf,
          outcome,
          team_id: teamId,
        });

      if (phaseError) throw phaseError;

      // 2. Update events in database with the phase_id
      const { error: eventsError } = await supabase
        .from('match_events')
        .update({ phase_id: phaseId })
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      // 3. Add to local phases state
      const newPhase: Phase = {
        id: phaseId,
        phaseNumber,
        half: selectedHalf,
        outcome,
        eventIds,
        teamId,
      };
      setPhases(prev => [...prev, newPhase]);

      // 4. Refresh queries
      queryClient.invalidateQueries({ queryKey: ['attacking-phases', matchId] });
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });

      toast.success(`Phase #${phaseNumber} created: ${outcome.replace('_', ' ')}`);
    } catch (error) {
      console.error('Failed to create phase:', error);
      toast.error('Failed to create phase');
    }
  }, [phases.length, selectedHalf, matchId, queryClient]);

  // Edit phase outcome
  const handleEditPhase = useCallback(async (phaseId: string, newOutcome: PhaseOutcome) => {
    try {
      const { error } = await supabase
        .from('attacking_phases')
        .update({ outcome: newOutcome })
        .eq('id', phaseId);

      if (error) throw error;

      // Update local state
      setPhases(prev => prev.map(p =>
        p.id === phaseId ? { ...p, outcome: newOutcome } : p
      ));

      queryClient.invalidateQueries({ queryKey: ['attacking-phases', matchId] });
      toast.success('Phase outcome updated');
    } catch (error) {
      console.error('Failed to update phase:', error);
      toast.error('Failed to update phase');
    }
  }, [matchId, queryClient]);

  // Delete phase
  const handleDeletePhase = useCallback(async (phaseId: string) => {
    try {
      // 1. Clear phase_id from all events in this phase
      const { error: eventsError } = await supabase
        .from('match_events')
        .update({ phase_id: null })
        .eq('phase_id', phaseId);

      if (eventsError) throw eventsError;

      // 2. Delete the phase record
      const { error: phaseError } = await supabase
        .from('attacking_phases')
        .delete()
        .eq('id', phaseId);

      if (phaseError) throw phaseError;

      // 3. Update local state and renumber
      setPhases(prev => {
        const filtered = prev.filter(p => p.id !== phaseId);
        return filtered.map((p, i) => ({ ...p, phaseNumber: i + 1 }));
      });

      // 4. Update phase numbers in database for remaining phases
      const remainingPhases = phases.filter(p => p.id !== phaseId);
      for (let i = 0; i < remainingPhases.length; i++) {
        await supabase
          .from('attacking_phases')
          .update({ phase_number: i + 1 })
          .eq('id', remainingPhases[i].id);
      }

      queryClient.invalidateQueries({ queryKey: ['attacking-phases', matchId] });
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });

      toast.success('Phase deleted');
    } catch (error) {
      console.error('Failed to delete phase:', error);
      toast.error('Failed to delete phase');
    }
  }, [matchId, queryClient, phases]);

  // Legacy phase controls (kept for backwards compatibility)
  const handleStartPhase = useCallback(() => {
    const newPhase: Phase = {
      id: crypto.randomUUID(),
      phaseNumber: phases.length + 1,
      half: selectedHalf,
      eventIds: [],
    };
    setCurrentPhase(newPhase);
    toast.info(`Phase #${newPhase.phaseNumber} started`);
  }, [phases.length, selectedHalf]);

  const handleEndPhase = useCallback((outcome: PhaseOutcome) => {
    if (!currentPhase) return;

    const completedPhase = { ...currentPhase, outcome };
    setPhases((prev) => [...prev, completedPhase]);
    setCurrentPhase(null);
    toast.success(`Phase #${completedPhase.phaseNumber} ended: ${outcome.replace('_', ' ')}`);
  }, [currentPhase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          setSelectedTeamType(prev => prev === 'home' ? 'away' : 'home');
          toast.info(`Switched to ${selectedTeamType === 'home' ? matchData?.away_team?.name : matchData?.home_team?.name}`);
          break;
        case 'Escape':
          clearEvent();
          break;
        case 'Enter':
          saveEvent();
          break;
        case 'z':
        case 'Z':
          if (!e.ctrlKey && !e.metaKey) {
            undoLastEvent();
          }
          break;
        case 'u':
        case 'U':
          setIsUnsuccessful((prev) => !prev);
          break;
        case 'm':
        case 'M':
          setChainModeEnabled(prev => {
            const newVal = !prev;
            toast.info(newVal ? 'Chain Mode ON - click pitch to log passes' : 'Chain Mode OFF');
            return newVal;
          });
          break;
        case '+':
        case '=':
          adjustTime(15);
          break;
        case '-':
        case '_':
          adjustTime(-15);
          break;
        // Event type shortcuts
        case 'q':
        case 'Q':
          setSelectedEventType('pass');
          break;
        case 'w':
        case 'W':
          setSelectedEventType('cross');
          break;
        case 'e':
        case 'E':
          setSelectedEventType('carry');
          break;
        case 'r':
        case 'R':
          setSelectedEventType('dribble');
          break;
        case 'd':
        case 'D':
          setSelectedEventType('tackle_won');
          break;
        case 'f':
        case 'F':
          setSelectedEventType('foul_won');
          break;
        case 'a':
        case 'A':
          setSelectedEventType('aerial_duel');
          break;
        case 'x':
        case 'X':
          setSelectedEventType('clearance');
          break;
        case 'c':
        case 'C':
          setSelectedEventType('corner');
          break;
        case 'h':
        case 'H':
          setSelectedEventType('shot');
          break;
        case 'p':
        case 'P':
          if (currentPhase) {
            toast.info('Use End Phase button to select outcome');
          } else {
            handleStartPhase();
          }
          break;
        case 'g':
        case 'G':
          if (selectedEventType === 'shot') {
            setShotOutcome('goal');
          }
          break;
        case 't':
        case 'T':
          if (selectedEventType === 'shot') {
            setShotOutcome('on_target');
          }
          break;
        case 'o':
        case 'O':
          if (selectedEventType === 'shot') {
            setShotOutcome('off_target');
          }
          break;
        case 'b':
        case 'B':
          if (selectedEventType === 'shot') {
            setShotOutcome('blocked');
          }
          break;
        case 's':
        case 'S':
          // Use suggested start position
          if (suggestedStartPosition && !startPosition) {
            setStartPosition(suggestedStartPosition);
            toast.info('Used suggested start position');
          }
          break;
        default:
          if (/^[1-9]$/.test(e.key)) {
            const index = parseInt(e.key) - 1;
            if (recentPlayerIds[index]) {
              handlePlayerSelect(recentPlayerIds[index]);
            }
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clearEvent,
    saveEvent,
    undoLastEvent,
    handleStartPhase,
    currentPhase,
    selectedEventType,
    recentPlayerIds,
    handlePlayerSelect,
    suggestedStartPosition,
    startPosition,
    selectedTeamType,
    matchData,
    adjustTime,
  ]);

  // Compute effective attack direction for current half
  // 1st half uses the stored direction, 2nd half automatically flips it
  const effectiveHomeAttacksLeft = useMemo(() => {
    if (!matchData) return pendingHomeAttacksLeft;
    const baseDirection = directionConfirmed ? matchData.home_attacks_left : pendingHomeAttacksLeft;
    if (baseDirection === null) return true;
    // Flip direction for 2nd half
    return selectedHalf === 1 ? baseDirection : !baseDirection;
  }, [matchData, directionConfirmed, pendingHomeAttacksLeft, selectedHalf]);

  // Confirm direction handler - wraps the mutation with local state update
  const confirmDirection = useCallback(async (homeAttacksLeft: boolean) => {
    try {
      await updateDirectionMutation.mutateAsync(homeAttacksLeft);
      setDirectionConfirmed(true);
    } catch (error) {
      // Error is already handled by the mutation
    }
  }, [updateDirectionMutation]);

  if (matchLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading match data...</p>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Match not found</p>
      </div>
    );
  }

  // Direction setup screen (shown before first event)
  if (!directionConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/matches')} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="bg-card border rounded-xl p-6 space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Set Attack Direction</h1>
                <p className="text-muted-foreground">
                  {matchData.home_team?.name} vs {matchData.away_team?.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure which side each team attacks in the 1st half. Direction will auto-flip for 2nd half.
                </p>
              </div>

              {/* Visual direction selector */}
              <div className="space-y-4">
                <div
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${pendingHomeAttacksLeft ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  onClick={() => setPendingHomeAttacksLeft(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MoveLeft className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{matchData.home_team?.name} attacks LEFT</p>
                        <p className="text-sm text-muted-foreground">{matchData.away_team?.name} attacks right</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${pendingHomeAttacksLeft ? 'bg-primary border-primary' : 'border-muted-foreground/50'}`}>
                      {pendingHomeAttacksLeft && <div className="w-full h-full flex items-center justify-center text-primary-foreground text-xs">✓</div>}
                    </div>
                  </div>
                </div>

                <div
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${!pendingHomeAttacksLeft ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  onClick={() => setPendingHomeAttacksLeft(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MoveRight className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{matchData.home_team?.name} attacks RIGHT</p>
                        <p className="text-sm text-muted-foreground">{matchData.away_team?.name} attacks left</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${!pendingHomeAttacksLeft ? 'bg-primary border-primary' : 'border-muted-foreground/50'}`}>
                      {!pendingHomeAttacksLeft && <div className="w-full h-full flex items-center justify-center text-primary-foreground text-xs">✓</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pitch preview */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-3 text-center">1st Half Preview</p>
                <div className="relative aspect-[3/2] bg-emerald-700/20 border border-emerald-600/30 rounded-lg flex items-center justify-between px-4">
                  <div className="text-center">
                    <div className={`text-sm font-medium ${pendingHomeAttacksLeft ? 'text-primary' : 'text-muted-foreground'}`}>
                      {pendingHomeAttacksLeft ? matchData.home_team?.name : matchData.away_team?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">← ATK</div>
                  </div>
                  <div className="w-px h-full bg-white/20" />
                  <div className="text-center">
                    <div className={`text-sm font-medium ${!pendingHomeAttacksLeft ? 'text-primary' : 'text-muted-foreground'}`}>
                      {!pendingHomeAttacksLeft ? matchData.home_team?.name : matchData.away_team?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">ATK →</div>
                  </div>
                </div>
              </div>

              {/* 2nd half auto-flip notice */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Auto-flip for 2nd half</p>
                  <p className="text-muted-foreground">Directions will automatically swap when you switch to 2nd half.</p>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => confirmDirection(pendingHomeAttacksLeft)}
                disabled={updateDirectionMutation.isPending}
              >
                {updateDirectionMutation.isPending ? 'Saving...' : 'Confirm & Start Logging'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/matches')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {matchData.home_team?.name} vs {matchData.away_team?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {matchData.home_score} - {matchData.away_score} • {matchData.competition}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotesOpen(!notesOpen)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="outline"
              onClick={() => completeMatchMutation.mutate()}
              disabled={completeMatchMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Match
            </Button>
          </div>
        </div>

        {/* Collapsible Notes Section */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleContent className="mb-4">
            <MatchComments matchId={matchId!} />
          </CollapsibleContent>
        </Collapsible>

        {/* Squad source warning */}
        {squadSource === 'fallback' && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <span className="text-sm">
                ⚠️ No squad selection found. Showing all players. For accurate tracking, select your match day squad.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/squad-selection/${matchId}`)}
            >
              Select Squad
            </Button>
          </div>
        )}

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Tabs value={String(selectedHalf)} onValueChange={(v) => {
            const newHalf = Number(v) as 1 | 2;
            setSelectedHalf(newHalf);
            // When switching to 2nd half, ensure minute is at least 45
            if (newHalf === 2 && minute < 45) {
              setMinute(45);
              setSeconds(0);
            }
          }}>
            <TabsList>
              <TabsTrigger value="1">1st Half</TabsTrigger>
              <TabsTrigger value="2">2nd Half</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedTeamType} onValueChange={(v) => setSelectedTeamType(v as 'home' | 'away')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">{matchData.home_team?.name}</SelectItem>
              <SelectItem value="away">{matchData.away_team?.name}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => adjustTime(-15)} className="px-2">
              -15s
            </Button>
            <Button variant="outline" size="sm" onClick={() => adjustTime(-5)} className="px-2">
              -5s
            </Button>
            <div className="flex items-center gap-1">
              <Label htmlFor="minute" className="text-sm">Min:</Label>
              <Input
                id="minute"
                type="number"
                min={selectedHalf === 2 ? 45 : 0}
                max={120}
                value={minute}
                onChange={(e) => {
                  const newMinute = Number(e.target.value);
                  // Enforce minimum of 45 for 2nd half
                  setMinute(selectedHalf === 2 ? Math.max(45, newMinute) : newMinute);
                }}
                className="w-16"
              />
            </div>
            <span className="text-muted-foreground">:</span>
            <div className="flex items-center gap-1">
              <Label htmlFor="seconds" className="text-sm">Sec:</Label>
              <Input
                id="seconds"
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
                className="w-16"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => adjustTime(5)} className="px-2">
              +5s
            </Button>
            <Button variant="outline" size="sm" onClick={() => adjustTime(15)} className="px-2">
              +15s
            </Button>
          </div>

          <Button
            variant={chainModeEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setChainModeEnabled(prev => {
                const newVal = !prev;
                toast.info(newVal ? 'Chain Mode ON - click pitch to log passes' : 'Chain Mode OFF');
                return newVal;
              });
            }}
            className={chainModeEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Chain {chainModeEnabled ? 'ON' : 'OFF'}
          </Button>

          <div className="ml-auto">
            <KeyboardShortcuts />
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-4 mb-4">
          {/* Left sidebar */}
          <div className="space-y-4">
            <PlayerSelector
              players={players}
              selectedPlayerId={selectedPlayerId}
              recentPlayerIds={recentPlayerIds}
              onSelect={handlePlayerSelect}
              stickyPlayer={stickyPlayer}
              onStickyChange={setStickyPlayer}
              subbedOffPlayerIds={subbedOffPlayerIds}
              subbedOnPlayerIds={subbedOnPlayerIds}
            />

            <EventModifiers
              selectedEventType={selectedEventType}
              isUnsuccessful={isUnsuccessful}
              onUnsuccessfulChange={setIsUnsuccessful}
              shotOutcome={shotOutcome}
              onShotOutcomeChange={setShotOutcome}
              aerialOutcome={aerialOutcome}
              onAerialOutcomeChange={setAerialOutcome}
              cornerDeliveryType={cornerDeliveryType}
              onCornerDeliveryChange={setCornerDeliveryType}
              targetPlayerId={targetPlayerId}
              onTargetPlayerChange={setTargetPlayerId}
              substitutePlayerId={substitutePlayerId}
              onSubstitutePlayerChange={setSubstitutePlayerId}
              players={players}
              substitutes={players.filter(p => p.id !== selectedPlayerId)}
              recentTargetPlayerIds={recentTargetPlayerIds}
              subbedOffPlayerIds={subbedOffPlayerIds}
              subbedOnPlayerIds={subbedOnPlayerIds}
            />

            {/* Action buttons */}
            <div className="space-y-2">
              <Button className="w-full" onClick={saveEvent} disabled={saveEventMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveEventMutation.isPending ? 'Saving...' : 'Save Event'}
              </Button>
              <Button variant="outline" className="w-full" onClick={undoLastEvent} disabled={events.length === 0 || deleteEventMutation.isPending}>
                <Undo2 className="h-4 w-4 mr-2" />
                Undo Last
              </Button>
            </div>
          </div>

          {/* Center - Pitch */}
          <div className="space-y-4">
            <PitchDiagram
              startPosition={startPosition}
              endPosition={endPosition}
              onStartClick={setStartPosition}
              onEndClick={setEndPosition}
              onClear={clearEvent}
              requiresEndPosition={requiresEndPosition}
              ballPosition={ballPosition}
              ballTrail={ballTrail}
              attackDirection={{
                homeAttacksLeft: effectiveHomeAttacksLeft,
                homeTeamName: matchData.home_team?.name || 'Home',
                awayTeamName: matchData.away_team?.name || 'Away',
                currentHalf: selectedHalf,
              }}
              chainModeEnabled={chainModeEnabled}
              onChainClick={saveChainEvent}
            />

            {/* Goal mouth diagram for shots */}
            {selectedEventType === 'shot' && (
              <GoalMouthDiagram
                selectedPlacement={shotPlacement}
                onSelect={setShotPlacement}
                outcome={shotOutcome || undefined}
                className="mt-4"
              />
            )}

            {/* Phase strip - horizontal scrollable */}
            <PhaseStrip
              phases={phases}
              homeTeamName={matchData.home_team?.name}
              awayTeamName={matchData.away_team?.name}
              homeTeamId={matchData.home_team?.id}
              events={events}
              onPhaseEdit={handleEditPhase}
              onPhaseDelete={handleDeletePhase}
            />

            {/* Suggested start position indicator */}
            {suggestedStartPosition && !startPosition && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-sm">
                <span className="text-muted-foreground">
                  Suggested start: ({suggestedStartPosition.x}, {suggestedStartPosition.y})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStartPosition(suggestedStartPosition)}
                >
                  Use Suggested
                </Button>
              </div>
            )}
          </div>

          {/* Right sidebar - Event Types */}
          <div>
            <EventTypeSelector
              selectedEventType={selectedEventType}
              onSelect={setSelectedEventType}
            />
          </div>
        </div>

        {/* Event list */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Logged Events ({events.length})
          </h3>
          <EventList
            firstHalfEvents={events.filter(e => e.half === 1)}
            secondHalfEvents={events.filter(e => e.half === 2)}
            phases={phases}
            players={players}
            onDelete={handleDeleteEvent}
            onEdit={handleEditEvent}
            onCreatePhase={handleCreatePhase}
            homeTeamName={matchData.home_team?.name}
            awayTeamName={matchData.away_team?.name}
            homeTeamId={matchData.home_team?.id}
          />
        </div>

        {/* Penalty area entry suggestion */}
        <PenaltyAreaSuggestion
          isVisible={penaltyAreaSuggestion?.visible ?? false}
          onAccept={async () => {
            if (penaltyAreaSuggestion && matchId) {
              const isSelfEntry = ['carry', 'dribble'].includes(penaltyAreaSuggestion.eventType);

              try {
                if (isSelfEntry) {
                  // For carry/dribble, only log penalty_area_entry for the player
                  await saveEventMutation.mutateAsync({
                    match_id: matchId,
                    player_id: penaltyAreaSuggestion.passerId,
                    event_type: 'penalty_area_entry',
                    half: selectedHalf,
                    minute,
                    seconds,
                    x: penaltyAreaSuggestion.position.x,
                    y: penaltyAreaSuggestion.position.y,
                    successful: true,
                  });
                  toast.success('Penalty Area Entry logged');
                } else {
                  // For pass/cross, log penalty_area_pass for passer
                  await saveEventMutation.mutateAsync({
                    match_id: matchId,
                    player_id: penaltyAreaSuggestion.passerId,
                    event_type: 'penalty_area_pass',
                    half: selectedHalf,
                    minute,
                    seconds,
                    x: penaltyAreaSuggestion.position.x,
                    y: penaltyAreaSuggestion.position.y,
                    successful: true,
                    target_player_id: penaltyAreaSuggestion.receiverId ?? undefined,
                  });

                  // Log penalty_area_entry for receiver (if exists)
                  if (penaltyAreaSuggestion.receiverId) {
                    await saveEventMutation.mutateAsync({
                      match_id: matchId,
                      player_id: penaltyAreaSuggestion.receiverId,
                      event_type: 'penalty_area_entry',
                      half: selectedHalf,
                      minute,
                      seconds,
                      x: penaltyAreaSuggestion.position.x,
                      y: penaltyAreaSuggestion.position.y,
                      successful: true,
                    });
                    toast.success('Penalty Area Pass + Entry logged');
                  } else {
                    toast.success('Penalty Area Pass logged (no receiver selected)');
                  }
                }

                setPenaltyAreaSuggestion(null);
              } catch (error) {
                toast.error('Failed to log penalty area events');
                console.error(error);
              }
            }
          }}
          onDismiss={() => setPenaltyAreaSuggestion(null)}
          passerName={penaltyAreaSuggestion?.passerName ?? ''}
          passerJerseyNumber={penaltyAreaSuggestion?.passerJerseyNumber ?? 0}
          receiverName={penaltyAreaSuggestion?.receiverName ?? null}
          receiverJerseyNumber={penaltyAreaSuggestion?.receiverJerseyNumber ?? null}
          isSelfEntry={penaltyAreaSuggestion ? ['carry', 'dribble'].includes(penaltyAreaSuggestion.eventType) : false}
        />
      </main>
    </div>
  );
}

export default function AdminMatchEvents() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminMatchEventsContent />
    </ProtectedRoute>
  );
}
