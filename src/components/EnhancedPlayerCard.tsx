import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlayerStats } from "@/utils/parseCSV";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";
import { PlayerPassStats } from "@/components/PlayerPassStats";
import { PlayerPassPositionMap } from "@/components/PlayerPassPositionMap";
import { PlayerPassThirdMap } from "@/components/PlayerPassThirdMap";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface EnhancedPlayerCardProps {
  player: PlayerStats;
  teamId: string;
  passData?: PlayerPassData;
  matchIds?: string[];
}

export function EnhancedPlayerCard({ player, teamId, passData }: EnhancedPlayerCardProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const successRate = player.passCount > 0 
    ? Math.round((player.successfulPass / player.passCount) * 100)
    : 0;

  const shotAccuracy = player.shotsAttempted > 0
    ? Math.round((player.shotsOnTarget / player.shotsAttempted) * 100)
    : 0;

  const aerialTotal = player.aerialDuelsWon + player.aerialDuelsLost;
  const aerialRate = aerialTotal > 0
    ? Math.round((player.aerialDuelsWon / aerialTotal) * 100)
    : 0;

  const handleViewProfile = () => {
    setDialogOpen(false);
    navigate(`/team/${teamId}/player/${encodeURIComponent(player.playerName)}`);
  };

  const getRoleColor = (role: string) => {
    const r = role?.toUpperCase() || '';
    if (r === 'GK') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(r)) return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(r)) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    if (['CF', 'ST', 'LW', 'RW'].includes(r)) return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary group overflow-hidden">
          {/* Header: Jersey + Name + Role */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {player.jerseyNumber}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{player.playerName}</h3>
              <span className="text-xs text-muted-foreground">{player.minutesPlayed} mins played</span>
            </div>
            {player.role && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${getRoleColor(player.role)}`}>
                {player.role}
              </Badge>
            )}
          </div>

          <CardContent className="px-4 pb-4 pt-2 space-y-3">
            {/* Pass accuracy bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pass Accuracy</span>
                <span className="font-semibold">{successRate}% <span className="text-muted-foreground font-normal">({player.successfulPass}/{player.passCount})</span></span>
              </div>
              <Progress value={successRate} className="h-1.5" />
            </div>

            {/* Compact stat grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 rounded bg-muted/50">
                <p className="text-lg font-bold leading-none">{player.forwardPass}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Fwd Pass</p>
              </div>
              <div className="text-center p-1.5 rounded bg-muted/50">
                <p className="text-lg font-bold leading-none">{player.tackles + player.clearance}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Def Actions</p>
              </div>
              <div className="text-center p-1.5 rounded bg-muted/50">
                <p className="text-lg font-bold leading-none">{player.shotsAttempted}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Shots</p>
              </div>
            </div>

            {/* Secondary metrics row */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
              <span>Aerials: <span className="font-medium text-foreground">{player.aerialDuelsWon}W/{player.aerialDuelsLost}L</span></span>
              <span>Fouls Won: <span className="font-medium text-foreground">{player.foulWon}</span></span>
              <span>Crosses: <span className="font-medium text-foreground">{player.crosses}</span></span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>#{player.jerseyNumber} {player.playerName}</span>
            {player.role && <Badge variant="secondary">{player.role}</Badge>}
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
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-medium">Passing Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Passes</span>
                    <span className="font-semibold">{player.passCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Successful</span>
                    <span className="font-semibold">{player.successfulPass}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Forward</span>
                    <span className="font-semibold">{player.forwardPass}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Backward</span>
                    <span className="font-semibold">{player.backwardPass}</span>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-medium">Passes by Zone</h4>
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
                </div>
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
