import { useState, useMemo } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatCard } from "@/components/StatCard";
import { useTeamWithPlayers } from "@/hooks/useTeams";
import { useMatches, MatchFilter } from "@/hooks/usePlayerStats";
import { useSinglePlayerPassEvents } from "@/hooks/usePlayerPassEvents";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // NEW
import { ArrowLeft, Target, TrendingUp, Shield, Activity, Users, AlertCircle, Flag } from "lucide-react";
import { PlayerEfficiencyMetrics } from "@/components/PlayerEfficiencyMetrics";
import { TacticalInsightsCard } from "@/components/TacticalInsightsCard";
import { PlayerPassPositionMap } from "@/components/PlayerPassPositionMap";
import { DirectionalPassMap } from "@/components/DirectionalPassMap";
import { PlayerPassThirdMap } from "@/components/PlayerPassThirdMap";
import { AttackingThreatMap } from "@/components/views/AttackingThreatMap";
import { LostPossessionHeatmap } from "@/components/views/LostPossessionHeatmap";
import { DefensiveHeatmap } from "@/components/views/DefensiveHeatmap";
import { usePlayerDefensiveEvents } from "@/hooks/usePlayerDefensiveEvents";
import { usePlayerAdvancedStats } from "@/hooks/usePlayerAdvancedStats";
import { usePlayerXGStats } from "@/hooks/usePlayerXGStats";
import { usePlayerMatchTrends } from "@/hooks/usePlayerMatchTrends";
import { PlayerPerformanceTrends } from "@/components/views/PlayerPerformanceTrends";
import { usePlayerShots } from "@/hooks/usePlayerShots";
import { PlayerShotMap } from "@/components/views/PlayerShotMap";
import { calculateAdvancedMetrics, calculateTacticalProfile, analyzePositioning } from "@/utils/playerMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { PlayerProfileView } from "@/components/views/PlayerProfileView";

export default function PlayerProfile() {
  const { teamId, playerName } = useParams<{ teamId: string; playerName: string }>();
  const navigate = useNavigate();
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');

  const { data: team, isLoading: teamLoading } = useTeamWithPlayers(teamId, matchFilter);
  const { data: matches } = useMatches(teamId);
  const { data: passData, isLoading: passLoading } = useSinglePlayerPassEvents(
    teamId || '',
    playerName,
    matchFilter
  );
  const { data: advancedStats, isLoading: advancedStatsLoading } = usePlayerAdvancedStats(
    teamId || '',
    playerName,
    matchFilter
  );

  // Get match IDs for xG filtering based on match filter
  const matchIdsForXG = useMemo(() => {
    if (!matches || !team) return undefined;
    const teamMatches = matches.filter(m =>
      m.home_team?.slug === team.slug || m.away_team?.slug === team.slug
    );

    if (matchFilter === 'all') return teamMatches.map(m => m.id);
    if (matchFilter === 'last1') return teamMatches.slice(0, 1).map(m => m.id);
    if (matchFilter === 'last3') return teamMatches.slice(0, 3).map(m => m.id);
    if (matchFilter === 'last5') return teamMatches.slice(0, 5).map(m => m.id);
    // Specific match ID
    return [matchFilter];
  }, [matches, team, matchFilter]);

  const { data: trendData, isLoading: trendLoading } = usePlayerMatchTrends(
    teamId,
    playerName ? decodeURIComponent(playerName) : undefined
  );

  const { data: playerShots } = usePlayerShots(
    teamId,
    playerName ? decodeURIComponent(playerName) : undefined,
    matchIdsForXG
  );

  const { data: defensiveEvents } = usePlayerDefensiveEvents(
    teamId,
    playerName ? decodeURIComponent(playerName) : undefined,
    matchIdsForXG
  );

  const { data: xgStats, isLoading: xgLoading } = usePlayerXGStats({
    playerName: playerName ? decodeURIComponent(playerName) : undefined,
    teamSlug: teamId,
    matchIds: matchIdsForXG,
  });

  const player = useMemo(() => {
    if (!team || !playerName) return null;
    return team.players.find(p => p.playerName === decodeURIComponent(playerName));
  }, [team, playerName]);

  const teamMatches = useMemo(() => {
    if (!matches || !team) return [];
    return matches.filter(m =>
      m.home_team?.slug === team.slug || m.away_team?.slug === team.slug
    );
  }, [matches, team]);

  const { advancedMetrics, tacticalProfile, positioning } = useMemo(() => {
    if (!player) return { advancedMetrics: null, tacticalProfile: null, positioning: null };
    const metrics = calculateAdvancedMetrics(player);
    const profile = calculateTacticalProfile(player, metrics);
    const pos = analyzePositioning(player);
    return { advancedMetrics: metrics, tacticalProfile: profile, positioning: pos };
  }, [player]);

  // Check if player has any stats for the selected filter
  const hasStats = player && (
    player.passCount > 0 || player.goals > 0 || player.tackles > 0 ||
    player.shotsAttempted > 0 || player.minutesPlayed > 0 || player.saves > 0 ||
    player.clearance > 0 || player.aerialDuelsWon > 0 || player.aerialDuelsLost > 0 ||
    player.fouls > 0 || player.corners > 0 || player.throwIns > 0 ||
    player.freeKicks > 0 || player.crosses > 0 || player.runInBehind > 0
  );

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
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

        {/* Match Filter */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Filter Statistics</h3>
          <MatchFilterSelect
            value={matchFilter}
            onValueChange={setMatchFilter}
            teamSlug={teamId}
          />
        </div>

        {!hasStats ? (
          <Card className="mb-8">
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No statistics available for the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="analysis">Tactical & Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Key Stats */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Key Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <StatCard title="Minutes Played" value={player.minutesPlayed} icon={Activity} />
                  <StatCard title="Sub Appearances" value={player.substituteAppearances} icon={Users} />
                  <StatCard title="Goals" value={player.goals} icon={Target} />
                  <StatCard title="Total Passes" value={player.passCount} icon={Users} />
                  <StatCard title="Pass Accuracy" value={player.successPassPercent} icon={TrendingUp} />
                  <StatCard title="Tackles" value={player.tackles} icon={Shield} />
                  <StatCard title="Shots Attempted" value={player.shotsAttempted} icon={Activity} />
                </div>
              </div>

              {/* Efficiency Metrics & Tactical Insights */}
              {advancedMetrics && tacticalProfile && positioning && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <PlayerEfficiencyMetrics metrics={advancedMetrics} />
                  <TacticalInsightsCard
                    player={player}
                    tacticalProfile={tacticalProfile}
                    positioning={positioning}
                    metrics={advancedMetrics}
                  />
                </div>
              )}

              {/* Attacking Stats */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Attacking Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* xG Stats Row */}
                  {xgStats && xgStats.shotCount > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Expected Goals (xG)</p>
                        <p className="text-2xl font-bold text-primary">{xgStats.totalXG.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">xG per Shot</p>
                        <p className="text-2xl font-bold">{xgStats.xGPerShot.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Goals vs xG</p>
                        <p className={`text-2xl font-bold ${xgStats.overperformance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {xgStats.overperformance >= 0 ? '+' : ''}{xgStats.overperformance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Finishing Quality</p>
                        <p className="text-2xl font-bold">
                          {xgStats.actualGoals} / {xgStats.shotCount}
                          <span className="text-sm text-muted-foreground ml-1">goals</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Run in Behind</p>
                      <p className="text-2xl font-bold text-primary">{player.runInBehind}</p>
                    </div>
                    {/* ... Rest of Attacking Stats content matches what was overwritten ... */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Overlaps</p>
                      <p className="text-2xl font-bold text-primary">{player.overlaps}</p>
                    </div>
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
                      <p className="text-sm text-muted-foreground mb-1">Penalty Area Pass</p>
                      <p className="text-2xl font-bold">{player.penaltyAreaPass}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Penalty Area Entry</p>
                      <p className="text-2xl font-bold">{player.penaltyAreaEntry}</p>
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

              {/* Shot Map */}
              {playerShots && playerShots.length > 0 && (
                <div className="mb-8">
                  <PlayerShotMap shots={playerShots} />
                </div>
              )}

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

              {/* Discipline & Set Pieces - Re-adding Cards */}
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
                      {/* ... Discipline content ... */}
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
                      {/* ... other discipline stats ... */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Fouls Won</span>
                        <span className="font-bold text-primary">{player.foulWon}</span>
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
                    {/* ... Set Pieces Content ... */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Corners</span>
                        <span className="font-bold">{player.corners}</span>
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
            </TabsContent>


            <TabsContent value="trends" className="space-y-6">
              <PlayerPerformanceTrends
                data={trendData || []}
                isLoading={trendLoading}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {passData && passData.passes.length > 0 && (
                <DirectionalPassMap passes={passData.passes} title="Forward & Backward Pass Map" />
              )}

              {advancedStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AttackingThreatMap stats={advancedStats.attackingThreat.all} />
                  <LostPossessionHeatmap events={advancedStats.possessionLossEvents} />
                </div>
              )}

              {defensiveEvents && defensiveEvents.length > 0 && (
                <DefensiveHeatmap events={defensiveEvents} />
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Match-by-Match Performance Timeline */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Match History</h2>
          <Card>
            <CardContent className="p-6">
              {teamMatches.length > 0 ? (
                <div className="space-y-4">
                  {teamMatches.map((match) => {
                    const isHome = match.home_team?.slug === team.slug;
                    const opponent = isHome ? match.away_team?.name : match.home_team?.name;
                    const teamScore = isHome ? match.home_score : match.away_score;
                    const opponentScore = isHome ? match.away_score : match.home_score;
                    const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
                    const resultText = `${result} ${teamScore}-${opponentScore}`;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setMatchFilter(match.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={result === 'W' ? 'default' : result === 'L' ? 'destructive' : 'secondary'}
                              className="w-16 justify-center"
                            >
                              {resultText}
                            </Badge>
                            <div>
                              <p className="font-medium">{isHome ? 'vs' : '@'} {opponent}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(match.match_date), 'MMM d, yyyy')}
                                {match.competition && ` • ${match.competition}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Click to view stats
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No matches recorded yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main >
      <Footer />
    </div >
  );
}
