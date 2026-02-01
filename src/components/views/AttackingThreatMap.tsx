import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface LaneStats {
    lane: 'left' | 'center' | 'right';
    passCount: number;
    threatPercent: number; // 0-100
    xg: number;
}

interface AttackingThreatMapProps {
    stats: readonly LaneStats[];
}

export function AttackingThreatMap({ stats }: AttackingThreatMapProps) {
    // Pitch dimensions
    const width = 600;
    const height = 400;

    // Lanes definition (x ranges 0-100)
    // Left: 0-33, Center: 33-67, Right: 67-100

    const leftStats = stats.find(s => s.lane === 'left') || { passCount: 0, threatPercent: 0, xg: 0 };
    const centerStats = stats.find(s => s.lane === 'center') || { passCount: 0, threatPercent: 0, xg: 0 };
    const rightStats = stats.find(s => s.lane === 'right') || { passCount: 0, threatPercent: 0, xg: 0 };

    // Helper to get color intensity based on percent
    const getOpacity = (percent: number) => 0.1 + (percent / 100) * 0.8;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Attacking Threat Channels
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full flex justify-center overflow-hidden">
                    <div className="relative min-w-[600px]">
                        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-green-50 dark:bg-green-950 border-2 border-green-800 rounded">
                            {/* Pitch Outline */}
                            <rect x="0" y="0" width={width} height={height} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#22c55e" strokeWidth="2" />
                            <circle cx={width / 2} cy={height / 2} r="50" fill="none" stroke="#22c55e" strokeWidth="2" />

                            {/* Penalty Areas */}
                            <rect x="0" y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="#22c55e" strokeWidth="2" />
                            <rect x={width * 0.84} y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="#22c55e" strokeWidth="2" />

                            {/* Attacking Direction Arrow */}
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                                </marker>
                            </defs>
                            <line x1={width * 0.4} y1={height * 0.05} x2={width * 0.6} y2={height * 0.05} stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrowhead)" />

                            {/* Left Lane Overlay */}
                            <rect
                                x="0" y="0" width={width} height={height * 0.33}
                                fill="#3b82f6"
                                opacity={getOpacity(leftStats.threatPercent)}
                            />

                            {/* Center Lane Overlay */}
                            <rect
                                x="0" y={height * 0.33} width={width} height={height * 0.34}
                                fill="#eab308"
                                opacity={getOpacity(centerStats.threatPercent)}
                            />

                            {/* Right Lane Overlay */}
                            <rect
                                x="0" y={height * 0.67} width={width} height={height * 0.33}
                                fill="#3b82f6"
                                opacity={getOpacity(rightStats.threatPercent)}
                            />

                            {/* Lane Labels & Stats */}
                            {/* Left */}
                            <foreignObject x={width * 0.1} y={height * 0.1} width={width * 0.8} height={50}>
                                <div className="flex justify-center items-center gap-4 text-white font-bold drop-shadow-md">
                                    <span className="text-lg">Left Flank</span>
                                    <Badge variant="secondary">{leftStats.threatPercent}% Threat</Badge>
                                    <span className="text-sm bg-black/30 px-2 py-1 rounded">{leftStats.passCount} Passes</span>
                                </div>
                            </foreignObject>

                            {/* Center */}
                            <foreignObject x={width * 0.1} y={height * 0.45} width={width * 0.8} height={50}>
                                <div className="flex justify-center items-center gap-4 text-white font-bold drop-shadow-md">
                                    <span className="text-lg">Center</span>
                                    <Badge variant="secondary">{centerStats.threatPercent}% Threat</Badge>
                                    <span className="text-sm bg-black/30 px-2 py-1 rounded">{centerStats.passCount} Passes</span>
                                </div>
                            </foreignObject>

                            {/* Right */}
                            <foreignObject x={width * 0.1} y={height * 0.8} width={width * 0.8} height={50}>
                                <div className="flex justify-center items-center gap-4 text-white font-bold drop-shadow-md">
                                    <span className="text-lg">Right Flank</span>
                                    <Badge variant="secondary">{rightStats.threatPercent}% Threat</Badge>
                                    <span className="text-sm bg-black/30 px-2 py-1 rounded">{rightStats.passCount} Passes</span>
                                </div>
                            </foreignObject>

                        </svg>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
