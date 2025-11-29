import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMatches } from "@/hooks/usePlayerStats";
import { MatchCard } from "@/components/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const navigate = useNavigate();
  const { data: matches, isLoading } = useMatches();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Statistics Dashboard
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
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {matches?.slice(0, 2).map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
