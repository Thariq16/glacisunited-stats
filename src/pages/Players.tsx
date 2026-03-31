import { useState, useMemo } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnhancedPlayerCard } from "@/components/EnhancedPlayerCard";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { usePlayerStats, MatchFilter } from "@/hooks/usePlayerStats";
import { usePlayerPassEvents } from "@/hooks/usePlayerPassEvents";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Players() {
  const { t } = useTranslation();
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const { data: players, isLoading } = usePlayerStats('glacis-united-fc', matchFilter);
  const { data: passEvents } = usePlayerPassEvents(
    'glacis-united-fc', 
    matchFilter === 'all' ? 'all' : matchFilter === 'last3' ? 'last3' : 'last1'
  );

  const passDataMap = useMemo(() => {
    const map = new Map<string, typeof passEvents extends (infer T)[] ? T : never>();
    passEvents?.forEach(pd => {
      map.set(pd.playerName, pd);
    });
    return map;
  }, [passEvents]);

  const activePlayers = useMemo(() => {
    if (!players) return [];
    return [...players]
      .filter(p => p.minutesPlayed > 0 || p.passCount > 0 || p.goals > 0 || p.tackles > 0)
      .sort((a, b) => parseInt(a.jerseyNumber) - parseInt(b.jerseyNumber));
  }, [players]);

  const tableData = useMemo(() => {
    return [...activePlayers].sort((a, b) => b.passCount - a.passCount);
  }, [activePlayers]);

  const filterSuffix = matchFilter === 'last1' ? ` ${t('players.subtitleLast1')}` 
    : matchFilter === 'last3' ? ` ${t('players.subtitleLast3')}` 
    : matchFilter === 'all' ? ` ${t('players.subtitleAll')}` : '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{t('players.title')}</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            {t('players.subtitle')}{filterSuffix}
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <MatchFilterSelect 
              value={matchFilter} 
              onValueChange={setMatchFilter}
              teamSlug="glacis-united-fc"
            />
            
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'table')}>
              <TabsList>
                <TabsTrigger value="cards">{t('players.cards')}</TabsTrigger>
                <TabsTrigger value="table">{t('players.table')}</TabsTrigger>
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
                    teamId="glacis-united-fc"
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
                      <TableHead>{t('players.player')}</TableHead>
                      <TableHead className="text-right">{t('seasons.passes')}</TableHead>
                      <TableHead className="text-right">{t('players.passPercent')}</TableHead>
                      <TableHead className="text-right">{t('players.forward')}</TableHead>
                      <TableHead className="text-right">{t('players.backward')}</TableHead>
                      <TableHead className="text-right">{t('players.goals')}</TableHead>
                      <TableHead className="text-right">{t('players.minutes')}</TableHead>
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
            <p className="text-muted-foreground">{t('players.noData')}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
