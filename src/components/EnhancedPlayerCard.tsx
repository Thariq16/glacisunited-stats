import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlayerStats } from "@/utils/parseCSV";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";
import { PlayerPassStats } from "@/components/PlayerPassStats";
import { PlayerPassPositionMap } from "@/components/PlayerPassPositionMap";
import { PlayerPassThirdMap } from "@/components/PlayerPassThirdMap";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Clock, Star, ChevronRight, Info, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculatePlayerRating, getRatingColor, PlayerRatingResult } from "@/utils/playerRating";
import { usePlayerXGStats } from "@/hooks/usePlayerXGStats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedPlayerCardProps {
  player: PlayerStats;
  teamId: string;
  passData?: PlayerPassData;
  matchIds?: string[];
}

function RatingBreakdown({ rating }: { rating: PlayerRatingResult }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold border-b pb-1 mb-2">Rating Breakdown</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">Passing:</span>
        <span className={getRatingColor(rating.components.passing)}>{rating.components.passing.toFixed(1)}</span>
        <span className="text-muted-foreground">Attacking:</span>
        <span className={getRatingColor(rating.components.attacking)}>{rating.components.attacking.toFixed(1)}</span>
        <span className="text-muted-foreground">Defending:</span>
        <span className={getRatingColor(rating.components.defending)}>{rating.components.defending.toFixed(1)}</span>
        <span className="text-muted-foreground">Discipline:</span>
        <span className={getRatingColor(rating.components.discipline)}>{rating.components.discipline.toFixed(1)}</span>
      </div>
      {rating.xgInfo && (
        <div className="pt-2 mt-2 border-t space-y-1">
          <div className="font-semibold text-xs">xG Stats</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <span className="text-muted-foreground">xG:</span>
            <span>{rating.xgInfo.totalXG.toFixed(2)}</span>
            <span className="text-muted-foreground">Goals:</span>
            <span>{rating.xgInfo.actualGoals}</span>
            <span className="text-muted-foreground">vs Expected:</span>
            <span className={rating.xgInfo.overperformance >= 0 ? "text-green-500" : "text-red-500"}>
              {rating.xgInfo.overperformance >= 0 ? '+' : ''}{rating.xgInfo.overperformance.toFixed(2)}
            </span>
          </div>
        </div>
      )}
      {rating.minutesAdjustment < 1 && (
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          * Adjusted for {rating.minutesPlayed} min played
        </div>
      )}
    </div>
  );
}

export function EnhancedPlayerCard({ player, teamId, passData, matchIds }: EnhancedPlayerCardProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch xG stats for this player
  const { data: xgStats } = usePlayerXGStats({
    playerName: player.playerName,
    teamSlug: teamId,
    matchIds,
  });
  
  // Calculate rating with xG data
  const ratingResult = useMemo(() => {
    return calculatePlayerRating(player, 90, xgStats || undefined);
  }, [player, xgStats]);
  
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md cursor-help">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className={`font-bold ${getRatingColor(ratingResult.overall)}`}>
                          {ratingResult.overall.toFixed(1)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="w-48">
                      <RatingBreakdown rating={ratingResult} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
              {xgStats && xgStats.shotCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">xG</span>
                  </div>
                  <span className="font-semibold">
                    {xgStats.totalXG.toFixed(2)}
                    <span className={`ml-1 text-xs ${xgStats.overperformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ({xgStats.overperformance >= 0 ? '+' : ''}{xgStats.overperformance.toFixed(2)})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>#{player.jerseyNumber} {player.playerName}</span>
            {player.role && <Badge variant="secondary">{player.role}</Badge>}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md ml-auto cursor-help">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className={`text-lg font-bold ${getRatingColor(ratingResult.overall)}`}>
                      {ratingResult.overall.toFixed(1)}
                    </span>
                    <Info className="h-3 w-3 text-muted-foreground ml-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-48">
                  <RatingBreakdown rating={ratingResult} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
