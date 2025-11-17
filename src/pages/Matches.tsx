import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MatchCard } from "@/components/MatchCard";
import { matches } from "@/data/matchData";
import { Trophy } from "lucide-react";

export default function Matches() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Matches</h1>
          </div>
          <p className="text-muted-foreground">View all match results and statistics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
