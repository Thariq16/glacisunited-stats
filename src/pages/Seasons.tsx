import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSeasons, useSeasonMatches, Season } from "@/hooks/useSeasons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, ChevronRight, Target, TrendingUp, Shield, Users, Crosshair, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const GLACIS_TEAM_ID = "807c025b-5d48-4738-88f7-0de0229cf1c6";

interface MatchResult {
  id: string;
  match_date: string;
  home_score: number;
  away_score: number;
  home_team_id: string;
  away_team_id: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
}

function useSeasonAnalytics(seasonId: string | undefined) {
  return useQuery({
    queryKey: ["season-analytics", seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      // Fetch matches
      const { data: matches, error: mErr } = await supabase
        .from("matches")
        .select(
          "id, home_score, away_score, home_team_id, away_team_id, match_date, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)"
        )
        .eq("season_id", seasonId!)
        .order("match_date", { ascending: true });
      if (mErr) throw mErr;
      if (!matches || matches.length === 0) return null;

      const typedMatches = matches as unknown as MatchResult[];

      // Compute match-by-match stats
      let wins = 0,
        draws = 0,
        losses = 0,
        goalsFor = 0,
        goalsAgainst = 0;
      const formData: {
        opponent: string;
        gf: number;
        ga: number;
        result: "W" | "D" | "L";
        date: string;
        matchId: string;
      }[] = [];

      typedMatches.forEach((m) => {
        const isHome = m.home_team_id === GLACIS_TEAM_ID;
        const gf = isHome ? m.home_score : m.away_score;
        const ga = isHome ? m.away_score : m.home_score;
        const opponent = isHome
          ? (m.away_team as any)?.name || "Away"
          : (m.home_team as any)?.name || "Home";
        goalsFor += gf;
        goalsAgainst += ga;
        const result = gf > ga ? "W" : gf === ga ? "D" : "L";
        if (result === "W") wins++;
        else if (result === "D") draws++;
        else losses++;
        formData.push({
          opponent: opponent.length > 12 ? opponent.substring(0, 12) + "…" : opponent,
          gf,
          ga,
          result: result as "W" | "D" | "L",
          date: format(new Date(m.match_date), "MMM d"),
          matchId: m.id,
        });
      });

      // Fetch top scorers from player_match_stats
      const matchIds = typedMatches.map((m) => m.id);
      const { data: playerStats } = await supabase
        .from("player_match_stats")
        .select("player_id, goals, shots_attempted, shots_on_target, successful_pass, pass_count, tackles, clearance, match_id, player:players(name, jersey_number, role, team_id)")
        .in("match_id", matchIds);

      // Aggregate per player (only Glacis)
      const playerAgg: Record<
        string,
        {
          name: string;
          jersey: number;
          role: string;
          goals: number;
          shots: number;
          sot: number;
          passes: number;
          passAttempts: number;
          tackles: number;
          clearances: number;
          matchesPlayed: Set<string>;
        }
      > = {};

      (playerStats || []).forEach((ps: any) => {
        const p = ps.player;
        if (!p || p.team_id !== GLACIS_TEAM_ID) return;
        const key = ps.player_id;
        if (!playerAgg[key]) {
          playerAgg[key] = {
            name: p.name,
            jersey: p.jersey_number,
            role: p.role || "?",
            goals: 0,
            shots: 0,
            sot: 0,
            passes: 0,
            passAttempts: 0,
            tackles: 0,
            clearances: 0,
            matchesPlayed: new Set(),
          };
        }
        playerAgg[key].goals += ps.goals || 0;
        playerAgg[key].shots += ps.shots_attempted || 0;
        playerAgg[key].sot += ps.shots_on_target || 0;
        playerAgg[key].passes += ps.successful_pass || 0;
        playerAgg[key].passAttempts += ps.pass_count || 0;
        playerAgg[key].tackles += ps.tackles || 0;
        playerAgg[key].clearances += ps.clearance || 0;
        playerAgg[key].matchesPlayed.add(ps.match_id);
      });

      const allPlayers = Object.values(playerAgg).map((p) => ({
        ...p,
        matches: p.matchesPlayed.size,
        passAccuracy: p.passAttempts > 0 ? Math.round((p.passes / p.passAttempts) * 100) : 0,
      }));

      const topScorers = [...allPlayers].filter((p) => p.goals > 0).sort((a, b) => b.goals - a.goals);
      const topShooters = [...allPlayers].filter((p) => p.shots > 0).sort((a, b) => b.shots - a.shots).slice(0, 5);
      const topPassers = [...allPlayers].filter((p) => p.passAttempts > 0).sort((a, b) => b.passes - a.passes).slice(0, 5);
      const topDefenders = [...allPlayers].filter((p) => (p.tackles + p.clearances) > 0).sort((a, b) => (b.tackles + b.clearances) - (a.tackles + a.clearances)).slice(0, 5);

      return {
        played: typedMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
        winRate: typedMatches.length > 0 ? Math.round((wins / typedMatches.length) * 100) : 0,
        avgGoalsFor: typedMatches.length > 0 ? (goalsFor / typedMatches.length).toFixed(1) : "0",
        avgGoalsAgainst: typedMatches.length > 0 ? (goalsAgainst / typedMatches.length).toFixed(1) : "0",
        cleanSheets: formData.filter((f) => f.ga === 0).length,
        formData,
        topScorers,
        topShooters,
        topPassers,
        topDefenders,
        allPlayers,
      };
    },
  });
}

function SeasonAnalytics({ season }: { season: Season }) {
  const { data: stats, isLoading } = useSeasonAnalytics(season.id);
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading)
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  if (!stats) return null;

  const resultColor = (r: "W" | "D" | "L") =>
    r === "W" ? "bg-green-500/20 text-green-400 border-green-500/30" : r === "D" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t("seasons.played"), value: stats.played, icon: Calendar },
          { label: t("seasons.record"), value: `${stats.wins}${t("common.win")} ${stats.draws}${t("common.draw")} ${stats.losses}${t("common.loss")}`, icon: Trophy },
          { label: t("seasons.points"), value: stats.points, icon: Shield },
          { label: t("seasons.goals"), value: `${stats.goalsFor} - ${stats.goalsAgainst}`, icon: Target },
          { label: t("seasons.winRate"), value: `${stats.winRate}%`, icon: TrendingUp },
          { label: t("seasons.cleanSheets"), value: stats.cleanSheets, icon: Shield },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-base font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Averages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Avg {t("seasons.goalsPerMatch")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.avgGoalsFor}</p>
              <p className="text-xs text-muted-foreground">{t("seasons.scored")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.avgGoalsAgainst}</p>
              <p className="text-xs text-muted-foreground">{t("seasons.conceded")}</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.goalDifference >= 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.goalDifference > 0 ? "+" : ""}
                {stats.goalDifference}
              </p>
              <p className="text-xs text-muted-foreground">Goal Diff</p>
            </div>
          </CardContent>
        </Card>

        {/* Form Strip */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("seasons.form")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1.5 flex-wrap">
              {stats.formData.map((f, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/match/${f.matchId}`)}
                  className={`w-9 h-9 rounded-md border text-xs font-bold flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${resultColor(f.result)}`}
                  title={`${f.date}: ${f.opponent} (${f.gf}-${f.ga})`}
                >
                  {f.result === "W" ? t("common.win") : f.result === "D" ? t("common.draw") : t("common.loss")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Per Match Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Goals Per Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.formData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]) return `vs ${(payload[0].payload as any).opponent}`;
                    return "";
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gf" name="Goals For" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ga" name="Goals Against" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Goals Trend */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Cumulative Goals Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.formData.reduce(
                  (acc, f, i) => {
                    const prev = i > 0 ? acc[i - 1] : { cumGF: 0, cumGA: 0 };
                    acc.push({ ...f, cumGF: prev.cumGF + f.gf, cumGA: prev.cumGA + f.ga });
                    return acc;
                  },
                  [] as (typeof stats.formData[0] & { cumGF: number; cumGA: number })[]
                )}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cumGF" name="Goals Scored" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cumGA" name="Goals Conceded" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Scorers & Top Shooters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" />
              Top Scorers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topScorers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No goals recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Player</TableHead>
                    <TableHead className="text-xs text-center">Goals</TableHead>
                    <TableHead className="text-xs text-center">Matches</TableHead>
                    <TableHead className="text-xs text-center">Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topScorers.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.jersey}</TableCell>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-center font-bold text-primary">{p.goals}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">{p.matches}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">
                        {(p.goals / p.matches).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Top Shooters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topShooters.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No shot data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Player</TableHead>
                    <TableHead className="text-xs text-center">Shots</TableHead>
                    <TableHead className="text-xs text-center">On Target</TableHead>
                    <TableHead className="text-xs text-center">Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topShooters.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.jersey}</TableCell>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-center font-bold">{p.shots}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">{p.sot}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">
                        {p.shots > 0 ? Math.round((p.sot / p.shots) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Passers & Top Defenders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Top Passers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topPassers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No pass data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Player</TableHead>
                    <TableHead className="text-xs text-center">Completed</TableHead>
                    <TableHead className="text-xs text-center">Attempted</TableHead>
                    <TableHead className="text-xs text-center">Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topPassers.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.jersey}</TableCell>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-center font-bold text-primary">{p.passes}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">{p.passAttempts}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">{p.passAccuracy}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Top Defenders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topDefenders.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No defensive data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Player</TableHead>
                    <TableHead className="text-xs text-center">Tackles</TableHead>
                    <TableHead className="text-xs text-center">Clearances</TableHead>
                    <TableHead className="text-xs text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topDefenders.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.jersey}</TableCell>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">{p.tackles}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">{p.clearances}</TableCell>
                      <TableCell className="text-xs text-center font-bold text-primary">{p.tackles + p.clearances}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match Results List */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Match Results
        </h3>
        <div className="space-y-2">
          {stats.formData.map((f, i) => (
            <Card
              key={i}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/match/${f.matchId}`)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{f.date}</span>
                  <span className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center border ${resultColor(f.result)}`}>
                    {f.result}
                  </span>
                  <span className="text-sm text-foreground">{f.opponent}</span>
                  <span className="text-sm font-bold text-foreground ml-auto mr-2">
                    {f.gf} - {f.ga}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Seasons() {
  const { data: seasons, isLoading } = useSeasons();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeSeasonId = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const active = seasons.find((s) => s.status === "active");
    return active?.id || seasons[0].id;
  }, [seasons]);

  const currentExpanded = expandedId ?? activeSeasonId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Seasons</h1>
          </div>
          <p className="text-muted-foreground">Browse match results, stats, and analytics by season</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !seasons || seasons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No seasons available yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {seasons.map((season) => {
              const isExpanded = currentExpanded === season.id;
              return (
                <div key={season.id}>
                  <Card
                    className={`cursor-pointer transition-colors ${isExpanded ? "border-primary" : "hover:border-primary/50"}`}
                    onClick={() => setExpandedId(isExpanded ? null : season.id)}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-6 w-6 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">{season.name}</h3>
                            <Badge variant={season.status === "active" ? "default" : "secondary"}>
                              {season.status === "active" ? "Current" : "Completed"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(season.start_date), "MMM yyyy")} —{" "}
                            {format(new Date(season.end_date), "MMM yyyy")}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </CardContent>
                  </Card>

                  {isExpanded && (
                    <div className="mt-4 pl-2">
                      <SeasonAnalytics season={season} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
