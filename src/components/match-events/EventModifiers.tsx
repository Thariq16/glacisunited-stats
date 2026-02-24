import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EventType, ShotOutcome, AerialOutcome, CornerDeliveryType, EVENTS_WITH_UNSUCCESSFUL, EVENTS_WITH_TARGET_PLAYER, EVENT_CONFIG } from './types';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  name: string;
  jersey_number: number;
  role?: string | null;
  status?: 'starting' | 'substitute';
}

interface EventModifiersProps {
  selectedEventType: EventType | null;
  isUnsuccessful: boolean;
  onUnsuccessfulChange: (value: boolean) => void;
  shotOutcome: ShotOutcome | null;
  onShotOutcomeChange: (value: ShotOutcome) => void;
  aerialOutcome: AerialOutcome | null;
  onAerialOutcomeChange: (value: AerialOutcome) => void;
  cornerDeliveryType: CornerDeliveryType | null;
  onCornerDeliveryChange: (value: CornerDeliveryType) => void;
  targetPlayerId: string | null;
  onTargetPlayerChange: (value: string | null) => void;
  substitutePlayerId: string | null;
  onSubstitutePlayerChange: (value: string | null) => void;
  players: Player[];
  substitutes?: Player[];
  recentTargetPlayerIds?: string[];
  subbedOffPlayerIds?: string[]; // Players who have been substituted off
  subbedOnPlayerIds?: string[]; // Players who have come on as substitutes
}

export function EventModifiers({
  selectedEventType,
  isUnsuccessful,
  onUnsuccessfulChange,
  shotOutcome,
  onShotOutcomeChange,
  aerialOutcome,
  onAerialOutcomeChange,
  cornerDeliveryType,
  onCornerDeliveryChange,
  targetPlayerId,
  onTargetPlayerChange,
  substitutePlayerId,
  onSubstitutePlayerChange,
  players,
  substitutes = [],
  recentTargetPlayerIds = [],
  subbedOffPlayerIds = [],
  subbedOnPlayerIds = [],
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
  const showShotOutcome = selectedEventType === 'shot' || selectedEventType === 'penalty';
  const showAerialOutcome = selectedEventType === 'aerial_duel';
  const showCornerDelivery = selectedEventType === 'corner';
  const showLongThrow = selectedEventType === 'throw_in';
  const showTargetPlayer = EVENTS_WITH_TARGET_PLAYER.includes(selectedEventType);
  const showSubstitutePlayer = selectedEventType === 'substitution';
  const isTargetRequired = selectedEventType ? EVENT_CONFIG[selectedEventType]?.requiresTargetPlayer : false;

  // Compute effective starters and subs based on substitution events
  // - Original starters who haven't been subbed off + players who came on
  // - Original subs who haven't come on + players who were subbed off
  const effectiveStarters = players
    .filter((p) => {
      const wasOriginalStarter = p.status === 'starting';
      const wasSubbedOff = subbedOffPlayerIds.includes(p.id);
      const cameOn = subbedOnPlayerIds.includes(p.id);

      // In effective starting XI if: (original starter AND not subbed off) OR (came on as sub)
      return (wasOriginalStarter && !wasSubbedOff) || cameOn;
    })
    .sort((a, b) => a.jersey_number - b.jersey_number);

  const effectiveSubs = players
    .filter((p) => {
      const wasOriginalSub = p.status === 'substitute';
      const wasSubbedOff = subbedOffPlayerIds.includes(p.id);
      const cameOn = subbedOnPlayerIds.includes(p.id);

      // In effective subs if: (original sub AND not came on) OR (was subbed off)
      return (wasOriginalSub && !cameOn) || wasSubbedOff;
    })
    .sort((a, b) => a.jersey_number - b.jersey_number);

  // All players sorted for dropdown - show effective status
  const allPlayersSorted = [...players].sort((a, b) => a.jersey_number - b.jersey_number);

  const selectedTargetPlayer = players.find((p) => p.id === targetPlayerId);

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

      {/* Corner delivery type */}
      {showCornerDelivery && (
        <div className="space-y-2">
          <Label className="text-sm">Delivery Type <span className="text-destructive">*</span></Label>
          <RadioGroup
            value={cornerDeliveryType || ''}
            onValueChange={(value) => onCornerDeliveryChange(value as CornerDeliveryType)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="inswing" id="corner_inswing" />
              <Label htmlFor="corner_inswing" className="text-xs cursor-pointer">Inswing</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="outswing" id="corner_outswing" />
              <Label htmlFor="corner_outswing" className="text-xs cursor-pointer">Outswing</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="short" id="corner_short" />
              <Label htmlFor="corner_short" className="text-xs cursor-pointer">Short</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Target player - hybrid selection */}
      {showTargetPlayer && (
        <div className="space-y-3">
          <Label className="text-sm">
            Target Player {isTargetRequired ? <span className="text-destructive">*</span> : '(optional)'}
          </Label>

          {/* Starting XI grid */}
          {effectiveStarters.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Starting XI:</p>
              <div className="flex flex-wrap gap-1">
                {effectiveStarters.map((player) => {
                  const isSubbedOn = subbedOnPlayerIds.includes(player.id);

                  return (
                    <Tooltip key={player.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={targetPlayerId === player.id ? 'default' : 'secondary'}
                          size="sm"
                          className={`w-9 h-9 p-0 text-sm font-bold ${targetPlayerId === player.id
                            ? 'ring-2 ring-offset-1 ring-primary'
                            : ''
                            }`}
                          onClick={() => onTargetPlayerChange(player.id)}
                        >
                          {player.jersey_number}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {player.name}{player.role ? ` (${player.role})` : ''}
                        {isSubbedOn && ' (ON)'}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Substitutes grid */}
          {effectiveSubs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Subs:</p>
              <div className="flex flex-wrap gap-1">
                {effectiveSubs.map((player) => {
                  const isSubbedOff = subbedOffPlayerIds.includes(player.id);

                  return (
                    <Tooltip key={player.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={targetPlayerId === player.id ? 'default' : 'outline'}
                          size="sm"
                          disabled={isSubbedOff}
                          className={`w-9 h-9 p-0 text-sm ${targetPlayerId === player.id
                            ? 'ring-2 ring-offset-1 ring-primary'
                            : 'text-muted-foreground'
                            } ${isSubbedOff
                              ? 'opacity-40 cursor-not-allowed line-through'
                              : ''
                            }`}
                          onClick={() => !isSubbedOff && onTargetPlayerChange(player.id)}
                        >
                          {player.jersey_number}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {player.name}{player.role ? ` (${player.role})` : ''}
                        {isSubbedOff && ' (OFF)'}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact dropdown for all players */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">All players:</p>
            <Select
              value={targetPlayerId || 'none'}
              onValueChange={(value) => onTargetPlayerChange(value === 'none' ? null : value)}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select target player">
                  {selectedTargetPlayer ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-bold">{selectedTargetPlayer.jersey_number}</span>
                      <span>{selectedTargetPlayer.name}</span>
                    </span>
                  ) : (
                    !isTargetRequired ? 'No target specified' : 'Select target player'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {!isTargetRequired && <SelectItem value="none">No target specified</SelectItem>}
                {allPlayersSorted.map((player) => {
                  const isSubbedOff = subbedOffPlayerIds.includes(player.id);
                  const isSubbedOn = subbedOnPlayerIds.includes(player.id);
                  // Determine effective status based on substitution events
                  const isEffectivelyOnPitch = (player.status === 'starting' && !isSubbedOff) || isSubbedOn;

                  return (
                    <SelectItem key={player.id} value={player.id} disabled={isSubbedOff}>
                      <span className={`flex items-center gap-2 ${isSubbedOff ? 'opacity-50 line-through' : ''}`}>
                        <span className="font-mono font-bold w-6">{player.jersey_number}</span>
                        <span>{player.name}</span>
                        {isSubbedOff && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1 ml-auto">OFF</Badge>
                        )}
                        {isSubbedOn && (
                          <Badge className="text-[10px] h-4 px-1 ml-auto bg-green-600">ON</Badge>
                        )}
                        {!isSubbedOff && !isSubbedOn && !isEffectivelyOnPitch && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 ml-auto">SUB</Badge>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Substitute player (for substitutions - player coming ON) */}
      {showSubstitutePlayer && (
        <div className="space-y-2">
          <Label className="text-sm">
            Player Coming On <span className="text-destructive">*</span>
          </Label>
          <Select
            value={substitutePlayerId || 'none'}
            onValueChange={(value) => onSubstitutePlayerChange(value === 'none' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select substitute" />
            </SelectTrigger>
            <SelectContent>
              {[...substitutes]
                .sort((a, b) => {
                  // Starting XI first, then substitutes, then by jersey number
                  if (a.status === 'starting' && b.status !== 'starting') return -1;
                  if (a.status !== 'starting' && b.status === 'starting') return 1;
                  return a.jersey_number - b.jersey_number;
                })
                .map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    <span className="flex items-center gap-2">
                      <span>#{player.jersey_number} {player.name}</span>
                      {player.status === 'substitute' && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">SUB</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!showUnsuccessful && !showShotOutcome && !showAerialOutcome && !showTargetPlayer && !showSubstitutePlayer && (
        <p className="text-sm text-muted-foreground italic">
          No modifiers for this event type
        </p>
      )}
    </div>
  );
}
