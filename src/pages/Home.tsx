import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, Trophy } from "lucide-react";
import { teams } from "@/data/teamData";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Football Statistics Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive player and team performance analytics
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Player Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Detailed statistics for every player
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Team Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Aggregated team performance data
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Match Stats</h3>
              <p className="text-sm text-muted-foreground">
                Complete match performance breakdown
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Select a Team
          </h2>
          <div className="grid gap-4">
            {teams.map((team) => (
              <Card 
                key={team.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  <CardDescription>
                    {team.players.length} players | View complete team statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full">
                    View Team Stats
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
