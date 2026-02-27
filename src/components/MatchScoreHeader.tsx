import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";

interface MatchScoreHeaderProps {
    homeTeam: { id: string; name: string; slug: string } | null;
    awayTeam: { id: string; name: string; slug: string } | null;
    homeScore: number;
    awayScore: number;
    competition?: string;
    matchDate: string;
    venue?: string;
    primaryTeamSlug?: string;
    xgStats?: {
        home: { totalXG: number; shotCount: number };
        away: { totalXG: number; shotCount: number };
    } | null;
    onViewHomePlayers: () => void;
    onViewAwayPlayers: () => void;
}

type MatchResult = 'win' | 'draw' | 'loss';

function getMatchResult(homeScore: number, awayScore: number, homeTeam: { slug: string } | null, awayTeam: { slug: string } | null, primarySlug?: string): MatchResult {
    // Determine result from primary team's perspective
    const slug = primarySlug || '';
    const isPrimaryHome = homeTeam?.slug === slug;
    const isPrimaryAway = awayTeam?.slug === slug;

    let primaryScore: number;
    let opponentScore: number;

    if (isPrimaryHome) {
        primaryScore = homeScore;
        opponentScore = awayScore;
    } else if (isPrimaryAway) {
        primaryScore = awayScore;
        opponentScore = homeScore;
    } else {
        // Fallback to home perspective if primary team isn't playing
        primaryScore = homeScore;
        opponentScore = awayScore;
    }

    if (primaryScore > opponentScore) return 'win';
    if (primaryScore < opponentScore) return 'loss';
    return 'draw';
}

function getResultGradient(result: MatchResult): string {
    switch (result) {
        case 'win':
            return 'from-emerald-500/20 via-emerald-500/10 to-transparent';
        case 'loss':
            return 'from-rose-500/20 via-rose-500/10 to-transparent';
        case 'draw':
            return 'from-amber-500/20 via-amber-500/10 to-transparent';
    }
}

function getResultBadge(result: MatchResult): { text: string; className: string } {
    switch (result) {
        case 'win':
            return { text: 'WIN', className: 'bg-emerald-500 text-white hover:bg-emerald-600' };
        case 'loss':
            return { text: 'LOSS', className: 'bg-rose-500 text-white hover:bg-rose-600' };
        case 'draw':
            return { text: 'DRAW', className: 'bg-amber-500 text-white hover:bg-amber-600' };
    }
}

export function MatchScoreHeader({
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    competition,
    matchDate,
    venue,
    xgStats,
    onViewHomePlayers,
    onViewAwayPlayers,
}: MatchScoreHeaderProps) {
    const result = getMatchResult(homeScore, awayScore, homeTeam, awayTeam);
    const resultBadge = getResultBadge(result);
    const hasXGData = xgStats && (xgStats.home.shotCount > 0 || xgStats.away.shotCount > 0);

    // Calculate xG bar width percentages
    const totalXG = hasXGData ? xgStats.home.totalXG + xgStats.away.totalXG : 0;
    const homeXGPercent = totalXG > 0 ? (xgStats!.home.totalXG / totalXG) * 100 : 50;
    const awayXGPercent = totalXG > 0 ? (xgStats!.away.totalXG / totalXG) * 100 : 50;

    return (
        <Card className="mb-8 overflow-hidden relative">
            {/* Gradient overlay based on result */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getResultGradient(result)} pointer-events-none`} />

            <CardContent className="p-8 relative">
                {/* Top row: Competition badge, Result badge, and Date */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg py-1 px-4 gap-2">
                            <Trophy className="h-4 w-4" />
                            {competition || 'Match'}
                        </Badge>
                        <Badge className={resultBadge.className}>
                            {resultBadge.text}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                            {new Date(matchDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* Score Section */}
                <div className="grid grid-cols-3 items-center gap-4 mb-6">
                    {/* Home Team */}
                    <div className="text-right space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{homeTeam?.name || 'Home Team'}</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onViewHomePlayers}
                            className="gap-2"
                        >
                            <Users className="h-4 w-4" />
                            View Players
                        </Button>
                    </div>

                    {/* Score */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-4 md:gap-6">
                            <span className="text-5xl md:text-6xl font-bold text-foreground tabular-nums">{homeScore}</span>
                            <span className="text-3xl md:text-4xl text-muted-foreground font-light">-</span>
                            <span className="text-5xl md:text-6xl font-bold text-foreground tabular-nums">{awayScore}</span>
                        </div>

                        {/* xG Comparison Bar */}
                        {hasXGData && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-primary">{xgStats!.home.totalXG.toFixed(2)} xG</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Expected Goals</span>
                                    <span className="text-primary">{xgStats!.away.totalXG.toFixed(2)} xG</span>
                                </div>

                                {/* Visual xG bar */}
                                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                                    <div
                                        className="bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                                        style={{ width: `${homeXGPercent}%` }}
                                    />
                                    <div
                                        className="bg-gradient-to-l from-primary/60 to-primary/40 transition-all duration-500"
                                        style={{ width: `${awayXGPercent}%` }}
                                    />
                                </div>

                                {/* xG Performance indicator */}
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>
                                        {homeScore > xgStats!.home.totalXG ? (
                                            <span>{Math.abs(homeScore - xgStats!.home.totalXG).toFixed(2)} overperform</span>
                                        ) : homeScore < xgStats!.home.totalXG ? (
                                            <span>{Math.abs(homeScore - xgStats!.home.totalXG).toFixed(2)} underperform</span>
                                        ) : (
                                            <span>On target</span>
                                        )}
                                    </span>
                                    <span>
                                        {awayScore > xgStats!.away.totalXG ? (
                                            <span>{Math.abs(awayScore - xgStats!.away.totalXG).toFixed(2)} overperform</span>
                                        ) : awayScore < xgStats!.away.totalXG ? (
                                            <span>{Math.abs(awayScore - xgStats!.away.totalXG).toFixed(2)} underperform</span>
                                        ) : (
                                            <span>On target</span>
                                        )}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/60 text-center mt-1">xG values are approximate</p>
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="text-left space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{awayTeam?.name || 'Away Team'}</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onViewAwayPlayers}
                            className="gap-2"
                        >
                            <Users className="h-4 w-4" />
                            View Players
                        </Button>
                    </div>
                </div>

                {/* Venue */}
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{venue || 'Venue TBD'}</span>
                </div>
            </CardContent>
        </Card>
    );
}
