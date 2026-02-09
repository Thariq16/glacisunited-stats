import { Badge } from "@/components/ui/badge";
import { Target, Users, Crosshair, TrendingUp } from "lucide-react";
import { PlayerStats } from "@/utils/parseCSV";

interface MatchQuickStatsProps {
    homePlayers: PlayerStats[];
    awayPlayers: PlayerStats[];
    homeTeam: string;
    awayTeam: string;
    xgStats?: {
        home: { totalXG: number; shotCount: number };
        away: { totalXG: number; shotCount: number };
    } | null;
}

export function MatchQuickStats({
    homePlayers,
    awayPlayers,
    homeTeam,
    awayTeam,
    xgStats
}: MatchQuickStatsProps) {
    // Calculate quick stats
    const homeShots = homePlayers.reduce((sum, p) => sum + p.shotsAttempted, 0);
    const awayShots = awayPlayers.reduce((sum, p) => sum + p.shotsAttempted, 0);

    const homePasses = homePlayers.reduce((sum, p) => sum + p.passCount, 0);
    const awayPasses = awayPlayers.reduce((sum, p) => sum + p.passCount, 0);

    const homeOnTarget = homePlayers.reduce((sum, p) => sum + p.shotsOnTarget, 0);
    const awayOnTarget = awayPlayers.reduce((sum, p) => sum + p.shotsOnTarget, 0);

    // Calculate possession proxy from passes
    const totalPasses = homePasses + awayPasses;
    const homePossession = totalPasses > 0 ? Math.round((homePasses / totalPasses) * 100) : 50;
    const awayPossession = 100 - homePossession;

    const hasXG = xgStats && (xgStats.home.shotCount > 0 || xgStats.away.shotCount > 0);

    return (
        <div className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Possession */}
                <Badge variant="secondary" className="gap-2 py-2 px-4 text-sm">
                    <Users className="h-4 w-4" />
                    <span className="font-bold">{homePossession}%</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-bold">{awayPossession}%</span>
                    <span className="text-muted-foreground text-xs ml-1">Poss</span>
                </Badge>

                {/* Shots */}
                <Badge variant="secondary" className="gap-2 py-2 px-4 text-sm">
                    <Crosshair className="h-4 w-4" />
                    <span className="font-bold">{homeShots}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-bold">{awayShots}</span>
                    <span className="text-muted-foreground text-xs ml-1">Shots</span>
                </Badge>

                {/* On Target */}
                <Badge variant="secondary" className="gap-2 py-2 px-4 text-sm">
                    <Target className="h-4 w-4" />
                    <span className="font-bold">{homeOnTarget}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-bold">{awayOnTarget}</span>
                    <span className="text-muted-foreground text-xs ml-1">On Target</span>
                </Badge>

                {/* xG if available */}
                {hasXG && (
                    <Badge variant="outline" className="gap-2 py-2 px-4 text-sm border-primary/50">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="font-bold">{xgStats!.home.totalXG.toFixed(2)}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="font-bold">{xgStats!.away.totalXG.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs ml-1">xG</span>
                    </Badge>
                )}
            </div>
        </div>
    );
}
