import { useState, useMemo } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnhancedPlayerCard } from "@/components/EnhancedPlayerCard";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { usePlayerStats, MatchFilter } from "@/hooks/usePlayerStats";
import { usePlayerPassEvents } from "@/hooks/usePlayerPassEvents";
import { usePrimaryTeam } from "@/hooks/usePrimaryTeam";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Players() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const { teamSlug, teamName } = usePrimaryTeam();
  
  const { data: players, isLoading } = usePlayerStats(teamSlug || '', matchFilter);
  const { data: passEvents } = usePlayerPassEvents(
    teamSlug || '', 
    matchFilter === 'all' ? 'all' : matchFilter === 'last3' ? 'last3' : 'last1'
  );

  // Create a map of pass data by player name for quick lookup
  const passDataMap = useMemo(() => {
    const map = new Map<string, typeof passEvents extends (infer T)[] ? T : never>();
    passEvents?.forEach(pd => {
      map.set(pd.playerName, pd);
    });
    return map;
  }, [passEvents]);

  // Filter to only show players who played (have minutes or stats) and sort by jersey
  const activePlayers = useMemo(() => {
    if (!players) return [];
    return [...players]
      .filter(p => p.minutesPlayed > 0 || p.passCount > 0 || p.goals > 0 || p.tackles > 0)
      .sort((a, b) => parseInt(a.jerseyNumber) - parseInt(b.jerseyNumber));
  }, [players]);

  // For table view, sort by passes (descending) by default
  const tableData = useMemo(() => {
    return [...activePlayers].sort((a, b) => b.passCount - a.passCount);
  }, [activePlayers]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{teamName} Players</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            View player statistics with pass visualizations
            {matchFilter === 'last1' && ' for the last match'}
            {matchFilter === 'last3' && ' for the last 3 matches'}
            {matchFilter === 'all' && ' for all matches'}
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <MatchFilterSelect 
              value={matchFilter} 
              onValueChange={setMatchFilter}
              teamSlug={teamSlug}
            />
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'table')}>
              <TabsList>
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : activePlayers.length > 0 ? (
          <>
            {viewMode === 'cards' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePlayers.map(player => (
                  <EnhancedPlayerCard 
                    key={`${player.jerseyNumber}-${player.playerName}`}
                    player={player}
                    teamId={teamSlug}
                    passData={passDataMap.get(player.playerName)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Passes</TableHead>
                      <TableHead className="text-right">Pass %</TableHead>
                      <TableHead className="text-right">Forward</TableHead>
                      <TableHead className="text-right">Backward</TableHead>
                      <TableHead className="text-right">Goals</TableHead>
                      <TableHead className="text-right">Minutes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map(player => {
                      const successRate = player.passCount > 0 
                        ? ((player.successfulPass / player.passCount) * 100).toFixed(0)
                        : '0';
                      return (
                        <TableRow key={`${player.jerseyNumber}-${player.playerName}`}>
                          <TableCell className="font-medium">{player.jerseyNumber}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{player.playerName}</span>
                              {player.role && (
                                <span className="text-xs text-muted-foreground ml-2">({player.role})</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{player.passCount}</TableCell>
                          <TableCell className="text-right">{successRate}%</TableCell>
                          <TableCell className="text-right">{player.forwardPass}</TableCell>
                          <TableCell className="text-right">{player.backwardPass}</TableCell>
                          <TableCell className="text-right font-medium">{player.goals}</TableCell>
                          <TableCell className="text-right">{player.minutesPlayed}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No player data available for the selected filter.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
