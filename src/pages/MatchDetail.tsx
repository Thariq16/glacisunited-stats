import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, MapPin, BarChart3, MessageSquare, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlayerCard } from "@/components/PlayerCard";
import { MatchStatsTable } from "@/components/MatchStatsTable";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchComments } from "@/components/MatchComments";
import { MatchVisualizationsTab } from "@/components/match-visualizations/MatchVisualizationsTab";
import { useAuth } from "@/hooks/useAuth";

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: match, isLoading, error } = useMatchDetail(matchId);
  const { isAdmin, isCoach } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);

  const showTabs = isAdmin || isCoach;

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

  const homeTeam = match.home_team as { id: string; name: string; slug: string } | null;
  const awayTeam = match.away_team as { id: string; name: string; slug: string } | null;

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
              <Badge variant="outline" className="text-lg py-1 px-3">{match.competition || 'Match'}</Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(match.match_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4 mb-6">
              <div className="text-right">
                <h2 className="text-2xl font-bold text-foreground mb-2">{homeTeam?.name || 'Home Team'}</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTeam('home')}
                >
                  View Players
                </Button>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-5xl font-bold text-foreground">{match.home_score}</span>
                  <span className="text-3xl text-muted-foreground">-</span>
                  <span className="text-5xl font-bold text-foreground">{match.away_score}</span>
                </div>
              </div>
              
              <div className="text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">{awayTeam?.name || 'Away Team'}</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTeam('away')}
                >
                  View Players
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {match.venue || 'TBD'}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for coaches and admins, otherwise just show stats */}
        {showTabs ? (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overall</span> Statistics
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
              <h2 className="text-2xl font-bold text-foreground">Overall Match Statistics</h2>
              <MatchStatsTable 
                homeTeam={homeTeam?.name || 'Home Team'}
                awayTeam={awayTeam?.name || 'Away Team'}
                homePlayers={match.homePlayers}
                awayPlayers={match.awayPlayers}
              />
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
            <h2 className="text-2xl font-bold text-foreground">Overall Match Statistics</h2>
            <MatchStatsTable 
              homeTeam={homeTeam?.name || 'Home Team'}
              awayTeam={awayTeam?.name || 'Away Team'}
              homePlayers={match.homePlayers}
              awayPlayers={match.awayPlayers}
            />
          </div>
        )}

        {/* Player Performance Modal */}
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTeam === 'home' ? homeTeam?.name : awayTeam?.name} - Player Performances
              </DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {(selectedTeam === 'home' ? match.homePlayers : match.awayPlayers).map((player) => (
                <PlayerCard 
                  key={`${player.jerseyNumber}-${player.playerName}`}
                  player={player}
                  teamId={selectedTeam === 'home' ? homeTeam?.slug : awayTeam?.slug}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
