import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Skeleton } from "@/components/ui/skeleton";

interface CountingNumberProps {
  value: number;
  duration?: number;
  start: boolean;
}

function CountingNumber({ value, duration = 1500, start }: CountingNumberProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start || value <= 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing out quad: f(t) = t * (2 - t)
      const easeProgress = progress * (2 - progress);
      
      setCount(Math.floor(easeProgress * (value - startValue) + startValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, start, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export function StatsCounter() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  // 1. Fetch Total Completed Matches
  const { data: matchesCount, isLoading: loadingMatches } = useQuery({
    queryKey: ["stats-matches-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");
      if (error) throw error;
      return count ?? 0;
    },
  });

  // 2. Fetch Total Events Tagged
  const { data: eventsCount, isLoading: loadingEvents } = useQuery({
    queryKey: ["stats-events-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("match_events")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // 3. Fetch Total Players Tracked
  const { data: playersCount, isLoading: loadingPlayers } = useQuery({
    queryKey: ["stats-players-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .or("hidden.is.null,hidden.eq.false");
      if (error) throw error;
      return count ?? 0;
    },
  });

  // 4. Fetch Total Clubs (Organizations)
  const { data: clubsCount, isLoading: loadingClubs } = useQuery({
    queryKey: ["stats-clubs-count"],
    queryFn: async () => {
      // By casting the entire supabase instance to any, we completely bypass strict typing checks
      // and prevent TS2589 "Type instantiation is excessively deep and possibly infinite" errors
      const client = supabase as any;
      try {
        const { count, error } = await client
          .from("organizations")
          .select("*", { count: "exact", head: true })
          .eq("public_profile", true);
        
        if (error) {
          const { count: fallbackCount, error: fallbackError } = await client
            .from("organizations")
            .select("*", { count: "exact", head: true });
          if (fallbackError) throw fallbackError;
          return fallbackCount ?? 0;
        }
        return count ?? 0;
      } catch (err) {
        const { count: fallbackCount } = await client
          .from("organizations")
          .select("*", { count: "exact", head: true });
        return fallbackCount ?? 0;
      }
    },
  });

  const isLoading = loadingMatches || loadingEvents || loadingPlayers || loadingClubs;

  const stats = [
    {
      id: "matches",
      value: matchesCount ?? 0,
      label: "Total matches analyzed",
    },
    {
      id: "events",
      value: eventsCount ?? 0,
      label: "Total events tagged",
    },
    {
      id: "players",
      value: playersCount ?? 0,
      label: "Total players tracked",
    },
    {
      id: "clubs",
      value: clubsCount ?? 0,
      label: "Total clubs",
    },
  ];

  return (
    <section ref={ref} className="w-full py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4">
        <ScrollReveal animation="fade-up" className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            {stats.map((stat) => (
              <div key={stat.id} className="flex flex-col items-center justify-center p-6 bg-background/40 rounded-xl backdrop-blur-sm border border-border/50 shadow-sm hover:border-primary/20 transition-all duration-300">
                {isLoading ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <Skeleton className="h-12 w-28 rounded-md" />
                    <Skeleton className="h-4 w-36 rounded-md" />
                  </div>
                ) : (
                  <>
                    <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                      <CountingNumber value={stat.value} start={isVisible} />
                    </span>
                    <span className="text-sm md:text-base text-muted-foreground font-medium">
                      {stat.label}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
