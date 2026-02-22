import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export interface DefensiveEvent {
    id: string;
    x: number;
    y: number;
    type: string;
    description?: string;
}

interface DefensiveHeatmapProps {
    events: readonly DefensiveEvent[];
}

export function DefensiveHeatmap({ events }: DefensiveHeatmapProps) {
    const pitchHeight = 68;
    const scaleX = (x: number) => x;
    const scaleY = (y: number) => (y / 100) * pitchHeight;

    const getEventStyle = (type: string) => {
        switch (type) {
            case 'tackle': return { color: '#3b82f6', label: 'Tackle', r: 1.2 };
            case 'interception': return { color: '#22c55e', label: 'Interception', r: 1.2 };
            case 'clearance': return { color: '#eab308', label: 'Clearance', r: 1.2 };
            case 'block': return { color: '#f97316', label: 'Block', r: 1.2 };
            case 'recovery': return { color: '#a855f7', label: 'Recovery', r: 1 };
            case 'aerial_duel': return { color: '#ec4899', label: 'Aerial Duel', r: 1 };
            default: return { color: '#64748b', label: 'Other', r: 0.8 };
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

                    {/* Render Events */}
                    {events.map((event) => {
                        const style = getEventStyle(event.type);
                        return (
                            <g key={event.id} className="cursor-pointer">
                                <circle
                                    cx={scaleX(event.x)}
                                    cy={scaleY(event.y)}
                                    r={style.r}
                                    fill={style.color}
                                    opacity="0.8"
                                    stroke="white"
                                    strokeWidth="0.2"
                                />
                                <title>{`${style.label}${event.description ? `: ${event.description}` : ''}`}</title>
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white"></div>
                        <span>Tackle</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white"></div>
                        <span>Interception</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white"></div>
                        <span>Clearance</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white"></div>
                        <span>Block</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white"></div>
                        <span>Recovery</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
