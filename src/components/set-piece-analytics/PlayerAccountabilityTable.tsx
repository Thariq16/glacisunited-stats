import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlayerSetPieceStats } from "@/hooks/useSetPieceAnalytics";
import { Users, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerAccountabilityTableProps {
    players: PlayerSetPieceStats[];
}

function getRateBadge(rate: number, total: number) {
    if (total === 0) return null;

    if (rate >= 75) {
        return (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                <TrendingUp className="h-3 w-3" />
                {rate}%
            </Badge>
        );
    }
    if (rate >= 50) {
        return (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                {rate}%
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
            <TrendingDown className="h-3 w-3" />
            {rate}%
        </Badge>
    );
}

export function PlayerAccountabilityTable({ players }: PlayerAccountabilityTableProps) {
    // Find players with low throw-in rates
    const problemPlayers = players.filter(p =>
        p.throwIns.total >= 3 && p.throwIns.rate < 60
    );

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Player Set Piece Accountability
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-center">Throw-ins</TableHead>
                            <TableHead className="text-center">Corners</TableHead>
                            <TableHead className="text-center">Free Kicks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {players.map((player) => {
                            const hasIssue = player.throwIns.total >= 3 && player.throwIns.rate < 60;

                            return (
                                <TableRow
                                    key={player.playerId}
                                    className={cn(hasIssue && "bg-rose-500/5")}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">#{player.jerseyNumber}</span>
                                            <span className="font-medium">{player.playerName}</span>
                                            {hasIssue && (
                                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {player.throwIns.total > 0 ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm text-muted-foreground">
                                                    {player.throwIns.successful}/{player.throwIns.total}
                                                </span>
                                                {getRateBadge(player.throwIns.rate, player.throwIns.total)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {player.corners.total > 0 ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm text-muted-foreground">
                                                    {player.corners.successful}/{player.corners.total}
                                                </span>
                                                {getRateBadge(player.corners.rate, player.corners.total)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {player.freeKicks.total > 0 ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm text-muted-foreground">
                                                    {player.freeKicks.successful}/{player.freeKicks.total}
                                                </span>
                                                {getRateBadge(player.freeKicks.rate, player.freeKicks.total)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {/* Recommendations */}
                {problemPlayers.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                        <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Coaching Recommendations
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            {problemPlayers.map(p => (
                                <li key={p.playerId}>
                                    • <strong>#{p.jerseyNumber} {p.playerName}</strong>: {p.throwIns.rate}% throw-in success
                                    ({p.throwIns.total - p.throwIns.successful} of {p.throwIns.total} lost) - consider alternate taker or training focus
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
