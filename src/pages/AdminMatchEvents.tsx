import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Undo2 } from 'lucide-react';
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
  const [minute, setMinute] = useState(1);
  const [stickyPlayer, setStickyPlayer] = useState(false);

  // Phase state
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Events state
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [recentPlayerIds, setRecentPlayerIds] = useState<string[]>([]);

  // Get selected team ID
  const selectedTeamId = selectedTeamType === 'home' 
    ? matchData?.home_team?.id 
    : matchData?.away_team?.id;

  // Fetch players for selected team
  const { data: players = [] } = useQuery({
    queryKey: ['players-for-events', selectedTeamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, jersey_number')
        .eq('team_id', selectedTeamId)
        .order('jersey_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId,
  });

  // Event type config
  const requiresEndPosition = selectedEventType
    ? EVENT_CONFIG[selectedEventType].requiresEndPosition
    : false;

  // Clear current event
  const clearEvent = useCallback(() => {
    setStartPosition(null);
    setEndPosition(null);
    setIsUnsuccessful(false);
    setShotOutcome(null);
    setAerialOutcome(null);
    setTargetPlayerId(null);
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
  const saveEvent = useCallback(() => {
    if (!selectedPlayerId || !selectedEventType || !startPosition) {
      toast.error('Please select a player, event type, and position');
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

    const player = players.find((p) => p.id === selectedPlayerId);
    if (!player) return;

    const newEvent: LocalEvent = {
      id: crypto.randomUUID(),
      playerId: selectedPlayerId,
      playerName: player.name,
      jerseyNumber: player.jersey_number,
      eventType: selectedEventType,
      x: startPosition.x,
      y: startPosition.y,
      endX: endPosition?.x,
      endY: endPosition?.y,
      successful: !isUnsuccessful,
      shotOutcome: shotOutcome || undefined,
      aerialOutcome: aerialOutcome || undefined,
      targetPlayerId: targetPlayerId || undefined,
      minute,
      half: selectedHalf,
      phaseId: currentPhase?.id,
    };

    setEvents((prev) => [...prev, newEvent]);

    // Update phase if active
    if (currentPhase) {
      setCurrentPhase((prev) =>
        prev ? { ...prev, eventIds: [...prev.eventIds, newEvent.id] } : null
      );
    }

    toast.success('Event logged');
    clearEvent();
  }, [
    selectedPlayerId,
    selectedEventType,
    startPosition,
    endPosition,
    requiresEndPosition,
    shotOutcome,
    aerialOutcome,
    isUnsuccessful,
    targetPlayerId,
    minute,
    selectedHalf,
    currentPhase,
    players,
    clearEvent,
  ]);

  // Undo last event
  const undoLastEvent = useCallback(() => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    setEvents((prev) => prev.slice(0, -1));

    // Update phase if last event was in a phase
    if (lastEvent.phaseId && currentPhase?.id === lastEvent.phaseId) {
      setCurrentPhase((prev) =>
        prev
          ? { ...prev, eventIds: prev.eventIds.filter((id) => id !== lastEvent.id) }
          : null
      );
    }

    toast.info('Event removed');
  }, [events, currentPhase]);

  // Delete event
  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    toast.info('Event deleted');
  }, []);

  // Edit event (loads it back into the form)
  const handleEditEvent = useCallback((eventId: string) => {
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
    setMinute(event.minute);

    // Remove the event (will be re-added on save)
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, [events]);

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
      // Don't trigger if typing in an input
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
            // Don't auto-end, just show info
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
          // Number keys 1-9 for recent players
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

  if (matchLoading) {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/match-select')}>
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
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
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
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6 mb-6">
          {/* Left sidebar */}
          <div className="space-y-6">
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
              players={players}
            />

            {/* Action buttons */}
            <div className="space-y-2">
              <Button className="w-full" onClick={saveEvent}>
                <Save className="h-4 w-4 mr-2" />
                Save Event
              </Button>
              <Button variant="outline" className="w-full" onClick={undoLastEvent} disabled={events.length === 0}>
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
          <div className="space-y-6">
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

      <Footer />
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
