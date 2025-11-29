import { useState, useMemo } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllMatches } from "@/hooks/usePlayerStats";
import { useComparisonStats } from "@/hooks/useComparisonStats";
import { GitCompare, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

export default function PlayerComparison() {
  const [match1Id, setMatch1Id] = useState<string>('');
  const [match2Id, setMatch2Id] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  const { data: matches, isLoading: matchesLoading } = useAllMatches();
  const { data: comparison, isLoading: comparisonLoading } = useComparisonStats(match1Id, match2Id, selectedTeam);

  const teams = useMemo(() => {
    if (!matches) return [];
    const teamMap = new Map<string, { id: string; name: string; slug: string }>();
    matches.forEach(match => {
      if (match.home_team) {
        teamMap.set(match.home_team.slug, match.home_team);
      }
      if (match.away_team) {
        teamMap.set(match.away_team.slug, match.away_team);
      }
    });
    return Array.from(teamMap.values());
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (!matches || !selectedTeam) return matches || [];
    return matches.filter(m => 
      m.home_team?.slug === selectedTeam || m.away_team?.slug === selectedTeam
    );
  }, [matches, selectedTeam]);

  const match1 = matches?.find(m => m.id === match1Id);
  const match2 = matches?.find(m => m.id === match2Id);

  // Render diff: positive = Match 1 higher, negative = Match 2 higher
  const renderDiff = (val1: number, val2: number) => {
    const diff = val1 - val2;
    if (diff > 0) return (
      <span className="text-primary flex items-center gap-1">
        <ArrowUp className="h-3 w-3" />
        <span className="font-medium">M1</span>
        <span>+{diff}</span>
      </span>
    );
    if (diff < 0) return (
      <span className="text-accent-foreground flex items-center gap-1">
        <ArrowUp className="h-3 w-3" />
        <span className="font-medium">M2</span>
        <span>+{Math.abs(diff)}</span>
      </span>
    );
    return <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" />Same</span>;
  };

  const StatBox = ({ label, val1, val2 }: { label: string; val1: number | string; val2: number | string }) => (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className="font-bold text-primary">{val1}</span>
        <span className="text-muted-foreground text-xs">vs</span>
        <span className="font-bold text-accent-foreground">{val2}</span>
      </div>
      <div className="text-xs mt-1 flex justify-center">
        {renderDiff(Number(val1), Number(val2))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GitCompare className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Match Comparison</h1>
          </div>
          <p className="text-muted-foreground">Compare player performance across two different matches</p>
        </div>

        {/* Selection Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Matches to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Team Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Filter by Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.slug} value={team.slug}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Match 1 */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Match 1</label>
                <Select value={match1Id} onValueChange={setMatch1Id}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select first match" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {matchesLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      filteredMatches?.map(match => (
                        <SelectItem key={match.id} value={match.id} disabled={match.id === match2Id}>
                          <div className="flex flex-col">
                            <span>{match.home_team?.name} vs {match.away_team?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(match.match_date), 'MMM d, yyyy')} • {match.home_score}-{match.away_score}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Match 2 */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Match 2</label>
                <Select value={match2Id} onValueChange={setMatch2Id}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select second match" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {matchesLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      filteredMatches?.map(match => (
                        <SelectItem key={match.id} value={match.id} disabled={match.id === match1Id}>
                          <div className="flex flex-col">
                            <span>{match.home_team?.name} vs {match.away_team?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(match.match_date), 'MMM d, yyyy')} • {match.home_score}-{match.away_score}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Matches Summary */}
        {match1 && match2 && (
          <div className="space-y-4 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-primary/50">
                <CardContent className="pt-4">
                  <Badge className="mb-2 bg-primary text-primary-foreground">M1</Badge>
                  <h3 className="font-semibold">{match1.home_team?.name} vs {match1.away_team?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match1.match_date), 'MMMM d, yyyy')} • Score: {match1.home_score}-{match1.away_score}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-accent/50">
                <CardContent className="pt-4">
                  <Badge variant="secondary" className="mb-2">M2</Badge>
                  <h3 className="font-semibold">{match2.home_team?.name} vs {match2.away_team?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(match2.match_date), 'MMMM d, yyyy')} • Score: {match2.home_score}-{match2.away_score}
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Difference shows which match has the higher value (M1↑ = Match 1 higher, M2↑ = Match 2 higher)
            </p>
          </div>
        )}

        {/* Comparison Results */}
        {!match1Id || !match2Id ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Select two matches above to compare player statistics
              </p>
            </CardContent>
          </Card>
        ) : comparisonLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : comparison && comparison.length > 0 ? (
          <div className="space-y-4">
            {comparison.map((player) => (
              <Card key={player.playerId} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{player.jerseyNumber}</Badge>
                      <CardTitle className="text-lg">{player.playerName}</CardTitle>
                      {player.role && <Badge variant="secondary">{player.role}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">{player.teamName}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="attacking">Attacking</TabsTrigger>
                      <TabsTrigger value="defensive">Defensive</TabsTrigger>
                      <TabsTrigger value="setpieces">Set Pieces</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <StatBox label="Goals" val1={player.match1Stats.goals} val2={player.match2Stats.goals} />
                        <StatBox label="Passes" val1={player.match1Stats.passCount} val2={player.match2Stats.passCount} />
                        <StatBox label="Pass Accuracy" val1={`${player.match1Stats.passAccuracy}%`} val2={`${player.match2Stats.passAccuracy}%`} />
                        <StatBox label="Shots" val1={player.match1Stats.shots} val2={player.match2Stats.shots} />
                        <StatBox label="Shots on Target" val1={player.match1Stats.shotsOnTarget} val2={player.match2Stats.shotsOnTarget} />
                        <StatBox label="Fouls" val1={player.match1Stats.fouls} val2={player.match2Stats.fouls} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="attacking">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <StatBox label="Pen. Area Entry" val1={player.match1Stats.penaltyAreaEntry} val2={player.match2Stats.penaltyAreaEntry} />
                        <StatBox label="Pen. Area Pass" val1={player.match1Stats.penaltyAreaPass} val2={player.match2Stats.penaltyAreaPass} />
                        <StatBox label="Crosses" val1={player.match1Stats.crosses} val2={player.match2Stats.crosses} />
                        <StatBox label="Cut Backs" val1={player.match1Stats.cutBacks} val2={player.match2Stats.cutBacks} />
                        <StatBox label="Shots" val1={player.match1Stats.shots} val2={player.match2Stats.shots} />
                        <StatBox label="Shots on Target" val1={player.match1Stats.shotsOnTarget} val2={player.match2Stats.shotsOnTarget} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="defensive">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <StatBox label="Tackles" val1={player.match1Stats.tackles} val2={player.match2Stats.tackles} />
                        <StatBox label="Saves" val1={player.match1Stats.saves} val2={player.match2Stats.saves} />
                        <StatBox label="Aerial Won" val1={player.match1Stats.aerialDuelsWon} val2={player.match2Stats.aerialDuelsWon} />
                        <StatBox label="Aerial Lost" val1={player.match1Stats.aerialDuelsLost} val2={player.match2Stats.aerialDuelsLost} />
                        <StatBox label="Fouls" val1={player.match1Stats.fouls} val2={player.match2Stats.fouls} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="setpieces">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <StatBox label="Corners" val1={player.match1Stats.corners} val2={player.match2Stats.corners} />
                        <StatBox label="Corner Success" val1={player.match1Stats.cornerSuccess} val2={player.match2Stats.cornerSuccess} />
                        <StatBox label="Free Kicks" val1={player.match1Stats.freeKicks} val2={player.match2Stats.freeKicks} />
                        <StatBox label="Throw-ins" val1={player.match1Stats.throwIns} val2={player.match2Stats.throwIns} />
                        <StatBox label="Throw-in Success" val1={player.match1Stats.tiSuccess} val2={player.match2Stats.tiSuccess} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No players found in both selected matches. Try selecting different matches or a specific team.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
