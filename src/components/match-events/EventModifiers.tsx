import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventType, ShotOutcome, AerialOutcome, EVENTS_WITH_UNSUCCESSFUL, EVENTS_WITH_TARGET_PLAYER, EVENT_CONFIG } from './types';

interface Player {
  id: string;
  name: string;
  jersey_number: number;
}

interface EventModifiersProps {
  selectedEventType: EventType | null;
  isUnsuccessful: boolean;
  onUnsuccessfulChange: (value: boolean) => void;
  shotOutcome: ShotOutcome | null;
  onShotOutcomeChange: (value: ShotOutcome) => void;
  aerialOutcome: AerialOutcome | null;
  onAerialOutcomeChange: (value: AerialOutcome) => void;
  targetPlayerId: string | null;
  onTargetPlayerChange: (value: string | null) => void;
  players: Player[];
}

export function EventModifiers({
  selectedEventType,
  isUnsuccessful,
  onUnsuccessfulChange,
  shotOutcome,
  onShotOutcomeChange,
  aerialOutcome,
  onAerialOutcomeChange,
  targetPlayerId,
  onTargetPlayerChange,
  players,
}: EventModifiersProps) {
  if (!selectedEventType) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Modifiers
        </h3>
        <p className="text-sm text-muted-foreground italic">
          Select an event type first
        </p>
      </div>
    );
  }

  const showUnsuccessful = EVENTS_WITH_UNSUCCESSFUL.includes(selectedEventType);
  const showShotOutcome = selectedEventType === 'shot';
  const showAerialOutcome = selectedEventType === 'aerial_duel';
  const showTargetPlayer = EVENTS_WITH_TARGET_PLAYER.includes(selectedEventType);
  const isTargetRequired = selectedEventType ? EVENT_CONFIG[selectedEventType]?.requiresTargetPlayer : false;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Modifiers
      </h3>

      {/* Unsuccessful toggle */}
      {showUnsuccessful && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="unsuccessful"
            checked={isUnsuccessful}
            onCheckedChange={(checked) => onUnsuccessfulChange(checked === true)}
          />
          <Label htmlFor="unsuccessful" className="text-sm cursor-pointer">
            Unsuccessful
          </Label>
        </div>
      )}

      {/* Shot outcome */}
      {showShotOutcome && (
        <div className="space-y-2">
          <Label className="text-sm">Shot Outcome</Label>
          <RadioGroup
            value={shotOutcome || ''}
            onValueChange={(value) => onShotOutcomeChange(value as ShotOutcome)}
            className="flex flex-wrap gap-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="goal" id="goal" />
              <Label htmlFor="goal" className="text-xs cursor-pointer">Goal</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="on_target" id="on_target" />
              <Label htmlFor="on_target" className="text-xs cursor-pointer">On Target</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="off_target" id="off_target" />
              <Label htmlFor="off_target" className="text-xs cursor-pointer">Off Target</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="blocked" id="blocked" />
              <Label htmlFor="blocked" className="text-xs cursor-pointer">Blocked</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Aerial duel outcome */}
      {showAerialOutcome && (
        <div className="space-y-2">
          <Label className="text-sm">Aerial Duel Outcome</Label>
          <RadioGroup
            value={aerialOutcome || ''}
            onValueChange={(value) => onAerialOutcomeChange(value as AerialOutcome)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="won" id="aerial_won" />
              <Label htmlFor="aerial_won" className="text-xs cursor-pointer">Won</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="lost" id="aerial_lost" />
              <Label htmlFor="aerial_lost" className="text-xs cursor-pointer">Lost</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Target player (for passes, key passes, assists, throw-ins, crosses) */}
      {showTargetPlayer && (
        <div className="space-y-2">
          <Label className="text-sm">
            Target Player {isTargetRequired ? <span className="text-destructive">*</span> : '(optional)'}
          </Label>
          <Select
            value={targetPlayerId || 'none'}
            onValueChange={(value) => onTargetPlayerChange(value === 'none' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select target player" />
            </SelectTrigger>
            <SelectContent>
              {!isTargetRequired && <SelectItem value="none">No target specified</SelectItem>}
              {players
                .sort((a, b) => a.jersey_number - b.jersey_number)
                .map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    #{player.jersey_number} {player.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!showUnsuccessful && !showShotOutcome && !showAerialOutcome && !showTargetPlayer && (
        <p className="text-sm text-muted-foreground italic">
          No modifiers for this event type
        </p>
      )}
    </div>
  );
}
