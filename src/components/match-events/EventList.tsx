import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Edit, Check, X, ArrowRight } from 'lucide-react';
import { LocalEvent, Phase, EVENT_CONFIG, EVENTS_WITH_TARGET_PLAYER } from './types';

interface EventListProps {
  events: LocalEvent[];
  phases: Phase[];
  players?: Array<{ id: string; name: string; jersey_number: number }>;
  onDelete: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamId?: string;
}

export function EventList({ events, phases, players = [], onDelete, onEdit, homeTeamName, awayTeamName, homeTeamId }: EventListProps) {
  // Sort events by match time (minute + seconds) descending - newest first for display
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.minute * 60 + (a.seconds ?? 0);
    const timeB = b.minute * 60 + (b.seconds ?? 0);
    return timeB - timeA; // Descending order
  });
  
  // Create a chronological index map (first entry = #1, second = #2, etc.)
  const chronologicalEvents = [...events].sort((a, b) => {
    const timeA = a.minute * 60 + (a.seconds ?? 0);
    const timeB = b.minute * 60 + (b.seconds ?? 0);
    return timeA - timeB; // Ascending order for numbering
  });
  const eventIndexMap = new Map(chronologicalEvents.map((e, idx) => [e.id, idx + 1]));

  if (events.length === 0) {
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

  return (
    <div className="border rounded-lg">
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-16">Time</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead className="w-20">From</TableHead>
              <TableHead className="w-20">To</TableHead>
              <TableHead className="w-16">Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.map((event) => {
              const phase = getPhaseForEvent(event.id);
              const config = EVENT_CONFIG[event.eventType];
              const targetPlayer = getTargetPlayer(event.targetPlayerId);
              const showReceiver = EVENTS_WITH_TARGET_PLAYER.includes(event.eventType);
              
              // Determine team name based on event's teamId
              const isHomeTeam = event.teamId === homeTeamId;
              const teamName = isHomeTeam ? homeTeamName : awayTeamName;

              return (
                <TableRow
                  key={event.id}
                  className={phase ? `border-l-4 ${getPhaseColor(phase.phaseNumber)}` : ''}
                >
                  {/* Time in mm:ss format */}
                  <TableCell className="font-mono text-xs">{eventIndexMap.get(event.id)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {String(event.minute).padStart(2, '0')}:{String(event.seconds ?? 0).padStart(2, '0')}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isHomeTeam ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                      {teamName || (isHomeTeam ? 'Home' : 'Away')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">#{event.jerseyNumber}</span>{' '}
                    <span className="text-muted-foreground">
                      {event.playerName.split(' ')[0]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {config.label}
                    {event.eventType === 'substitution' && event.substitutePlayerName && (
                      <span className="text-xs text-muted-foreground ml-1">
                        → #{event.substituteJerseyNumber} {event.substitutePlayerName.split(' ')[0]}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {showReceiver && targetPlayer ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">#{targetPlayer.jersey_number}</span>
                        <span className="text-muted-foreground text-xs">
                          {targetPlayer.name.split(' ')[0]}
                        </span>
                      </span>
                    ) : showReceiver ? (
                      <span className="text-muted-foreground text-xs">-</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    ({event.x}, {event.y})
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.endX !== undefined ? `(${event.endX}, ${event.endY})` : '-'}
                  </TableCell>
                  <TableCell>
                    {event.successful ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(event.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(event.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}