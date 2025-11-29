import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatCard } from "@/components/StatCard";
import { PlayerCard } from "@/components/PlayerCard";
import { useTeamWithPlayers } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, TrendingUp, Shield, Users, Activity } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamStats() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { data: team, isLoading, error } = useTeamWithPlayers(teamId);

  const teamStats = useMemo(() => {
    if (!team || !team.players) return null;

    const totalGoals = team.players.reduce((sum, p) => sum + p.goals, 0);
    const totalPasses = team.players.reduce((sum, p) => sum + p.passCount, 0);
    const totalSuccessfulPasses = team.players.reduce((sum, p) => sum + p.successfulPass, 0);
    const passAccuracy = totalPasses > 0 ? ((totalSuccessfulPasses / totalPasses) * 100).toFixed(1) : '0';
    const totalTackles = team.players.reduce((sum, p) => sum + p.tackles, 0);
    const totalShots = team.players.reduce((sum, p) => sum + p.shotsAttempted, 0);
    const totalShotsOnTarget = team.players.reduce((sum, p) => sum + p.shotsOnTarget, 0);

    return {
      totalGoals,
      totalPasses,
      passAccuracy,
      totalTackles,
      totalShots,
      totalShotsOnTarget,
      playerCount: team.players.length,
    };
  }, [team]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !team || !teamStats) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Team not found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{team.name}</h1>
          <p className="text-muted-foreground">Complete team performance overview</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <StatCard
            title="Total Goals"
            value={teamStats.totalGoals}
            icon={Target}
          />
          <StatCard
            title="Total Passes"
            value={teamStats.totalPasses}
            icon={TrendingUp}
          />
          <StatCard
            title="Pass Accuracy"
            value={`${teamStats.passAccuracy}%`}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Tackles"
            value={teamStats.totalTackles}
            icon={Shield}
          />
          <StatCard
            title="Shots"
            value={teamStats.totalShots}
            icon={Activity}
          />
          <StatCard
            title="On Target"
            value={teamStats.totalShotsOnTarget}
            icon={Target}
          />
          <StatCard
            title="Players"
            value={teamStats.playerCount}
            icon={Users}
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Players</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.players.map((player) => (
              <PlayerCard 
                key={`${player.jerseyNumber}-${player.playerName}`}
                player={player}
                teamId={team.slug}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
