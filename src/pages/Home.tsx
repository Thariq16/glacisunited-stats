import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, Trophy } from "lucide-react";
import { teams } from "@/data/teamData";
import { matches } from "@/data/matchData";
import { MatchCard } from "@/components/MatchCard";
export default function Home() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
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

        

        {/* Recent Matches */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Matches</h2>
            <Button variant="outline" onClick={() => navigate('/matches')}>
              View All Matches
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {matches.slice(0, 2).map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        </div>

        
      </main>
    </div>;
}