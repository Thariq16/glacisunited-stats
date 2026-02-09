import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoneStats } from "@/hooks/useSetPieceAnalytics";
import { CornerDownRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThrowInZoneChartProps {
    zoneStats: ZoneStats[];
}

function getZoneLabel(zone: string): string {
    switch (zone) {
        case 'defensive': return 'Def Third';
        case 'middle': return 'Mid Third';
        case 'final': return 'Final Third';
        default: return zone;
    }
}

function getRateColor(rate: number): string {
    if (rate >= 75) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
}

function getTextColor(rate: number): string {
    if (rate >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
}

export function ThrowInZoneChart({ zoneStats }: ThrowInZoneChartProps) {
    // Group by zone
    const zones = ['defensive', 'middle', 'final'] as const;

    // Find the zone with lowest success rate
    const lowestZone = zoneStats
        .filter(z => z.total >= 2)
        .sort((a, b) => a.successRate - b.successRate)[0];

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CornerDownRight className="h-5 w-5 text-primary" />
                    Throw-in Success by Zone
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Pitch representation */}
                <div className="relative bg-gradient-to-r from-green-900/20 via-green-800/20 to-green-900/20 rounded-lg border-2 border-green-700/30 p-4 mb-4">
                    {/* Center line */}
                    <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/20" />
                    <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/20" />

                    <div className="grid grid-cols-3 gap-2">
                        {zones.map(zone => {
                            const leftStats = zoneStats.find(z => z.zone === zone && z.side === 'left');
                            const rightStats = zoneStats.find(z => z.zone === zone && z.side === 'right');

                            return (
                                <div key={zone} className="space-y-2">
                                    <div className="text-center text-xs font-medium text-muted-foreground mb-2">
                                        {getZoneLabel(zone)}
                                    </div>

                                    {/* Left side */}
                                    <div
                                        className={cn(
                                            "rounded p-2 text-center transition-all",
                                            leftStats && leftStats.total > 0
                                                ? getRateColor(leftStats.successRate)
                                                : "bg-muted"
                                        )}
                                    >
                                        <div className="text-white font-bold text-sm">
                                            {leftStats?.successRate || 0}%
                                        </div>
                                        <div className="text-white/80 text-xs">
                                            {leftStats?.successful || 0}/{leftStats?.total || 0}
                                        </div>
                                    </div>

                                    {/* Right side */}
                                    <div
                                        className={cn(
                                            "rounded p-2 text-center transition-all",
                                            rightStats && rightStats.total > 0
                                                ? getRateColor(rightStats.successRate)
                                                : "bg-muted"
                                        )}
                                    >
                                        <div className="text-white font-bold text-sm">
                                            {rightStats?.successRate || 0}%
                                        </div>
                                        <div className="text-white/80 text-xs">
                                            {rightStats?.successful || 0}/{rightStats?.total || 0}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>← Own Half</span>
                        <span>Opposition Half →</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span>75%+ Success</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span>50-74%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-rose-500" />
                        <span>&lt;50%</span>
                    </div>
                </div>

                {/* Alert for problematic zone */}
                {lowestZone && lowestZone.successRate < 60 && (
                    <div className="flex items-center gap-2 p-2 bg-rose-500/10 rounded-lg text-sm">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <span className="text-rose-600 dark:text-rose-400">
                            <strong>{getZoneLabel(lowestZone.zone)}</strong> ({lowestZone.side} side) has only{' '}
                            <strong>{lowestZone.successRate}%</strong> retention rate
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
