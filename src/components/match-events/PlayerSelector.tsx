import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

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
  recentPlayerIds: string[];
  onSelect: (playerId: string) => void;
  stickyPlayer: boolean;
  onStickyChange: (sticky: boolean) => void;
}

export function PlayerSelector({
  players,
  selectedPlayerId,
  recentPlayerIds,
  onSelect,
  stickyPlayer,
  onStickyChange,
}: PlayerSelectorProps) {
  const recentPlayers = recentPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined)
    .slice(0, 5);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Sort players: starting XI first, then substitutes, then by jersey number
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.status === 'starting' && b.status !== 'starting') return -1;
    if (a.status !== 'starting' && b.status === 'starting') return 1;
    return a.jersey_number - b.jersey_number;
  });

  const formatPlayerDisplay = (player: Player, short = false) => {
    const role = player.role ? ` (${player.role})` : '';
    if (short) {
      return `#${player.jersey_number} ${player.name.split(' ')[0]}`;
    }
    return `${player.jersey_number} - ${player.name}${role}`;
  };

  return (
    <div className="space-y-4">
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
          <Label htmlFor="sticky-player" className="text-xs">
            Sticky
          </Label>
        </div>
      </div>

      {/* Recent players */}
      {recentPlayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Recent:</p>
          <div className="flex flex-wrap gap-1">
            {recentPlayers.map((player) => (
              <Button
                key={player.id}
                variant={selectedPlayerId === player.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => onSelect(player.id)}
              >
                {formatPlayerDisplay(player, true)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Full dropdown */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Squad players:</p>
        <Select value={selectedPlayerId || ''} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select player">
              {selectedPlayer && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {formatPlayerDisplay(selectedPlayer)}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortedPlayers.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                <span className="flex items-center gap-2">
                  <span>{formatPlayerDisplay(player)}</span>
                  {player.status === 'substitute' && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">SUB</Badge>
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
