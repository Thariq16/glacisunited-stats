import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerCard } from "@/components/PlayerCard";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { useOppositionTeams } from "@/hooks/useTeams";
import { MatchFilter } from "@/hooks/usePlayerStats";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function OppositionPlayers() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');
  const { data: oppositionTeams, isLoading } = useOppositionTeams('glacis-united-fc', matchFilter);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Opposition Players</h1>
          </div>
          <p className="text-muted-foreground mb-6">Browse all opposition players with detailed statistics</p>
          
          <MatchFilterSelect 
            value={matchFilter} 
            onValueChange={setMatchFilter}
          />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : oppositionTeams && oppositionTeams.length > 0 ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Players</TabsTrigger>
              {oppositionTeams.map((team) => (
                <TabsTrigger key={team.slug} value={team.slug}>
                  {team.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {oppositionTeams.flatMap(team => 
                  team.players
                    .filter(player => player.passCount > 0 || player.goals > 0 || player.tackles > 0)
                    .map(player => (
                      <PlayerCard 
                        key={`${team.slug}-${player.jerseyNumber}-${player.playerName}`}
                        player={player}
                        teamId={team.slug}
                      />
                    ))
                )}
                {oppositionTeams.every(team => 
                  team.players.every(player => player.passCount === 0 && player.goals === 0 && player.tackles === 0)
                ) && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No player data available for the selected filter.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {oppositionTeams.map((team) => (
              <TabsContent key={team.slug} value={team.slug}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.players
                    .filter(player => player.passCount > 0 || player.goals > 0 || player.tackles > 0)
                    .map(player => (
                      <PlayerCard 
                        key={`${player.jerseyNumber}-${player.playerName}`}
                        player={player}
                        teamId={team.slug}
                      />
                    ))}
                  {team.players.every(player => player.passCount === 0 && player.goals === 0 && player.tackles === 0) && (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No player data available for the selected filter.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No opposition player data available yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
