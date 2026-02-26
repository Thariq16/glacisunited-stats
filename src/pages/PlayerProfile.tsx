import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PlayerProfileActions } from "@/components/PlayerProfileActions";
import { supabase } from "@/integrations/supabase/client";
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
  const [playerProfile, setPlayerProfile] = useState<any>(null);

  // Fetch extended player profile data
  useEffect(() => {
    if (!teamId || !playerName) return;
    const fetchProfile = async () => {
      const { data: team } = await supabase.from('teams').select('id').eq('slug', teamId).single();
      if (!team) return;
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', team.id)
        .eq('name', decodeURIComponent(playerName))
        .or('hidden.is.null,hidden.eq.false')
        .maybeSingle();
      setPlayerProfile(data);
    };
    fetchProfile();
  }, [teamId, playerName]);

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
            <Button onClick={() => navigate('/dashboard')}>
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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{player.playerName}</h1>
                <Badge variant="secondary" className="text-lg py-1 px-3">
                  #{player.jerseyNumber}
                </Badge>
                {player.role && (
                  <Badge className="text-lg py-2 px-4">
                    {player.role}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-lg mb-3">{team.name}</p>

              {/* Extended profile details */}
              {playerProfile && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {playerProfile.nationality && <span>🌍 {playerProfile.nationality}</span>}
                  {playerProfile.date_of_birth && (
                    <span>🎂 {format(new Date(playerProfile.date_of_birth), 'MMM d, yyyy')}</span>
                  )}
                  {playerProfile.height_cm && <span>📏 {playerProfile.height_cm}cm</span>}
                  {playerProfile.weight_kg && <span>⚖️ {playerProfile.weight_kg}kg</span>}
                  {playerProfile.preferred_foot && <span>🦶 {playerProfile.preferred_foot}</span>}
                </div>
              )}
              {playerProfile && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {playerProfile.injury_status && playerProfile.injury_status !== 'Fit' && (
                    <Badge variant="destructive" className="text-xs">🏥 {playerProfile.injury_status}</Badge>
                  )}
                  {playerProfile.on_loan && (
                    <Badge variant="secondary" className="text-xs">📋 On Loan</Badge>
                  )}
                  {playerProfile.transfer_status && playerProfile.transfer_status !== 'active' && (
                    <Badge variant="outline" className="text-xs">{playerProfile.transfer_status.replace('_', ' ')}</Badge>
                  )}
                </div>
              )}
              {playerProfile?.bio && (
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{playerProfile.bio}</p>
              )}
            </div>
            {teamId && playerName && (
              <PlayerProfileActions
                playerName={decodeURIComponent(playerName)}
                teamSlug={teamId}
              />
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

            <TabsContent value="overview" className="space-y-6">
              {/* Hero Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { label: 'Minutes', value: player.minutesPlayed, accent: false },
                  { label: 'Goals', value: player.goals, accent: true },
                  { label: 'Pass Accuracy', value: `${player.successPassPercent}`, accent: true },
                  { label: 'Tackles', value: player.tackles, accent: false },
                  { label: 'Rating', value: advancedMetrics?.performanceRating ?? '-', accent: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`relative rounded-xl border p-4 text-center transition-shadow hover:shadow-md ${
                      stat.accent ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    }`}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.accent ? 'text-primary' : 'text-foreground'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Secondary quick stats */}
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  { label: 'Sub Apps', value: player.substituteAppearances },
                  { label: 'Shots', value: player.shotsAttempted },
                  { label: 'On Target', value: player.shotsOnTarget },
                  { label: 'Passes', value: player.passCount },
                  { label: 'Clearances', value: player.clearance },
                  { label: 'Saves', value: player.saves },
                  { label: 'Aerial Won', value: player.aerialDuelsWon },
                  { label: 'Aerial Lost', value: player.aerialDuelsLost },
                ].filter(s => s.value > 0).map((stat) => (
                  <Badge key={stat.label} variant="secondary" className="text-xs px-3 py-1.5 gap-1.5">
                    <span className="font-bold">{stat.value}</span>
                    <span className="text-muted-foreground">{stat.label}</span>
                  </Badge>
                ))}
              </div>

              {/* Tactical Insights */}
              {advancedMetrics && tacticalProfile && positioning && (
                <TacticalInsightsCard
                  player={player}
                  tacticalProfile={tacticalProfile}
                  positioning={positioning}
                  metrics={advancedMetrics}
                />
              )}

              {/* Consolidated Detailed Stats */}
              <Card>
                <CardContent className="p-0">
                  <Tabs defaultValue="attacking" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 rounded-none rounded-t-lg">
                      <TabsTrigger value="attacking" className="gap-1.5 text-xs sm:text-sm">
                        <Target className="h-3.5 w-3.5" /> Attacking
                      </TabsTrigger>
                      <TabsTrigger value="defensive" className="gap-1.5 text-xs sm:text-sm">
                        <Shield className="h-3.5 w-3.5" /> Defensive
                      </TabsTrigger>
                      <TabsTrigger value="setpieces" className="gap-1.5 text-xs sm:text-sm">
                        <Flag className="h-3.5 w-3.5" /> Set Pieces
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="attacking" className="p-5 space-y-4">
                      {/* xG Stats */}
                      {xgStats && xgStats.shotCount > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">xG</p>
                            <p className="text-xl font-bold text-primary">{xgStats.totalXG.toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">xG/Shot</p>
                            <p className="text-xl font-bold">{xgStats.xGPerShot.toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Goals vs xG</p>
                            <p className={`text-xl font-bold ${xgStats.overperformance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {xgStats.overperformance >= 0 ? '+' : ''}{xgStats.overperformance.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Finishing</p>
                            <p className="text-xl font-bold">{xgStats.actualGoals}/{xgStats.shotCount}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
                        {[
                          { label: 'Run in Behind', value: player.runInBehind },
                          { label: 'Overlaps', value: player.overlaps },
                          { label: 'Shots on Target', value: player.shotsOnTarget },
                          { label: 'Shot Accuracy', value: `${player.shotsAttempted > 0 ? ((player.shotsOnTarget / player.shotsAttempted) * 100).toFixed(1) : 0}%` },
                          { label: 'Conversion Rate', value: `${player.shotsAttempted > 0 ? ((player.goals / player.shotsAttempted) * 100).toFixed(1) : 0}%` },
                          { label: 'PA Passes', value: player.penaltyAreaPass },
                          { label: 'PA Entries', value: player.penaltyAreaEntry },
                          { label: 'Crosses', value: player.crosses },
                          { label: 'Cut Backs', value: player.cutBacks },
                          { label: 'Offside', value: player.offside },
                        ].map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground">{stat.label}</span>
                            <span className="font-semibold text-sm">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="defensive" className="p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
                        {[
                          { label: 'Tackles', value: player.tackles },
                          { label: 'Clearances', value: player.clearance },
                          { label: 'Aerial Won', value: player.aerialDuelsWon },
                          { label: 'Aerial Lost', value: player.aerialDuelsLost },
                          { label: 'Saves', value: player.saves },
                          { label: 'Defensive Errors', value: player.defensiveErrors },
                          { label: 'Fouls Committed', value: player.fouls },
                          { label: 'Fouls Won', value: player.foulWon },
                          { label: 'Fouls (Final 3rd)', value: player.foulsInFinalThird },
                          { label: 'Fouls (Mid 3rd)', value: player.foulsInMiddleThird },
                          { label: 'Fouls (Def 3rd)', value: player.foulsInDefensiveThird },
                        ].map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground">{stat.label}</span>
                            <span className="font-semibold text-sm">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="setpieces" className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        {[
                          { label: 'Corners', value: player.corners, sub: `${player.corners > 0 ? ((player.cornerSuccess / player.corners) * 100).toFixed(1) : 0}% success` },
                          { label: 'Throw Ins', value: player.throwIns, sub: `${player.throwIns > 0 ? ((player.tiSuccess / player.throwIns) * 100).toFixed(1) : 0}% success` },
                          { label: 'Free Kicks', value: player.freeKicks },
                          { label: 'Crosses', value: player.crosses },
                          { label: 'Cut Backs', value: player.cutBacks },
                        ].map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground">{stat.label}</span>
                            <div className="text-right">
                              <span className="font-semibold text-sm">{stat.value}</span>
                              {stat.sub && (
                                <span className="text-xs text-muted-foreground ml-2">({stat.sub})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Efficiency Metrics & Shot Map side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advancedMetrics && (
                  <PlayerEfficiencyMetrics metrics={advancedMetrics} />
                )}
                {playerShots && playerShots.length > 0 && (
                  <PlayerShotMap shots={playerShots} />
                )}
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
                  {passData && <PlayerPassThirdMap passData={passData} />}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advancedStats && (
                  <LostPossessionHeatmap events={advancedStats.possessionLossEvents} />
                )}
                {defensiveEvents && defensiveEvents.length > 0 && (
                  <DefensiveHeatmap events={defensiveEvents} />
                )}
              </div>
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
