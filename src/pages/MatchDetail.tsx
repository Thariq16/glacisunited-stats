import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, TrendingUp, Shield, Activity, Calendar, MapPin } from "lucide-react";
import { getMatchById } from "@/data/matchData";
import { getTeamById } from "@/data/teamData";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlayerCard } from "@/components/PlayerCard";
import { MatchStatsTable } from "@/components/MatchStatsTable";

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const match = matchId ? getMatchById(matchId) : undefined;
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const homeTeam = match ? getTeamById(match.homeTeamId) : undefined;
  const awayTeam = match ? getTeamById(match.awayTeamId) : undefined;

  if (!match || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Match not found</h1>
            <Button onClick={() => navigate('/matches')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matches
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const homeTeamStats = {
    totalGoals: homeTeam.players.reduce((sum, p) => sum + p.goals, 0),
    totalPasses: homeTeam.players.reduce((sum, p) => sum + p.passCount, 0),
    totalSuccessfulPasses: homeTeam.players.reduce((sum, p) => sum + p.successfulPass, 0),
    totalTackles: homeTeam.players.reduce((sum, p) => sum + p.tackles, 0),
    totalShots: homeTeam.players.reduce((sum, p) => sum + p.shotsAttempted, 0),
  };

  const awayTeamStats = {
    totalGoals: awayTeam.players.reduce((sum, p) => sum + p.goals, 0),
    totalPasses: awayTeam.players.reduce((sum, p) => sum + p.passCount, 0),
    totalSuccessfulPasses: awayTeam.players.reduce((sum, p) => sum + p.successfulPass, 0),
    totalTackles: awayTeam.players.reduce((sum, p) => sum + p.tackles, 0),
    totalShots: awayTeam.players.reduce((sum, p) => sum + p.shotsAttempted, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/matches')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Button>

        {/* Match Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <Badge variant="outline" className="text-lg py-1 px-3">{match.competition}</Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(match.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4 mb-6">
              <div className="text-right">
                <h2 className="text-2xl font-bold text-foreground mb-2">{match.homeTeam}</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTeamId(match.homeTeamId)}
                >
                  View Players
                </Button>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-5xl font-bold text-foreground">{match.score.home}</span>
                  <span className="text-3xl text-muted-foreground">-</span>
                  <span className="text-5xl font-bold text-foreground">{match.score.away}</span>
                </div>
              </div>
              
              <div className="text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">{match.awayTeam}</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTeamId(match.awayTeamId)}
                >
                  View Players
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {match.venue}
            </div>
          </CardContent>
        </Card>

        {/* Overall Match Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Overall Match Statistics</h2>
          
          <MatchStatsTable 
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homePlayers={homeTeam.players}
            awayPlayers={awayTeam.players}
          />
        </div>

        {/* Player Performance Modal */}
        <Dialog open={!!selectedTeamId} onOpenChange={() => setSelectedTeamId(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam} - Player Performances
              </DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {(selectedTeamId === match.homeTeamId ? homeTeam : awayTeam).players.map((player) => (
                <PlayerCard 
                  key={`${player.jerseyNumber}-${player.playerName}`}
                  player={player}
                  teamId={selectedTeamId}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
