import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Edit, Check, X, ArrowRight, Goal, Target, XCircle, Layers } from 'lucide-react';
import { LocalEvent, Phase, EVENT_CONFIG, EVENTS_WITH_TARGET_PLAYER, PhaseOutcome } from './types';

interface EventListProps {
  firstHalfEvents: LocalEvent[];
  secondHalfEvents: LocalEvent[];
  phases: Phase[];
  players?: Array<{ id: string; name: string; jersey_number: number }>;
  onDelete: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  onCreatePhase?: (eventIds: string[], outcome: PhaseOutcome, teamId: string) => void;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamId?: string;
}

export function EventList({ 
  firstHalfEvents, 
  secondHalfEvents, 
  phases, 
  players = [], 
  onDelete, 
  onEdit, 
  onCreatePhase, 
  homeTeamName, 
  awayTeamName, 
  homeTeamId 
}: EventListProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('1st');
  
  // Combine all events for global calculations
  const allEvents = useMemo(() => [...firstHalfEvents, ...secondHalfEvents], [firstHalfEvents, secondHalfEvents]);
  
  // Sort events by time descending within each half (newest first)
  const sortedFirstHalf = useMemo(() => 
    [...firstHalfEvents].sort((a, b) => {
      const timeA = a.minute * 60 + (a.seconds ?? 0);
      const timeB = b.minute * 60 + (b.seconds ?? 0);
      return timeB - timeA;
    }), [firstHalfEvents]);
    
  const sortedSecondHalf = useMemo(() => 
    [...secondHalfEvents].sort((a, b) => {
      const timeA = a.minute * 60 + (a.seconds ?? 0);
      const timeB = b.minute * 60 + (b.seconds ?? 0);
      return timeB - timeA;
    }), [secondHalfEvents]);
  
  // Create a chronological index map across all events
  const chronologicalEvents = useMemo(() => 
    [...allEvents].sort((a, b) => {
      if (a.half !== b.half) return a.half - b.half;
      const timeA = a.minute * 60 + (a.seconds ?? 0);
      const timeB = b.minute * 60 + (b.seconds ?? 0);
      return timeA - timeB;
    }), [allEvents]);
  const eventIndexMap = useMemo(() => new Map(chronologicalEvents.map((e, idx) => [e.id, idx + 1])), [chronologicalEvents]);

  // Helper to format time
  const formatMatchTime = (minute: number, seconds: number) => {
    return `${String(minute).padStart(2, '0')}:${String(seconds ?? 0).padStart(2, '0')}`;
  };

  // Helper to format created_at timestamp
  const formatTimestamp = (createdAt?: string) => {
    if (!createdAt) return '-';
    const d = new Date(createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get events that are not already part of a phase (for current tab)
  const currentTabEvents = activeTab === '1st' ? sortedFirstHalf : sortedSecondHalf;
  const availableEvents = useMemo(() => currentTabEvents.filter(e => !e.phaseId), [currentTabEvents]);

  // Toggle event selection
  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEventIds);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEventIds(newSelected);
  };

  // Select all visible events
  const selectAllAvailable = () => {
    if (selectedEventIds.size === availableEvents.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(availableEvents.map(e => e.id)));
    }
  };

  // Get dominant team from selected events
  const getSelectedTeamId = (): string | undefined => {
    const selectedEvents = allEvents.filter(e => selectedEventIds.has(e.id));
    const teamCounts = new Map<string, number>();
    
    selectedEvents.forEach(e => {
      if (e.teamId) {
        teamCounts.set(e.teamId, (teamCounts.get(e.teamId) || 0) + 1);
      }
    });
    
    let dominantTeam: string | undefined;
    let maxCount = 0;
    teamCounts.forEach((count, teamId) => {
      if (count > maxCount) {
        maxCount = count;
        dominantTeam = teamId;
      }
    });
    
    return dominantTeam;
  };

  // Handle phase outcome selection
  const handleOutcomeSelect = (outcome: PhaseOutcome) => {
    const teamId = getSelectedTeamId();
    if (teamId && onCreatePhase) {
      onCreatePhase(Array.from(selectedEventIds), outcome, teamId);
      setSelectedEventIds(new Set());
    }
    setShowOutcomeDialog(false);
  };

  // Clear selection when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedEventIds(new Set());
  };

  if (allEvents.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>No events logged yet</p>
        <p className="text-sm mt-1">Click on the pitch to start logging events</p>
      </div>
    );
  }

  const getPhaseForEvent = (eventId: string) => {
    return phases.find((p) => p.eventIds.includes(eventId));
  };

  const getPhaseColor = (phaseNumber: number) => {
    const colors = [
      'border-l-blue-500',
      'border-l-green-500',
      'border-l-yellow-500',
      'border-l-purple-500',
      'border-l-pink-500',
      'border-l-cyan-500',
    ];
    return colors[(phaseNumber - 1) % colors.length];
  };

  const getTargetPlayer = (targetPlayerId: string | undefined) => {
    if (!targetPlayerId) return null;
    return players.find(p => p.id === targetPlayerId);
  };

  const selectedTeamId = getSelectedTeamId();
  const selectedTeamName = selectedTeamId === homeTeamId ? homeTeamName : awayTeamName;

  // Render event row
  const renderEventRow = (event: LocalEvent) => {
    const phase = getPhaseForEvent(event.id);
    const config = EVENT_CONFIG[event.eventType];
    const targetPlayer = getTargetPlayer(event.targetPlayerId);
    const showReceiver = EVENTS_WITH_TARGET_PLAYER.includes(event.eventType);
    const isSelected = selectedEventIds.has(event.id);
    const isInPhase = !!phase;
    const isHomeTeam = event.teamId === homeTeamId;
    const teamName = isHomeTeam ? homeTeamName : awayTeamName;

    return (
      <TableRow
        key={event.id}
        className={`${phase ? `border-l-4 ${getPhaseColor(phase.phaseNumber)}` : ''} ${isSelected ? 'bg-accent/50' : ''}`}
      >
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleEventSelection(event.id)}
            disabled={isInPhase}
            aria-label={`Select event ${eventIndexMap.get(event.id)}`}
          />
        </TableCell>
        <TableCell className="font-mono text-xs">{eventIndexMap.get(event.id)}</TableCell>
        <TableCell className="font-mono text-xs">
          {formatMatchTime(event.minute, event.seconds ?? 0)}
        </TableCell>
        <TableCell className="text-sm">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isHomeTeam ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
            {teamName || (isHomeTeam ? 'Home' : 'Away')}
          </span>
        </TableCell>
        <TableCell className="text-sm">
          <span className="font-medium">#{event.jerseyNumber}</span>{' '}
          <span className="text-muted-foreground">{event.playerName.split(' ')[0]}</span>
        </TableCell>
        <TableCell className="text-sm">
          {config.label}
          {event.eventType === 'substitution' && event.substitutePlayerName && (
            <span className="text-xs text-muted-foreground ml-1">
              → #{event.substituteJerseyNumber} {event.substitutePlayerName.split(' ')[0]}
            </span>
          )}
          {isInPhase && (
            <span className="text-xs text-muted-foreground ml-1">(Phase #{phase.phaseNumber})</span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {showReceiver && targetPlayer ? (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium">#{targetPlayer.jersey_number}</span>
              <span className="text-muted-foreground text-xs">{targetPlayer.name.split(' ')[0]}</span>
            </span>
          ) : showReceiver ? (
            <span className="text-muted-foreground text-xs">-</span>
          ) : (
            <span className="text-muted-foreground text-xs">N/A</span>
          )}
        </TableCell>
        <TableCell className="font-mono text-xs">({event.x}, {event.y})</TableCell>
        <TableCell className="font-mono text-xs">
          {event.endX !== undefined ? `(${event.endX}, ${event.endY})` : '-'}
        </TableCell>
        <TableCell>
          {event.successful ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {formatTimestamp(event.createdAt)}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(event.id)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(event.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Render table for a half's events
  const renderEventsTable = (events: LocalEvent[]) => (
    <ScrollArea className="h-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedEventIds.size > 0 && selectedEventIds.size === availableEvents.length}
                onCheckedChange={selectAllAvailable}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-12">#</TableHead>
            <TableHead className="w-16">Time</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Receiver</TableHead>
        <TableHead className="w-20">From</TableHead>
            <TableHead className="w-20">To</TableHead>
            <TableHead className="w-16">Status</TableHead>
            <TableHead className="w-20">Logged</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                No events for this half
              </TableCell>
            </TableRow>
          ) : (
            events.map(renderEventRow)
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <div className="border rounded-lg">
      {/* Phase creation controls */}
      {selectedEventIds.size > 0 && onCreatePhase && (
        <div className="p-3 bg-accent/30 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedEventIds.size} event{selectedEventIds.size > 1 ? 's' : ''} selected
            </span>
            {selectedTeamName && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${selectedTeamId === homeTeamId ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                {selectedTeamName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEventIds(new Set())}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setShowOutcomeDialog(true)}
              className="gap-1"
            >
              <Layers className="h-4 w-4" />
              Create Phase
            </Button>
          </div>
        </div>
      )}
      
      {/* Tabs for 1st and 2nd half */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="border-b px-3 pt-2">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="1st" className="gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                1st Half
                <span className="text-xs text-muted-foreground">({firstHalfEvents.length})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="2nd" className="gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                2nd Half
                <span className="text-xs text-muted-foreground">({secondHalfEvents.length})</span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="1st" className="m-0">
          {renderEventsTable(sortedFirstHalf)}
        </TabsContent>
        
        <TabsContent value="2nd" className="m-0">
          {renderEventsTable(sortedSecondHalf)}
        </TabsContent>
      </Tabs>

      {/* Phase outcome dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Attacking Phase</DialogTitle>
            <DialogDescription>
              How did this attacking phase end? ({selectedEventIds.size} events for {selectedTeamName})
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => handleOutcomeSelect('goal')}
            >
              <Goal className="h-8 w-8 text-green-500" />
              <span>Goal</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-yellow-500/10 hover:border-yellow-500"
              onClick={() => handleOutcomeSelect('shot')}
            >
              <Target className="h-8 w-8 text-yellow-500" />
              <span>Shot</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-red-500/10 hover:border-red-500"
              onClick={() => handleOutcomeSelect('lost_possession')}
            >
              <XCircle className="h-8 w-8 text-red-500" />
              <span>Lost Possession</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
