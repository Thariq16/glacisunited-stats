import { Navbar } from "@/components/Navbar";
import { PlayerCard } from "@/components/PlayerCard";
import { teams } from "@/data/teamData";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Players() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Players</h1>
          </div>
          <p className="text-muted-foreground">View all players with season aggregate statistics</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Players</TabsTrigger>
            {teams.map((team) => (
              <TabsTrigger key={team.id} value={team.id}>
                {team.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.flatMap(team => 
                team.players.map(player => (
                  <PlayerCard 
                    key={`${team.id}-${player.jerseyNumber}-${player.playerName}`}
                    player={player}
                    teamId={team.id}
                  />
                ))
              )}
            </div>
          </TabsContent>

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
      </main>
    </div>
  );
}
