import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MatchComments } from '@/components/MatchComments';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Save, Undo2, CheckCircle, MessageSquare, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { PitchDiagram } from '@/components/match-events/PitchDiagram';
import { EventTypeSelector } from '@/components/match-events/EventTypeSelector';
import { PlayerSelector } from '@/components/match-events/PlayerSelector';
import { EventModifiers } from '@/components/match-events/EventModifiers';
import { PhaseControls } from '@/components/match-events/PhaseControls';
import { EventList } from '@/components/match-events/EventList';
import { KeyboardShortcuts } from '@/components/match-events/KeyboardShortcuts';
import {
  EventType,
  ShotOutcome,
  AerialOutcome,
  PhaseOutcome,
  Position,
  LocalEvent,
  Phase,
  EVENT_CONFIG,
} from '@/components/match-events/types';

function AdminMatchEventsContent() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasSetInProgress = useRef(false);

  // Match and teams data
  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['match-for-events', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
        .eq('id', matchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  // Load existing events from database
  const { data: savedEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          *,
          player:players!match_events_player_id_fkey(id, name, jersey_number),
          substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

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
  const [minute, setMinute] = useState(1);
  const [stickyPlayer, setStickyPlayer] = useState(false);

  // Phase state
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Events state (local display only, DB is source of truth)
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [recentPlayerIds, setRecentPlayerIds] = useState<string[]>([]);

  // Transform saved events to LocalEvent format
  useEffect(() => {
    if (savedEvents.length > 0) {
      const localEvents: LocalEvent[] = savedEvents.map((e: any) => ({
        id: e.id,
        playerId: e.player_id,
        playerName: e.player?.name || 'Unknown',
        jerseyNumber: e.player?.jersey_number || 0,
        eventType: e.event_type as EventType,
        x: Number(e.x),
        y: Number(e.y),
        endX: e.end_x ? Number(e.end_x) : undefined,
        endY: e.end_y ? Number(e.end_y) : undefined,
        successful: e.successful,
        shotOutcome: e.shot_outcome as ShotOutcome | undefined,
        aerialOutcome: e.aerial_outcome as AerialOutcome | undefined,
        targetPlayerId: e.target_player_id,
        substitutePlayerId: e.substitute_player_id,
        substitutePlayerName: e.substitute?.name,
        substituteJerseyNumber: e.substitute?.jersey_number,
        minute: e.minute,
        half: e.half,
        phaseId: e.phase_id,
      }));
      setEvents(localEvents);
    }
  }, [savedEvents]);

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

  // Load squad from session storage
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

  useEffect(() => {
    if (matchId) {
      const homeData = sessionStorage.getItem(`match-${matchId}-home-squad`);
      const awayData = sessionStorage.getItem(`match-${matchId}-away-squad`);
      
      if (homeData) {
        try {
          setHomeSquad(JSON.parse(homeData));
        } catch (e) {
          console.error('Failed to parse home squad:', e);
        }
      }
      if (awayData) {
        try {
          setAwaySquad(JSON.parse(awayData));
        } catch (e) {
          console.error('Failed to parse away squad:', e);
        }
      }
    }
  }, [matchId]);

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

  // Save event mutation
  const saveEventMutation = useMutation({
    mutationFn: async (event: {
      match_id: string;
      player_id: string;
      event_type: string;
      half: number;
      minute: number;
      x: number;
      y: number;
      end_x?: number;
      end_y?: number;
      successful: boolean;
      shot_outcome?: string;
      aerial_outcome?: string;
      target_player_id?: string;
      substitute_player_id?: string;
      phase_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('match_events')
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('match_events')
        .delete()
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });
    },
  });

  // Complete match mutation
  const completeMatchMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Match marked as completed');
      navigate('/admin/matches');
    },
  });

  // Event type config
  const requiresEndPosition = selectedEventType
    ? EVENT_CONFIG[selectedEventType].requiresEndPosition
    : false;

  // Check if event is a "without ball" event that doesn't require pitch position
  const isWithoutBallEvent = selectedEventType && ['substitution', 'yellow_card', 'red_card'].includes(selectedEventType);

  // Clear current event
  const clearEvent = useCallback(() => {
    setStartPosition(null);
    setEndPosition(null);
    setIsUnsuccessful(false);
    setShotOutcome(null);
    setAerialOutcome(null);
    setTargetPlayerId(null);
    setSubstitutePlayerId(null);
    if (!stickyPlayer) {
      setSelectedPlayerId(null);
    }
    setSelectedEventType(null);
  }, [stickyPlayer]);

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

    if (!matchId) return;

    try {
      await saveEventMutation.mutateAsync({
        match_id: matchId,
        player_id: selectedPlayerId,
        event_type: selectedEventType!,
        half: selectedHalf,
        minute,
        x: startPosition?.x ?? 50,
        y: startPosition?.y ?? 50,
        end_x: endPosition?.x,
        end_y: endPosition?.y,
        successful: !isUnsuccessful,
        shot_outcome: shotOutcome || undefined,
        aerial_outcome: aerialOutcome || undefined,
        target_player_id: targetPlayerId || undefined,
        substitute_player_id: substitutePlayerId || undefined,
        phase_id: currentPhase?.id,
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
    selectedHalf,
    currentPhase,
    clearEvent,
    saveEventMutation,
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
    setMinute(event.minute);

    // Delete from DB (will be re-added on save)
    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      console.error('Failed to delete event for edit:', error);
    }
  }, [events, deleteEventMutation]);

  // Phase controls
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
  ]);

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

  const [notesOpen, setNotesOpen] = useState(false);

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

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Tabs value={String(selectedHalf)} onValueChange={(v) => setSelectedHalf(Number(v) as 1 | 2)}>
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
            <Label htmlFor="minute" className="text-sm">Minute:</Label>
            <Input
              id="minute"
              type="number"
              min={1}
              max={90}
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="w-16"
            />
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
            />

            <EventModifiers
              selectedEventType={selectedEventType}
              isUnsuccessful={isUnsuccessful}
              onUnsuccessfulChange={setIsUnsuccessful}
              shotOutcome={shotOutcome}
              onShotOutcomeChange={setShotOutcome}
              aerialOutcome={aerialOutcome}
              onAerialOutcomeChange={setAerialOutcome}
              targetPlayerId={targetPlayerId}
              onTargetPlayerChange={setTargetPlayerId}
              substitutePlayerId={substitutePlayerId}
              onSubstitutePlayerChange={setSubstitutePlayerId}
              players={players}
              substitutes={players.filter(p => p.id !== selectedPlayerId)}
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
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <EventTypeSelector
              selectedEventType={selectedEventType}
              onSelect={setSelectedEventType}
            />

            <PhaseControls
              currentPhase={currentPhase}
              phaseCount={phases.length}
              onStartPhase={handleStartPhase}
              onEndPhase={handleEndPhase}
            />

            <KeyboardShortcuts />
          </div>
        </div>

        {/* Event list */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Logged Events ({events.length})
          </h3>
          <EventList
            events={events}
            phases={phases}
            onDelete={handleDeleteEvent}
            onEdit={handleEditEvent}
          />
        </div>
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
