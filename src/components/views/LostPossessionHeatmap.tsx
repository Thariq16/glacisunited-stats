import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export interface PossessionLossEvent {
    id: string;
    x: number;
    y: number;
    player?: string;
}

interface LostPossessionHeatmapProps {
    events: readonly PossessionLossEvent[];
}

export function LostPossessionHeatmap({ events }: LostPossessionHeatmapProps) {
    // Pitch dimensions
    const width = 600;
    const height = 400;

    // Helper to scale coordinates (0-100 to SVG pixels)
    // Invert X/Y if needed based on data convention, assuming standardized 0-100
    const xScale = (x: number) => (x / 100) * width;
    const yScale = (y: number) => (y / 100) * height;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Lost Possession Zones
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full flex justify-center overflow-auto">
                    <div className="relative min-w-[600px]">
                        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-green-50 dark:bg-green-950 border-2 border-green-800 rounded">
                            {/* Pitch Outline */}
                            <rect x="0" y="0" width={width} height={height} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#22c55e" strokeWidth="2" />
                            <circle cx={width / 2} cy={height / 2} r="50" fill="none" stroke="#22c55e" strokeWidth="2" />

                            {/* Penalty Areas */}
                            <rect x="0" y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <rect x={width * 0.84} y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="#22c55e" strokeWidth="2" />

                            {/* Heatmap Points (Simplified with opacity blending) */}
                            {events.map((event) => (
                                <circle
                                    key={event.id}
                                    cx={xScale(event.x)}
                                    cy={yScale(event.y)}
                                    r={15}
                                    fill="#f97316" // Orange
                                    opacity="0.2" // Low opacity for density effect
                                    className="mix-blend-multiply"
                                >
                                    <title>{event.player ? `Lost by ${event.player}` : 'Possession Lost'}</title>
                                </circle>
                            ))}
                        </svg>

                        <div className="mt-4 flex justify-center text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500 opacity-50"></div>
                                Darker areas indicate frequent turnover zones
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
