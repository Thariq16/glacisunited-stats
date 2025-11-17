import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlayerCard } from "@/components/PlayerCard";
import { teams } from "@/data/teamData";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Players() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Players</h1>
          </div>
          <p className="text-muted-foreground">View all players with season aggregate statistics</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Opposition Players</h2>
          
          <Tabs defaultValue="europa-point" className="w-full">
            <TabsList className="mb-6">
              {teams.map((team) => (
                <TabsTrigger key={team.id} value={team.id}>
                  {team.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {teams.map((team) => (
              <TabsContent key={team.id} value={team.id}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.players.map(player => (
                    <PlayerCard 
                      key={`${player.jerseyNumber}-${player.playerName}`}
                      player={player}
                      teamId={team.id}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
