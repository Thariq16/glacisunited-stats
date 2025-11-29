import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerCard } from "@/components/PlayerCard";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { usePlayerStats, MatchFilter } from "@/hooks/usePlayerStats";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Players() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');
  const { data: players, isLoading } = usePlayerStats('glacis-united-fc', matchFilter);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Glacis United FC Players</h1>
          </div>
          <p className="text-muted-foreground mb-6">View all Glacis United FC players with aggregate statistics</p>
          
          <MatchFilterSelect 
            value={matchFilter} 
            onValueChange={setMatchFilter}
            teamSlug="glacis-united-fc"
          />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : players && players.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map(player => (
              <PlayerCard 
                key={`${player.jerseyNumber}-${player.playerName}`}
                player={player}
                teamId="glacis-united-fc"
              />
            ))}
          </div>
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
