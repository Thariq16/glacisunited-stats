import { useState, useMemo } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlayerStats, MatchFilter } from "@/hooks/usePlayerStats";
import { calculateAdvancedMetrics } from "@/utils/playerMetrics";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { Users, Award, TrendingUp, Shield, Target, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SquadAnalysis() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');
  const { data: players, isLoading } = usePlayerStats('glacis-united-fc', matchFilter);

  const squadStats = useMemo(() => {
    if (!players || players.length === 0) return null;

    // Filter out players with no stats for the selected filter
    const activePlayers = players.filter(p => p.passCount > 0 || p.goals > 0 || p.tackles > 0);
    if (activePlayers.length === 0) return null;

    // Position distribution
    const positionCounts: Record<string, number> = {};
    activePlayers.forEach(player => {
      const pos = player.role || 'Unknown';
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    // Calculate team averages
    const totalPlayers = activePlayers.length;
    const avgGoals = activePlayers.reduce((sum, p) => sum + p.goals, 0) / totalPlayers;
    const avgPassAccuracy = activePlayers.reduce((sum, p) => {
      const acc = p.passCount > 0 ? (p.successfulPass / p.passCount) * 100 : 0;
      return sum + acc;
    }, 0) / totalPlayers;
    const avgTackles = activePlayers.reduce((sum, p) => sum + p.tackles, 0) / totalPlayers;

    // Top performers by category
    const topScorer = [...activePlayers].sort((a, b) => b.goals - a.goals)[0];
    const topPasser = [...activePlayers].sort((a, b) => {
      const accA = a.passCount > 0 ? (a.successfulPass / a.passCount) : 0;
      const accB = b.passCount > 0 ? (b.successfulPass / b.passCount) : 0;
      return accB - accA;
    })[0];
    const topDefender = [...activePlayers].sort((a, b) => b.tackles - a.tackles)[0];

    // Calculate best XI based on performance ratings
    const playersWithRatings = activePlayers.map(player => {
      const metrics = calculateAdvancedMetrics(player);
      return { player, rating: metrics.performanceRating };
    }).sort((a, b) => b.rating - a.rating);

    const bestXI = playersWithRatings.slice(0, 11);

    // Squad depth by position
    const positionDepth = Object.entries(positionCounts).map(([position, count]) => ({
      position,
      count,
      depth: count >= 3 ? 'Good' : count >= 2 ? 'Adequate' : 'Weak'
    }));

    return {
      totalPlayers,
      positionCounts,
      positionDepth,
      avgGoals: avgGoals.toFixed(1),
      avgPassAccuracy: avgPassAccuracy.toFixed(1),
      avgTackles: avgTackles.toFixed(1),
      topScorer,
      topPasser,
      topDefender,
      bestXI
    };
  }, [players]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Squad Analysis</h1>
          </div>
          <p className="text-muted-foreground mb-6">Comprehensive team intelligence and composition analysis</p>
          
          <MatchFilterSelect 
            value={matchFilter} 
            onValueChange={setMatchFilter}
            teamSlug="glacis-united-fc"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : squadStats ? (
          <div className="space-y-6">
            {/* Squad Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Squad Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Players</p>
                    <p className="text-3xl font-bold">{squadStats.totalPlayers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Goals</p>
                    <p className="text-3xl font-bold">{squadStats.avgGoals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Pass Accuracy</p>
                    <p className="text-3xl font-bold">{squadStats.avgPassAccuracy}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Tackles</p>
                    <p className="text-3xl font-bold">{squadStats.avgTackles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Position Distribution & Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {squadStats.positionDepth.map(({ position, count, depth }) => (
                    <div key={position} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{position || 'Unknown'}</span>
                        <Badge variant={depth === 'Good' ? 'default' : depth === 'Adequate' ? 'secondary' : 'destructive'}>
                          {depth}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{count} player{count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Top Scorer</h4>
                    </div>
                    <p className="text-lg font-bold">{squadStats.topScorer.playerName}</p>
                    <p className="text-sm text-muted-foreground">#{squadStats.topScorer.jerseyNumber}</p>
                    <p className="text-2xl font-bold text-primary">{squadStats.topScorer.goals} goals</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Best Passer</h4>
                    </div>
                    <p className="text-lg font-bold">{squadStats.topPasser.playerName}</p>
                    <p className="text-sm text-muted-foreground">#{squadStats.topPasser.jerseyNumber}</p>
                    <p className="text-2xl font-bold text-primary">
                      {squadStats.topPasser.passCount > 0 
                        ? ((squadStats.topPasser.successfulPass / squadStats.topPasser.passCount) * 100).toFixed(1)
                        : 0}% accuracy
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Top Defender</h4>
                    </div>
                    <p className="text-lg font-bold">{squadStats.topDefender.playerName}</p>
                    <p className="text-sm text-muted-foreground">#{squadStats.topDefender.jerseyNumber}</p>
                    <p className="text-2xl font-bold text-primary">{squadStats.topDefender.tackles} tackles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best XI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Best XI (By Performance Rating)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {squadStats.bestXI.map(({ player, rating }, index) => (
                    <div key={player.jerseyNumber} className="p-4 border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-semibold">{player.playerName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">#{player.jerseyNumber}</span>
                      </div>
                      {player.role && (
                        <Badge variant="secondary" className="mb-2">{player.role}</Badge>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Rating</span>
                        <span className="text-lg font-bold text-primary">{rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No player data available for the selected filter</p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
