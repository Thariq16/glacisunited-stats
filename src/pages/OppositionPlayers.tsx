import { Navbar } from "@/components/Navbar";
import { PlayerCard } from "@/components/PlayerCard";
import { teams } from "@/data/teamData";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OppositionPlayers() {
  const oppositionTeams = teams.filter(team => team.id !== 'glacis-united');
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Opposition Players</h1>
          </div>
          <p className="text-muted-foreground">Browse all opposition players with detailed statistics</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Players</TabsTrigger>
            {oppositionTeams.map((team) => (
              <TabsTrigger key={team.id} value={team.id}>
                {team.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oppositionTeams.flatMap(team => 
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

          {oppositionTeams.map((team) => (
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
