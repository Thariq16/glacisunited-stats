import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerCard } from "@/components/PlayerCard";
import { MatchFilterTabs } from "@/components/MatchFilterTabs";
import { usePlayerStats, MatchFilter } from "@/hooks/usePlayerStats";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Players() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const { data: players, isLoading } = usePlayerStats('glacis-united', matchFilter);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Glacis United Players</h1>
          </div>
          <p className="text-muted-foreground mb-6">View all Glacis United players with aggregate statistics</p>
          
          <MatchFilterTabs value={matchFilter} onValueChange={setMatchFilter} />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players?.map(player => (
              <PlayerCard 
                key={`${player.jerseyNumber}-${player.playerName}`}
                player={player}
                teamId="glacis-united"
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
