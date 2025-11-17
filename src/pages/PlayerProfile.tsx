import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { getPlayerByName, getTeamById } from "@/data/teamData";
import { getMatchesByTeam } from "@/data/matchData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, TrendingUp, Shield, Activity, Users, AlertCircle, Wind, Flag } from "lucide-react";

export default function PlayerProfile() {
  const { teamId, playerName } = useParams<{ teamId: string; playerName: string }>();
  const navigate = useNavigate();
  
  const team = teamId ? getTeamById(teamId) : undefined;
  const player = teamId && playerName ? getPlayerByName(teamId, decodeURIComponent(playerName)) : undefined;
  const teamMatches = teamId ? getMatchesByTeam(teamId) : [];

  if (!team || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Player not found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/team/${teamId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {team.name}
        </Button>

        <div className="bg-card rounded-lg p-8 mb-8 border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{player.playerName}</h1>
                <Badge variant="secondary" className="text-lg py-1 px-3">
                  #{player.jerseyNumber}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">{team.name}</p>
            </div>
            {player.role && (
              <Badge className="text-lg py-2 px-4 w-fit">
                {player.role}
              </Badge>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Key Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title="Goals"
              value={player.goals}
              icon={Target}
            />
            <StatCard
              title="Total Passes"
              value={player.passCount}
              icon={Users}
            />
            <StatCard
              title="Pass Accuracy"
              value={player.successPassPercent}
              icon={TrendingUp}
            />
            <StatCard
              title="Tackles"
              value={player.tackles}
              icon={Shield}
            />
            <StatCard
              title="Shots Attempted"
              value={player.shotsAttempted}
              icon={Activity}
            />
          </div>
        </div>

        {/* Passing Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Passing Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Passes</p>
                <p className="text-2xl font-bold">{player.passCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Successful</p>
                <p className="text-2xl font-bold text-primary">{player.successfulPass}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Forward Passes</p>
                <p className="text-2xl font-bold">{player.forwardPass}</p>
                <p className="text-xs text-muted-foreground">{player.forwardPassPercent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Backward Passes</p>
                <p className="text-2xl font-bold">{player.backwardPass}</p>
                <p className="text-xs text-muted-foreground">{player.backwardPassPercent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attacking Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Attacking Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Shots on Target</p>
                <p className="text-2xl font-bold">{player.shotsOnTarget}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Shot Accuracy</p>
                <p className="text-2xl font-bold text-primary">
                  {player.shotsAttempted > 0 ? ((player.shotsOnTarget / player.shotsAttempted) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {player.shotsAttempted > 0 ? ((player.goals / player.shotsAttempted) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Clinical Finishing</p>
                <p className="text-2xl font-bold text-primary">
                  {player.shotsOnTarget > 0 ? ((player.goals / player.shotsOnTarget) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Penalty Area Pass</p>
                <p className="text-2xl font-bold">{player.penaltyAreaPass}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Penalty Area Entry</p>
                <p className="text-2xl font-bold">{player.penaltyAreaEntry}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">PA Entry Efficiency</p>
                <p className="text-2xl font-bold text-primary">
                  {player.penaltyAreaPass > 0 ? ((player.penaltyAreaEntry / player.penaltyAreaPass) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pass to Goal Threat</p>
                <p className="text-2xl font-bold text-primary">
                  {player.passCount > 0 ? ((player.penaltyAreaPass / player.passCount) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Crosses</p>
                <p className="text-2xl font-bold">{player.crosses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cut Backs</p>
                <p className="text-2xl font-bold">{player.cutBacks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Offside</p>
                <p className="text-2xl font-bold">{player.offside}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defensive Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Defensive Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Clearances</p>
                <p className="text-2xl font-bold">{player.clearance}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aerial Duels Won</p>
                <p className="text-2xl font-bold text-primary">{player.aerialDuelsWon}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aerial Duels Lost</p>
                <p className="text-2xl font-bold">{player.aerialDuelsLost}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saves</p>
                <p className="text-2xl font-bold">{player.saves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discipline & Set Pieces */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Discipline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Fouls</span>
                  <span className="font-bold">{player.fouls}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Final Third</span>
                  <span className="font-semibold">{player.foulsInFinalThird}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Middle Third</span>
                  <span className="font-semibold">{player.foulsInMiddleThird}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Defensive Third</span>
                  <span className="font-semibold">{player.foulsInDefensiveThird}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Fouls Won</span>
                  <span className="font-bold text-primary">{player.foulWon}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-primary/30">
                  <span className="text-sm text-muted-foreground">Final Third</span>
                  <span className="font-semibold text-primary">{player.fwFinalThird}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-primary/30">
                  <span className="text-sm text-muted-foreground">Middle Third</span>
                  <span className="font-semibold text-primary">{player.fwMiddleThird}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-primary/30">
                  <span className="text-sm text-muted-foreground">Defensive Third</span>
                  <span className="font-semibold text-primary">{player.fwDefensiveThird}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Defensive Errors</span>
                  <span className="font-bold">{player.defensiveErrors}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Set Pieces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Corners</span>
                  <span className="font-bold">{player.corners}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Successful</span>
                  <span className="font-semibold text-primary">{player.cornerSuccess}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-semibold">{player.cornerFailed}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-primary">
                    {player.corners > 0 ? ((player.cornerSuccess / player.corners) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Throw Ins</span>
                  <span className="font-bold">{player.throwIns}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Successful</span>
                  <span className="font-semibold text-primary">{player.tiSuccess}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-semibold">{player.tiFailed}</span>
                </div>
                <div className="flex justify-between items-center pl-4 border-l-2 border-muted">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-primary">
                    {player.throwIns > 0 ? ((player.tiSuccess / player.throwIns) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Free Kicks</span>
                  <span className="font-bold">{player.freeKicks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match-by-Match Performance Timeline */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Match-by-Match Performance</h2>
          <Card>
            <CardContent className="p-6">
              {teamMatches.length > 0 ? (
                <div className="space-y-4">
                  {teamMatches.map((match) => {
                    const isHome = match.homeTeamId === teamId;
                    const opponent = isHome ? match.awayTeam : match.homeTeam;
                    const teamScore = isHome ? match.score.home : match.score.away;
                    const opponentScore = isHome ? match.score.away : match.score.home;
                    const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
                    const resultText = `${result} ${teamScore}-${opponentScore}`;
                    
                    return (
                      <div 
                        key={match.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{match.date}</span>
                            <Badge variant={result === 'W' ? 'default' : result === 'D' ? 'secondary' : 'outline'}>
                              {resultText}
                            </Badge>
                            <Badge variant="outline">{match.competition}</Badge>
                          </div>
                          <p className="font-semibold mt-1">vs {opponent}</p>
                          <p className="text-xs text-muted-foreground mt-1">{match.venue}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No match data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
