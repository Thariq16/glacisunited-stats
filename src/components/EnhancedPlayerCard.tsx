import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlayerStats } from "@/utils/parseCSV";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";
import { PlayerPassStats } from "@/components/PlayerPassStats";
import { PlayerPassPositionMap } from "@/components/PlayerPassPositionMap";
import { PlayerPassThirdMap } from "@/components/PlayerPassThirdMap";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Clock, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancedPlayerCardProps {
  player: PlayerStats;
  teamId: string;
  passData?: PlayerPassData;
}

// Simple match rating calculation based on stats
function calculateMatchRating(player: PlayerStats): number {
  let rating = 6.0; // Base rating

  // Positive contributions
  rating += player.goals * 0.5;
  rating += player.shotsOnTarget * 0.1;
  rating += (player.successfulPass / Math.max(player.passCount, 1)) * 1.5;
  rating += player.tackles * 0.1;
  rating += player.aerialDuelsWon * 0.1;
  rating += player.penaltyAreaEntry * 0.1;
  rating += player.penaltyAreaPass * 0.15;

  // Negative contributions
  rating -= player.missPass * 0.02;
  rating -= player.defensiveErrors * 0.3;
  rating -= player.fouls * 0.1;

  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, rating));
}

function getRatingColor(rating: number): string {
  if (rating >= 8) return "text-green-500";
  if (rating >= 7) return "text-emerald-500";
  if (rating >= 6) return "text-yellow-500";
  if (rating >= 5) return "text-orange-500";
  return "text-red-500";
}

export function EnhancedPlayerCard({ player, teamId, passData }: EnhancedPlayerCardProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const matchRating = calculateMatchRating(player);
  const successRate = player.passCount > 0 
    ? ((player.successfulPass / player.passCount) * 100).toFixed(0)
    : '0';

  const handleViewProfile = () => {
    setDialogOpen(false);
    navigate(`/team/${teamId}/player/${encodeURIComponent(player.playerName)}`);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{player.playerName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  #{player.jerseyNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {player.role && (
                  <Badge variant="secondary" className="text-xs">{player.role}</Badge>
                )}
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className={`font-bold ${getRatingColor(matchRating)}`}>
                    {matchRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Minutes</span>
                </div>
                <span className="font-semibold">{player.minutesPlayed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Passes</span>
                </div>
                <span className="font-semibold">{player.passCount} ({successRate}%)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Goals</span>
                </div>
                <span className="font-semibold">{player.goals}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>#{player.jerseyNumber} {player.playerName}</span>
            {player.role && <Badge variant="secondary">{player.role}</Badge>}
            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md ml-auto">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className={`text-lg font-bold ${getRatingColor(matchRating)}`}>
                {matchRating.toFixed(1)}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Pass statistics and visualizations */}
          {passData && passData.totalPasses > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <PlayerPassStats passData={passData} />
                <div className="md:col-span-2">
                  <PlayerPassPositionMap passData={passData} />
                </div>
              </div>
              <PlayerPassThirdMap passData={passData} />
            </>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Passing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Passes</span>
                    <span className="font-semibold">{player.passCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Successful</span>
                    <span className="font-semibold text-green-600">{player.successfulPass}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unsuccessful</span>
                    <span className="font-semibold text-destructive">{player.missPass}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Forward</span>
                    <span className="font-semibold">{player.forwardPass}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Backward</span>
                    <span className="font-semibold">{player.backwardPass}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Passes by Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Defensive Third</span>
                    <span className="font-semibold">{player.fwDefensiveThird}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Middle Third</span>
                    <span className="font-semibold">{player.fwMiddleThird}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final Third</span>
                    <span className="font-semibold">{player.fwFinalThird}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Button onClick={handleViewProfile} variant="outline" className="w-full">
            View Full Profile
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
