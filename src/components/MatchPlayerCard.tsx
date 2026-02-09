import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerStats } from "@/utils/parseCSV";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Shield, Clock, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchPlayerCardProps {
    player: PlayerStats;
    teamId?: string;
    isTopPerformer?: boolean;
    xgData?: {
        totalXG: number;
        actualGoals: number;
        overperformance: number;
    };
    rank?: number;
}

export function MatchPlayerCard({
    player,
    teamId,
    isTopPerformer = false,
    xgData,
    rank
}: MatchPlayerCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (teamId) {
            navigate(`/team/${teamId}/player/${encodeURIComponent(player.playerName)}`);
        }
    };

    return (
        <Card
            className={cn(
                "hover:shadow-lg transition-all cursor-pointer relative overflow-hidden",
                isTopPerformer && "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent",
                teamId && "hover:border-primary"
            )}
            onClick={handleClick}
        >
            {/* Top performer badge */}
            {isTopPerformer && (
                <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-amber-500 text-white gap-1">
                        <Star className="h-3 w-3" />
                        MVP
                    </Badge>
                </div>
            )}

            {/* Rank badge */}
            {rank && rank <= 3 && !isTopPerformer && (
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                        {rank}
                    </Badge>
                </div>
            )}

            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {player.playerName}
                            {player.goals > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    ⚽ {player.goals}
                                </span>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                                #{player.jerseyNumber}
                            </span>
                            {player.role && (
                                <Badge variant="outline" className="text-xs">
                                    {player.role}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                    {/* Minutes */}
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Min</span>
                        <span className="font-semibold ml-auto">{player.minutesPlayed}'</span>
                    </div>

                    {/* Pass Accuracy */}
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Pass</span>
                        <span className="font-semibold ml-auto">{player.successPassPercent}</span>
                    </div>

                    {/* Shots */}
                    <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Shots</span>
                        <span className="font-semibold ml-auto">
                            {player.shotsOnTarget}/{player.shotsAttempted}
                        </span>
                    </div>

                    {/* Tackles */}
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tackles</span>
                        <span className="font-semibold ml-auto">{player.tackles}</span>
                    </div>
                </div>

                {/* xG Data if available */}
                {xgData && xgData.totalXG > 0 && (
                    <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">xG</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{xgData.totalXG.toFixed(2)}</span>
                                {xgData.overperformance !== 0 && (
                                    <span className={cn(
                                        "text-xs",
                                        xgData.overperformance > 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        ({xgData.overperformance > 0 ? '+' : ''}{xgData.overperformance.toFixed(2)})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
