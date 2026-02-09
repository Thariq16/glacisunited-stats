import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PossessionLossEvent } from "@/hooks/useSetPieceAnalytics";
import { MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PossessionLossHeatmapProps {
    losses: PossessionLossEvent[];
    zoneSummary: { zone: string; count: number; percentage: number }[];
}

function getZoneColor(count: number, max: number): string {
    const intensity = max > 0 ? count / max : 0;
    if (intensity >= 0.6) return 'bg-rose-500/70';
    if (intensity >= 0.3) return 'bg-amber-500/70';
    return 'bg-emerald-500/70';
}

export function PossessionLossHeatmap({ losses, zoneSummary }: PossessionLossHeatmapProps) {
    const maxCount = Math.max(...zoneSummary.map(z => z.count), 1);
    const dangerZone = zoneSummary.filter(z => z.percentage >= 40)[0];

    // Group losses into a 6x3 grid for heatmap
    const gridCells: number[][] = Array(3).fill(null).map(() => Array(6).fill(0));

    losses.forEach(loss => {
        const row = Math.min(Math.floor(loss.y / 33.33), 2);
        const col = Math.min(Math.floor(loss.x / 16.67), 5);
        gridCells[row][col]++;
    });

    const maxCellCount = Math.max(...gridCells.flat(), 1);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Possession Loss Hotspots
                    <span className="text-sm font-normal text-muted-foreground">
                        ({losses.length} total)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Pitch heatmap */}
                <div className="relative bg-gradient-to-r from-green-900/30 via-green-800/30 to-green-900/30 rounded-lg border-2 border-green-700/30 p-2 mb-4">
                    {/* Center line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />

                    {/* Goal areas */}
                    <div className="absolute top-1/4 bottom-1/4 left-0 w-4 border-r border-white/20" />
                    <div className="absolute top-1/4 bottom-1/4 right-0 w-4 border-l border-white/20" />

                    {/* Heatmap grid */}
                    <div className="grid grid-cols-6 gap-1">
                        {gridCells.map((row, rowIndex) =>
                            row.map((count, colIndex) => {
                                const intensity = maxCellCount > 0 ? count / maxCellCount : 0;
                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={cn(
                                            "h-12 rounded flex items-center justify-center text-white font-bold text-sm transition-all",
                                            count === 0
                                                ? "bg-muted/20"
                                                : intensity >= 0.6
                                                    ? "bg-rose-500/80"
                                                    : intensity >= 0.3
                                                        ? "bg-amber-500/80"
                                                        : "bg-emerald-500/50"
                                        )}
                                        title={`${count} possession losses`}
                                    >
                                        {count > 0 && count}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>← Own Goal</span>
                        <span>Opposition Goal →</span>
                    </div>
                </div>

                {/* Zone Summary */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {zoneSummary.map(({ zone, count, percentage }) => (
                        <div
                            key={zone}
                            className={cn(
                                "p-3 rounded-lg text-center",
                                getZoneColor(count, maxCount)
                            )}
                        >
                            <div className="text-white font-bold text-lg">{count}</div>
                            <div className="text-white/80 text-xs capitalize">{zone} Third</div>
                            <div className="text-white/60 text-xs">{percentage}%</div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-rose-500" />
                        <span>High Risk</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span>Low</span>
                    </div>
                </div>

                {/* Alert for danger zone */}
                {dangerZone && (
                    <div className="flex items-center gap-2 p-2 bg-rose-500/10 rounded-lg text-sm">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <span className="text-rose-600 dark:text-rose-400">
                            <strong>{dangerZone.percentage}%</strong> of possession losses occur in the{' '}
                            <strong className="capitalize">{dangerZone.zone}</strong> third
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
