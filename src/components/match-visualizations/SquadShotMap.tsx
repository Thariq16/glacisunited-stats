import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

export interface ShotEvent {
    id: string;
    x: number;
    y: number;
    shot_outcome: string | null;
    player?: {
        name: string;
        jersey_number: number;
    };
}

interface SquadShotMapProps {
    shots: ShotEvent[];
    title?: string;
}

export function SquadShotMap({ shots, title = "Squad Shot Map" }: SquadShotMapProps) {
    // Pitch dimensions for scaling (matching PitchDiagram)
    const PITCH_WIDTH = 100;
    const PITCH_HEIGHT = 68;

    // Convert stored Y coordinate (0-100 normalized) to SVG Y coordinate (0-68)
    const toSvgY = (storedY: number) => (storedY / 100) * PITCH_HEIGHT;

    const stats = useMemo(() => {
        const total = shots.length;
        const goals = shots.filter(s => s.shot_outcome === 'goal').length;
        const onTarget = shots.filter(s => s.shot_outcome === 'on_target' || s.shot_outcome === 'goal').length;
        const blocked = shots.filter(s => s.shot_outcome === 'blocked').length;

        return {
            total,
            goals,
            onTarget,
            blocked,
            conversionRate: total > 0 ? Math.round((goals / total) * 100) : 0,
            onTargetRate: total > 0 ? Math.round((onTarget / total) * 100) : 0
        };
    }, [shots]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {title}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                            {stats.goals} Goals
                        </Badge>
                        <Badge variant="outline">
                            {stats.total} Shots
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pitch Visual */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <svg
                                viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}
                                className="w-full border-2 border-green-800 rounded-lg bg-green-50 dark:bg-green-950"
                            >
                                {/* Pitch Outline */}
                                <rect x="0" y="0" width="100" height="68" fill="none" stroke="#22c55e" strokeWidth="0.6" />
                                <line x1="50" y1="0" x2="50" y2="68" stroke="#22c55e" strokeWidth="0.6" />
                                <circle cx="50" cy="34" r="9.15" fill="none" stroke="#22c55e" strokeWidth="0.6" />
                                <circle cx="50" cy="34" r="0.5" fill="#22c55e" />

                                {/* Penalty Areas */}
                                <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="#22c55e" strokeWidth="0.6" />
                                <rect x="83.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="#22c55e" strokeWidth="0.6" />

                                {/* Goals */}
                                <rect x="-2.5" y="30.84" width="2.5" height="7.32" fill="none" stroke="#22c55e" strokeWidth="0.6" />
                                <rect x="100" y="30.84" width="2.5" height="7.32" fill="none" stroke="#22c55e" strokeWidth="0.6" />

                                {/* Render Shots */}
                                {shots.map((shot) => {
                                    let color = "white";
                                    let strokeColor = "white";
                                    let shape = "circle";

                                    if (shot.shot_outcome === 'goal') { color = "#22C55E"; strokeColor = "#15803d"; }
                                    else if (shot.shot_outcome === 'on_target') { color = "#facc15"; strokeColor = "#ca8a04"; }
                                    else if (shot.shot_outcome === 'blocked') { color = "#a8a29e"; strokeColor = "#57534e"; shape = "square"; }
                                    else if (shot.shot_outcome === 'off_target') { color = "#EF4444"; strokeColor = "#b91c1c"; shape = "x"; }

                                    return (
                                        <g key={shot.id} className="group cursor-pointer">
                                            {shape === 'circle' && (
                                                <g>
                                                    <circle
                                                        cx={shot.x}
                                                        cy={toSvgY(shot.y)}
                                                        r={shot.shot_outcome === 'goal' ? 3.5 : 2.5}
                                                        fill={color}
                                                        opacity="1"
                                                        stroke={strokeColor}
                                                        strokeWidth="0.3"
                                                        className="drop-shadow-sm transition-all duration-200 group-hover:scale-110"
                                                    />
                                                    <text
                                                        x={shot.x}
                                                        y={toSvgY(shot.y)}
                                                        dy=".35em"
                                                        textAnchor="middle"
                                                        fontSize="2"
                                                        fontWeight="bold"
                                                        fill={shot.shot_outcome === 'on_target' ? 'black' : 'white'}
                                                        pointerEvents="none"
                                                        className="select-none"
                                                    >
                                                        {shot.player?.jersey_number}
                                                    </text>
                                                </g>
                                            )}
                                            {shape === 'square' && (
                                                <rect
                                                    x={shot.x - 2}
                                                    y={toSvgY(shot.y) - 2}
                                                    width="4"
                                                    height="4"
                                                    fill={color}
                                                    stroke={strokeColor}
                                                    strokeWidth="0.3"
                                                    opacity="0.9"
                                                />
                                            )}
                                            {shape === 'x' && (
                                                <g stroke={color} strokeWidth="0.8">
                                                    <line x1={shot.x - 1.5} y1={toSvgY(shot.y) - 1.5} x2={shot.x + 1.5} y2={toSvgY(shot.y) + 1.5} />
                                                    <line x1={shot.x + 1.5} y1={toSvgY(shot.y) - 1.5} x2={shot.x - 1.5} y2={toSvgY(shot.y) + 1.5} />
                                                </g>
                                            )}

                                            {/* Tooltip on hover */}
                                            <title>{`${shot.player?.name || 'Unknown'} (${shot.shot_outcome?.replace('_', ' ')})\nxG: 0.X`}</title>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Legend */}
                            <div className="flex gap-4 justify-center mt-3 text-sm">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                                    <span>Goal</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <span>On Target</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-gray-400"></div>
                                    <span>Blocked</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-red-500 font-bold">✕</span>
                                    <span>Off Target</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Conversion</p>
                                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">Accuracy</p>
                                <p className="text-2xl font-bold">{stats.onTargetRate}%</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Shoot-out Summary</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Goals</span>
                                    <span className="font-bold">{stats.goals}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Saved</span>
                                    <span className="font-bold">{stats.onTarget - stats.goals}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Off Target</span>
                                    <span className="font-bold">{stats.total - stats.onTarget - stats.blocked}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Blocked</span>
                                    <span className="font-bold">{stats.blocked}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
