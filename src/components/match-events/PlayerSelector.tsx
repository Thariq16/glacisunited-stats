import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Player {
  id: string;
  name: string;
  jersey_number: number;
  role?: string | null;
  status?: 'starting' | 'substitute';
}

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerId: string | null;
  recentPlayerIds: string[]; // Keep for keyboard shortcut compatibility
  onSelect: (playerId: string) => void;
  stickyPlayer: boolean;
  onStickyChange: (sticky: boolean) => void;
  subbedOffPlayerIds?: string[]; // Players who have been substituted off
  subbedOnPlayerIds?: string[]; // Players who have come on as substitutes
}

export function PlayerSelector({
  players,
  selectedPlayerId,
  onSelect,
  stickyPlayer,
  onStickyChange,
  subbedOffPlayerIds = [],
  subbedOnPlayerIds = [],
}: PlayerSelectorProps) {
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

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

  // All players sorted for dropdown
  const allPlayersSorted = [...players].sort((a, b) => a.jersey_number - b.jersey_number);

  const formatPlayerDisplay = (player: Player) => {
    const role = player.role ? ` (${player.role})` : '';
    return `${player.jersey_number} - ${player.name}${role}`;
  };

  return (
    <div className="space-y-3">
      {/* Header with sticky toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Player
        </h3>
        <div className="flex items-center gap-2">
          <Switch
            id="sticky-player"
            checked={stickyPlayer}
            onCheckedChange={onStickyChange}
          />
          <Label htmlFor="sticky-player" className="text-xs">Sticky</Label>
        </div>
      </div>

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
                      variant={selectedPlayerId === player.id ? 'default' : 'secondary'}
                      size="sm"
                      className={`w-9 h-9 p-0 text-sm font-bold ${
                        selectedPlayerId === player.id 
                          ? 'ring-2 ring-offset-1 ring-primary' 
                          : ''
                      }`}
                      onClick={() => onSelect(player.id)}
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
                      variant={selectedPlayerId === player.id ? 'default' : 'outline'}
                      size="sm"
                      disabled={isSubbedOff}
                      className={`w-9 h-9 p-0 text-sm ${
                        selectedPlayerId === player.id 
                          ? 'ring-2 ring-offset-1 ring-primary' 
                          : 'text-muted-foreground'
                      } ${
                        isSubbedOff 
                          ? 'opacity-40 cursor-not-allowed line-through' 
                          : ''
                      }`}
                      onClick={() => !isSubbedOff && onSelect(player.id)}
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

      {/* Compact dropdown for edge cases */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">All players:</p>
        <Select value={selectedPlayerId || ''} onValueChange={onSelect}>
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Select player">
              {selectedPlayer && (
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-bold">{selectedPlayer.jersey_number}</span>
                  <span>{selectedPlayer.name}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
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
  );
}
