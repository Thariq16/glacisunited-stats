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
    const pitchHeight = 68;
    const scaleX = (x: number) => x; // already 0-100
    const scaleY = (y: number) => (y / 100) * pitchHeight;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Lost Possession Zones
                </CardTitle>
            </CardHeader>
            <CardContent>
                <svg viewBox="-3 0 106 68" className="w-full h-auto border-2 border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                    {/* Pitch outline */}
                    <rect x="0" y="0" width="100" height="68" fill="none" stroke="#22c55e" strokeWidth="0.5" />
                    {/* Halfway line */}
                    <line x1="50" y1="0" x2="50" y2="68" stroke="#22c55e" strokeWidth="0.3" />
                    {/* Center circle */}
                    <circle cx="50" cy="34" r="9.15" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    <circle cx="50" cy="34" r="0.5" fill="#22c55e" />

                    {/* Left penalty area */}
                    <rect x="0" y="13.84" width="16.5" height="40.32" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" strokeWidth="0.3" />
                    <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    <circle cx="11" cy="34" r="0.4" fill="#22c55e" />
                    <path d="M 16.5 27.5 A 9.15 9.15 0 0 1 16.5 40.5" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    {/* Left goal */}
                    <rect x="-2.5" y="29.84" width="3" height="8.32" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0.5" />

                    {/* Right penalty area */}
                    <rect x="83.5" y="13.84" width="16.5" height="40.32" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" strokeWidth="0.3" />
                    <rect x="94.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    <circle cx="89" cy="34" r="0.4" fill="#22c55e" />
                    <path d="M 83.5 27.5 A 9.15 9.15 0 0 0 83.5 40.5" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    {/* Right goal */}
                    <rect x="99.5" y="29.84" width="3" height="8.32" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0.5" />

                    {/* Corner arcs */}
                    <path d="M 0 1 A 1 1 0 0 0 1 0" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    <path d="M 99 0 A 1 1 0 0 0 100 1" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    <path d="M 0 67 A 1 1 0 0 1 1 68" fill="none" stroke="#22c55e" strokeWidth="0.3" />
                    <path d="M 100 67 A 1 1 0 0 0 99 68" fill="none" stroke="#22c55e" strokeWidth="0.3" />

                    {/* Zone dividers */}
                    <line x1="33" y1="0" x2="33" y2="68" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" strokeDasharray="1,1" />
                    <line x1="67" y1="0" x2="67" y2="68" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" strokeDasharray="1,1" />

                    {/* Zone labels */}
                    <text x="16.5" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">DEF</text>
                    <text x="50" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">MID</text>
                    <text x="83.5" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">FIN</text>

                    {/* Heatmap Points */}
                    {events.map((event) => (
                        <circle
                            key={event.id}
                            cx={scaleX(event.x)}
                            cy={scaleY(event.y)}
                            r={2.5}
                            fill="#f97316"
                            opacity="0.25"
                            className="mix-blend-multiply"
                        >
                            <title>{event.player ? `Lost by ${event.player}` : 'Possession Lost'}</title>
                        </circle>
                    ))}
                </svg>

                <div className="mt-3 flex justify-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 opacity-50"></div>
                        Darker areas indicate frequent turnover zones
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
