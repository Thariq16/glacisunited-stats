import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerStats } from "@/utils/parseCSV";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Shield } from "lucide-react";

interface PlayerCardProps {
  player: PlayerStats;
  teamId: string;
}

export function PlayerCard({ player, teamId }: PlayerCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/team/${teamId}/player/${encodeURIComponent(player.playerName)}`);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer hover:border-primary"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{player.playerName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              #{player.jerseyNumber}
            </p>
          </div>
          {player.role && (
            <Badge variant="secondary">{player.role}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Pass Accuracy</span>
            </div>
            <span className="font-semibold">{player.successPassPercent}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Goals</span>
            </div>
            <span className="font-semibold">{player.goals}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Tackles</span>
            </div>
            <span className="font-semibold">{player.tackles}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
