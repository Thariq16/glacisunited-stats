import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ArrowLeftRight,
  Square,
  OctagonX,
  CircleDot,
  UserX,
  Goal,
  Play,
  RotateCcw,
  ShieldOff,
} from 'lucide-react';
import { EventType, EVENT_CONFIG, EVENT_CATEGORIES, EventCategory } from './types';

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
  substitution: ArrowLeftRight,
  yellow_card: Square,
  red_card: OctagonX,
  penalty: CircleDot,
  offside: UserX,
  goal_kick: Goal,
  kick_off: Play,
  goal_restart: RotateCcw,
  block: ShieldOff,
};

const CATEGORY_ORDER: EventCategory[] = ['passing', 'movement', 'shooting', 'defensive', 'set_piece', 'without_ball'];

export function EventTypeSelector({ selectedEventType, onSelect }: EventTypeSelectorProps) {
  const renderEventButton = (eventType: EventType) => {
    const config = EVENT_CONFIG[eventType];
    const Icon = EVENT_ICONS[eventType];
    const isSelected = selectedEventType === eventType;

    return (
      <Tooltip key={eventType}>
        <TooltipTrigger asChild>
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            className={`flex items-center gap-1.5 h-auto py-1.5 px-2 text-xs justify-start ${
              isSelected ? '' : 'hover:bg-accent'
            }`}
            onClick={() => onSelect(eventType)}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-[11px] leading-tight text-left whitespace-normal break-words">
              {config.label}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">
            {config.requiresEndPosition ? 'Start + end position' : 'Single position'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <ScrollArea className="h-[400px] pr-3">
      <div className="space-y-3">
        {CATEGORY_ORDER.map((category) => {
          const config = EVENT_CATEGORIES[category];
          return (
            <div key={category}>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 sticky top-0 bg-background py-0.5">
                {config.label}
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {config.events.map(renderEventButton)}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
