import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowRight,
  Target,
  Shield,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  MoveRight,
  Zap,
  ArrowUpRight,
  ArrowUp,
  Hand,
  CornerUpRight,
  Flag,
  LogOut,
  Circle,
  FastForward,
  RefreshCw,
  DoorOpen,
  Send,
  XCircle,
  Key,
  Trophy,
} from 'lucide-react';
import { EventType, EVENT_CONFIG } from './types';

interface EventTypeSelectorProps {
  selectedEventType: EventType | null;
  onSelect: (eventType: EventType) => void;
}

const EVENT_ICONS: Record<EventType, React.ComponentType<{ className?: string }>> = {
  pass: ArrowRight,
  key_pass: Key,
  assist: Trophy,
  shot: Target,
  tackle_won: Shield,
  tackle_not_won: ShieldX,
  foul_committed: AlertTriangle,
  foul_won: CheckCircle,
  carry: MoveRight,
  dribble: Zap,
  clearance: ArrowUpRight,
  aerial_duel: ArrowUp,
  save: Hand,
  cross: CornerUpRight,
  corner: Flag,
  throw_in: LogOut,
  free_kick: Circle,
  run_in_behind: FastForward,
  overlap: RefreshCw,
  penalty_area_entry: DoorOpen,
  penalty_area_pass: Send,
  defensive_error: XCircle,
};

const EVENT_ORDER: EventType[] = [
  'pass',
  'key_pass',
  'assist',
  'shot',
  'cross',
  'penalty_area_pass',
  'carry',
  'dribble',
  'run_in_behind',
  'overlap',
  'tackle_won',
  'tackle_not_won',
  'clearance',
  'aerial_duel',
  'foul_committed',
  'foul_won',
  'defensive_error',
  'save',
  'corner',
  'throw_in',
  'free_kick',
  'penalty_area_entry',
];

export function EventTypeSelector({ selectedEventType, onSelect }: EventTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Event Type
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {EVENT_ORDER.map((eventType) => {
          const config = EVENT_CONFIG[eventType];
          const Icon = EVENT_ICONS[eventType];
          const isSelected = selectedEventType === eventType;

          return (
            <Tooltip key={eventType}>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs ${
                    isSelected ? '' : 'hover:bg-accent'
                  }`}
                  onClick={() => onSelect(eventType)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] leading-tight text-center truncate w-full">
                    {config.label}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {config.requiresEndPosition ? 'Requires start + end position' : 'Single position only'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
