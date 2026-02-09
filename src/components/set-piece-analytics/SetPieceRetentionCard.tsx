import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetPieceStats } from "@/hooks/useSetPieceAnalytics";
import { Target, Flag, CornerDownRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetPieceRetentionCardProps {
    stats: SetPieceStats[];
}

function getIcon(type: string) {
    switch (type) {
        case 'throw_in': return <CornerDownRight className="h-5 w-5" />;
        case 'corner': return <Flag className="h-5 w-5" />;
        case 'free_kick': return <Target className="h-5 w-5" />;
        default: return null;
    }
}

function getLabel(type: string) {
    switch (type) {
        case 'throw_in': return 'Throw-ins';
        case 'corner': return 'Corners';
        case 'free_kick': return 'Free Kicks';
        default: return type;
    }
}

function getRateColor(rate: number): string {
    if (rate >= 75) return 'text-emerald-500';
    if (rate >= 50) return 'text-amber-500';
    return 'text-rose-500';
}

function getBarColor(rate: number): string {
    if (rate >= 75) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
}

export function SetPieceRetentionCard({ stats }: SetPieceRetentionCardProps) {
    const hasLowRate = stats.some(s => s.successRate < 60 && s.total > 3);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Set Piece Retention Rate
                    {hasLowRate && (
                        <Badge variant="destructive" className="gap-1 ml-2">
                            <AlertTriangle className="h-3 w-3" />
                            Needs Attention
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {stats.map((stat) => (
                    <div key={stat.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getIcon(stat.type)}
                                <span className="font-medium">{getLabel(stat.type)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("font-bold text-lg", getRateColor(stat.successRate))}>
                                    {stat.successRate}%
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    ({stat.successful}/{stat.total})
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all", getBarColor(stat.successRate))}
                                style={{ width: `${stat.successRate}%` }}
                            />
                        </div>

                        {/* Alert for low rates */}
                        {stat.successRate < 60 && stat.total > 3 && (
                            <p className="text-xs text-rose-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Losing possession on {stat.failed} of {stat.total} {getLabel(stat.type).toLowerCase()}
                            </p>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
