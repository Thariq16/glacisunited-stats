import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jersey_number: number;
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
                #{player.jersey_number} {player.name.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Full dropdown */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">All players:</p>
        <Select value={selectedPlayerId || ''} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select player">
              {selectedPlayer && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  #{selectedPlayer.jersey_number} {selectedPlayer.name}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
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
    </div>
  );
}
