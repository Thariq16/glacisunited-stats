import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const CATEGORY_ICONS: Record<EventCategory, React.ComponentType<{ className?: string }>> = {
  passing: ArrowRight,
  movement: MoveRight,
  shooting: Target,
  defensive: Shield,
  set_piece: Flag,
  without_ball: Circle,
};

export function EventTypeSelector({ selectedEventType, onSelect }: EventTypeSelectorProps) {
  // Find which category contains the selected event, default to 'passing'
  const findCategoryForEvent = (eventType: EventType | null): EventCategory => {
    if (!eventType) return 'passing';
    for (const [category, config] of Object.entries(EVENT_CATEGORIES)) {
      if (config.events.includes(eventType)) {
        return category as EventCategory;
      }
    }
    return 'passing';
  };

  const [activeCategory, setActiveCategory] = useState<EventCategory>(
    findCategoryForEvent(selectedEventType)
  );

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
  };

  const categories = Object.entries(EVENT_CATEGORIES) as [EventCategory, typeof EVENT_CATEGORIES[EventCategory]][];

  return (
    <div className="space-y-2">
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as EventCategory)}>
        <TabsList className="w-full grid grid-cols-6 h-auto p-1">
          {categories.map(([category, config]) => {
            const CategoryIcon = CATEGORY_ICONS[category];
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="flex flex-col gap-0.5 py-1.5 px-1 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CategoryIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline truncate">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(([category, config]) => (
          <TabsContent key={category} value={category} className="mt-3">
            <div className={`grid gap-2 ${config.events.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'}`}>
              {config.events.map(renderEventButton)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
