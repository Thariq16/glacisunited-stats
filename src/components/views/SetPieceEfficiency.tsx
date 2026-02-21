import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CornerUpRight, Target } from "lucide-react";

export interface SetPieceStats {
    type: 'corner' | 'free_kick' | 'penalty';
    total: number;
    goals: number;
    shots: number;
    conversionRate: number;
}

export interface PlayerSetPieceStats {
    playerId: string;
    playerName: string;
    jerseyNumber: number;
    cornersTaken: number;
    shotsCreated: number;
    goalsCreated: number;
}

interface SetPieceEfficiencyProps {
    stats: readonly SetPieceStats[];
    playerStats?: readonly PlayerSetPieceStats[];
}

export function SetPieceEfficiency({ stats, playerStats = [] }: SetPieceEfficiencyProps) {
    const corners = stats.find(s => s.type === 'corner') || { total: 0, goals: 0, shots: 0, conversionRate: 0 };
    const freeKicks = stats.find(s => s.type === 'free_kick') || { total: 0, goals: 0, shots: 0, conversionRate: 0 };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CornerUpRight className="h-5 w-5 text-primary" />
                    Set Piece Efficiency
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Corners Funnel */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <CornerUpRight className="h-4 w-4" /> Corners
                        </h4>
                        <div className="relative pt-2">
                            {/* Funnel Visual */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full bg-muted p-3 rounded-lg flex justify-between items-center">
                                    <span>Total Corners</span>
                                    <span className="font-bold">{corners.total}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                <div className="w-[80%] bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex justify-between items-center">
                                    <span>Shots Created</span>
                                    <span className="font-bold">{corners.shots}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                <div className="w-[60%] bg-green-100 dark:bg-green-900/30 p-3 rounded-lg flex justify-between items-center border border-green-200 dark:border-green-800">
                                    <span className="font-semibold text-green-700 dark:text-green-400">Goals Scored</span>
                                    <span className="font-bold text-green-700 dark:text-green-400">{corners.goals}</span>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <Badge variant="outline" className="text-lg py-1">
                                    {corners.conversionRate}% Conversion
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Free Kicks Funnel */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4" /> Free Kicks
                        </h4>
                        <div className="relative pt-2">
                            {/* Funnel Visual */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full bg-muted p-3 rounded-lg flex justify-between items-center">
                                    <span>Total Taken</span>
                                    <span className="font-bold">{freeKicks.total}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                <div className="w-[80%] bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex justify-between items-center">
                                    <span>Shots / On Target</span>
                                    <span className="font-bold">{freeKicks.shots}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                <div className="w-[60%] bg-green-100 dark:bg-green-900/30 p-3 rounded-lg flex justify-between items-center border border-green-200 dark:border-green-800">
                                    <span className="font-semibold text-green-700 dark:text-green-400">Goals Scored</span>
                                    <span className="font-bold text-green-700 dark:text-green-400">{freeKicks.goals}</span>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <Badge variant="outline" className="text-lg py-1">
                                    {freeKicks.conversionRate}% Conversion
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player Corner Effectiveness */}
                {playerStats && playerStats.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                        <h4 className="font-semibold mb-4 text-lg">Corner Takers Effectiveness</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left font-medium text-muted-foreground pb-2">Player</th>
                                        <th className="text-right font-medium text-muted-foreground pb-2">Corners</th>
                                        <th className="text-right font-medium text-muted-foreground pb-2">Shots Created</th>
                                        <th className="text-right font-medium text-muted-foreground pb-2">Goals Created</th>
                                        <th className="text-right font-medium text-muted-foreground pb-2">Effectiveness</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {playerStats.filter(p => p.cornersTaken > 0).map((player) => (
                                        <tr key={player.playerId} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 font-medium">
                                                <span className="mr-2 text-muted-foreground">#{player.jerseyNumber}</span>
                                                {player.playerName}
                                            </td>
                                            <td className="text-right py-3">{player.cornersTaken}</td>
                                            <td className="text-right py-3">{player.shotsCreated}</td>
                                            <td className="text-right py-3 font-bold text-green-600">{player.goalsCreated}</td>
                                            <td className="text-right py-3">
                                                <Badge variant="secondary">
                                                    {player.cornersTaken > 0
                                                        ? Math.round((player.shotsCreated / player.cornersTaken) * 100)
                                                        : 0}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
