import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { MatchScoreHeader } from "@/components/MatchScoreHeader";
import { useMatchXGStats } from "@/hooks/useMatchXGStats";

function LatestMatchPreview() {
  const { data: match, isLoading } = useQuery({
    queryKey: ["hero-latest-match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          venue,
          competition,
          status,
          home_team_id,
          away_team_id,
          home_team:teams!matches_home_team_id_fkey(id, name, slug),
          away_team:teams!matches_away_team_id_fkey(id, name, slug)
        `)
        .eq("status", "completed")
        .order("match_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: xgStats } = useMatchXGStats(
    match?.id,
    match?.home_team_id ?? undefined,
    match?.away_team_id ?? undefined,
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (!match) return null;

  return (
    <MatchScoreHeader
      homeTeam={match.home_team as any}
      awayTeam={match.away_team as any}
      homeScore={match.home_score ?? 0}
      awayScore={match.away_score ?? 0}
      competition={match.competition ?? undefined}
      matchDate={match.match_date}
      venue={match.venue ?? undefined}
      xgStats={xgStats ?? null}
      onViewHomePlayers={() => {}}
      onViewAwayPlayers={() => {}}
    />
  );
}

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-up">
          Professional match analysis for semi-pro football clubs
        </h1>
        <p className="text-lg text-muted-foreground animate-fade-up-delay-1">
          Submit your match video. Our analyst tags every event. You get a full
          data dashboard within 48 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up-delay-2">
          <Button asChild size="lg">
            <Link to="/submit">Submit a Match →</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/org/glacis-united">See a live example</Link>
          </Button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto">
        <LatestMatchPreview />
      </div>
    </section>
  );
}
