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
}

export function PlayerSelector({
  players,
  selectedPlayerId,
  onSelect,
  stickyPlayer,
  onStickyChange,
}: PlayerSelectorProps) {
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Split players by status and sort by jersey number
  const starters = players
    .filter((p) => p.status === 'starting')
    .sort((a, b) => a.jersey_number - b.jersey_number);
  
  const substitutes = players
    .filter((p) => p.status === 'substitute')
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
      {starters.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Starting XI:</p>
          <div className="flex flex-wrap gap-1">
            {starters.map((player) => (
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
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Substitutes grid */}
      {substitutes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Subs:</p>
          <div className="flex flex-wrap gap-1">
            {substitutes.map((player) => (
              <Tooltip key={player.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedPlayerId === player.id ? 'default' : 'outline'}
                    size="sm"
                    className={`w-9 h-9 p-0 text-sm ${
                      selectedPlayerId === player.id 
                        ? 'ring-2 ring-offset-1 ring-primary' 
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => onSelect(player.id)}
                  >
                    {player.jersey_number}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {player.name}{player.role ? ` (${player.role})` : ''}
                </TooltipContent>
              </Tooltip>
            ))}
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
            {allPlayersSorted.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                <span className="flex items-center gap-2">
                  <span className="font-mono font-bold w-6">{player.jersey_number}</span>
                  <span>{player.name}</span>
                  {player.status === 'substitute' && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 ml-auto">SUB</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
