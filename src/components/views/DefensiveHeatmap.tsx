import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export interface DefensiveEvent {
    id: string;
    x: number;
    y: number;
    type: string; // 'tackle', 'interception', 'clearance', 'block', 'aerial_duel', 'recovery' etc.
    description?: string;
}

interface DefensiveHeatmapProps {
    events: readonly DefensiveEvent[];
}

export function DefensiveHeatmap({ events }: DefensiveHeatmapProps) {
    // Pitch dimensions
    const width = 600;
    const height = 400;

    // Helper to scale coordinates (0-100 to SVG pixels)
    const xScale = (x: number) => (x / 100) * width;
    const yScale = (y: number) => (y / 100) * height;

    // Helper for color/style based on type
    const getEventStyle = (type: string) => {
        switch (type) {
            case 'tackle': return { color: '#3b82f6', label: 'Tackle', r: 5 }; // Blue
            case 'interception': return { color: '#22c55e', label: 'Interception', r: 5 }; // Green
            case 'clearance': return { color: '#eab308', label: 'Clearance', r: 5 }; // Yellow
            case 'block': return { color: '#f97316', label: 'Block', r: 5 }; // Orange
            case 'recovery': return { color: '#a855f7', label: 'Recovery', r: 4 }; // Purple
            case 'aerial_duel': return { color: '#ec4899', label: 'Aerial Duel', r: 4 }; // Pink
            default: return { color: '#64748b', label: 'Other', r: 3 }; // Gray
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Defensive Actions Map
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full flex justify-center overflow-x-auto">
                    <div className="relative min-w-[600px]">
                        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-green-50 dark:bg-green-950 border-2 border-green-800 rounded">
                            {/* Pitch Outline */}
                            <rect x="0" y="0" width={width} height={height} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#22c55e" strokeWidth="2" />
                            <circle cx={width / 2} cy={height / 2} r="50" fill="none" stroke="#22c55e" strokeWidth="2" />

                            {/* Penalty Areas (Simplified) */}
                            <rect x="0" y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <rect x={width * 0.84} y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="#22c55e" strokeWidth="2" />

                            {/* Render Events */}
                            {events.map((event) => {
                                const style = getEventStyle(event.type);
                                return (
                                    <g key={event.id} className="group cursor-pointer">
                                        <circle
                                            cx={xScale(event.x)}
                                            cy={yScale(event.y)}
                                            r={style.r}
                                            fill={style.color}
                                            opacity="0.8"
                                            stroke="white"
                                            strokeWidth="1"
                                        />
                                        <title>{`${style.label}${event.description ? `: ${event.description}` : ''}`}</title>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                                <span>Tackle</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                                <span>Interception</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div>
                                <span>Clearance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500 border border-white"></div>
                                <span>Block</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div>
                                <span>Recovery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
