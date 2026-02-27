import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, MessageSquare, TrendingUp, Flag } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MatchPlayerCard } from "@/components/MatchPlayerCard";
import { MatchStatsCards } from "@/components/MatchStatsCards";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchComments } from "@/components/MatchComments";
import { MatchVisualizationsTab } from "@/components/match-visualizations/MatchVisualizationsTab";
import { useAuth } from "@/hooks/useAuth";
import { useMatchXGStats } from "@/hooks/useMatchXGStats";
import { MatchScoreHeader } from "@/components/MatchScoreHeader";
import { MatchQuickStats } from "@/components/MatchQuickStats";
import { PlayerStats } from "@/utils/parseCSV";
import { SetPieceAnalyticsTab } from "@/components/set-piece-analytics";
import { usePrimaryTeam } from "@/hooks/usePrimaryTeam";

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: match, isLoading, error } = useMatchDetail(matchId);
  const { isAdmin, isCoach } = useAuth();
  const { teamSlug: primaryTeamSlug } = usePrimaryTeam();
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);

  // Extract team info for xG query
  const homeTeam = match?.home_team as { id: string; name: string; slug: string } | null;
  const awayTeam = match?.away_team as { id: string; name: string; slug: string } | null;

  // Fetch xG stats for the match
  const { data: xgStats } = useMatchXGStats(matchId, homeTeam?.id, awayTeam?.id);

  const showTabs = isAdmin || isCoach;

  // Helper to calculate contribution score and sort players
  const getSortedPlayers = (players: PlayerStats[]) => {
    return [...players].sort((a, b) => {
      const scoreA = a.goals * 10 + a.shotsOnTarget * 2 + a.tackles * 2 +
        (a.passCount > 0 ? (a.successfulPass / a.passCount) * 5 : 0);
      const scoreB = b.goals * 10 + b.shotsOnTarget * 2 + b.tackles * 2 +
        (b.passCount > 0 ? (b.successfulPass / b.passCount) * 5 : 0);
      return scoreB - scoreA;
    });
  };

  // Get sorted players for the selected team
  const sortedPlayers = useMemo(() => {
    if (!match || !selectedTeam) return [];
    const players = selectedTeam === 'home' ? match.homePlayers : match.awayPlayers;
    return getSortedPlayers(players);
  }, [match, selectedTeam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !match) {
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
        <MatchScoreHeader
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeScore={match.home_score}
          awayScore={match.away_score}
          competition={match.competition}
          matchDate={match.match_date}
          venue={match.venue}
          xgStats={xgStats}
          primaryTeamSlug={primaryTeamSlug}
          onViewHomePlayers={() => setSelectedTeam('home')}
          onViewAwayPlayers={() => setSelectedTeam('away')}
        />

        {/* Quick Stats Summary */}
        <MatchQuickStats
          homePlayers={match.homePlayers}
          awayPlayers={match.awayPlayers}
          homeTeam={homeTeam?.name || 'Home Team'}
          awayTeam={awayTeam?.name || 'Away Team'}
          xgStats={xgStats}
        />

        {/* Tabs for coaches and admins, otherwise just show stats */}
        {showTabs ? (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overall</span> Statistics
              </TabsTrigger>
              <TabsTrigger value="set-pieces" className="gap-2">
                <Flag className="h-4 w-4" />
                <span className="hidden sm:inline">Set</span> Pieces
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="visualizations" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Visualizations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              <MatchStatsCards
                homeTeam={homeTeam?.name || 'Home Team'}
                awayTeam={awayTeam?.name || 'Away Team'}
                homePlayers={match.homePlayers}
                awayPlayers={match.awayPlayers}
                xgStats={xgStats}
              />
            </TabsContent>

            <TabsContent value="set-pieces" className="space-y-6">
              {(() => {
                const isPrimaryHome = primaryTeamSlug && homeTeam?.slug === primaryTeamSlug;
                const ownTeam = isPrimaryHome ? homeTeam : awayTeam;
                const oppositionTeam = isPrimaryHome ? awayTeam : homeTeam;
                return (
                  <Tabs defaultValue="own" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="own">{ownTeam?.name || 'Own Team'}</TabsTrigger>
                      <TabsTrigger value="opponent">{oppositionTeam?.name || 'Opposition'}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="own">
                      {ownTeam && (
                        <SetPieceAnalyticsTab
                          matchId={matchId!}
                          teamId={ownTeam.id}
                          teamName={ownTeam.name}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="opponent">
                      {oppositionTeam && (
                        <SetPieceAnalyticsTab
                          matchId={matchId!}
                          teamId={oppositionTeam.id}
                          teamName={oppositionTeam.name}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                );
              })()}
            </TabsContent>

            <TabsContent value="notes">
              <MatchComments matchId={matchId!} />
            </TabsContent>

            <TabsContent value="visualizations">
              <MatchVisualizationsTab
                matchId={matchId!}
                homeTeamId={homeTeam?.id}
                awayTeamId={awayTeam?.id}
                homeTeamName={homeTeam?.name || 'Home Team'}
                awayTeamName={awayTeam?.name || 'Away Team'}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <MatchStatsCards
              homeTeam={homeTeam?.name || 'Home Team'}
              awayTeam={awayTeam?.name || 'Away Team'}
              homePlayers={match.homePlayers}
              awayPlayers={match.awayPlayers}
              xgStats={xgStats}
            />
          </div>
        )}

        {/* Player Performance Modal */}
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTeam === 'home' ? homeTeam?.name : awayTeam?.name} - Player Performances
                <span className="text-sm text-muted-foreground font-normal">
                  (sorted by contribution)
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {sortedPlayers.map((player, index) => (
                <MatchPlayerCard
                  key={`${player.jerseyNumber}-${player.playerName}`}
                  player={player}
                  teamId={selectedTeam === 'home' ? homeTeam?.slug : awayTeam?.slug}
                  isTopPerformer={index === 0}
                  rank={index + 1}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
