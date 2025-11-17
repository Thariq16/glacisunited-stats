import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerCard } from "@/components/PlayerCard";
import { teams } from "@/data/teamData";
import { Users } from "lucide-react";

export default function Players() {
  const glacisUnited = teams.find(team => team.id === 'glacis-united');
  
  if (!glacisUnited) return null;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Glacis United Players</h1>
          </div>
          <p className="text-muted-foreground">View all Glacis United players with season aggregate statistics</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {glacisUnited.players.map(player => (
            <PlayerCard 
              key={`${player.jerseyNumber}-${player.playerName}`}
              player={player}
              teamId={glacisUnited.id}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
