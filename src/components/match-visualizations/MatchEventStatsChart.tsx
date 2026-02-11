import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamEventStats } from "@/hooks/useMatchVisualizationData";
import { Flag, Wind, ArrowUp, ArrowDownLeft, XCircle } from "lucide-react";

interface MatchEventStatsChartProps {
    homeTeamName: string;
    awayTeamName: string;
    home: TeamEventStats;
    away: TeamEventStats;
}

interface StatRowProps {
    label: string;
    homeValue: number;
    awayValue: number;
    maxValue: number;
    homeColor: string;
    awayColor: string;
}

function StatRow({ label, homeValue, awayValue, maxValue, homeColor, awayColor }: StatRowProps) {
    const getWidth = (value: number) => maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%';

    return (
        <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-right font-medium">{homeValue}</div>
                    <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                        <div
                            className="h-full rounded-sm transition-all duration-500"
                            style={{ width: getWidth(homeValue), backgroundColor: homeColor }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 text-xs text-right font-medium">{awayValue}</div>
                    <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                        <div
                            className="h-full rounded-sm transition-all duration-500"
                            style={{ width: getWidth(awayValue), backgroundColor: awayColor }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function StatSection({ title, icon, children }: StatSectionProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
                {icon}
                <h4 className="text-sm font-semibold">{title}</h4>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
}

export function MatchEventStatsChart({ homeTeamName, awayTeamName, home, away }: MatchEventStatsChartProps) {
    // Calculate max values for each section for proper bar scaling
    const setPieceMax = Math.max(
        home.cornerSuccess, home.cornerFailed, away.cornerSuccess, away.cornerFailed,
        home.throwInSuccess, home.throwInFailed, away.throwInSuccess, away.throwInFailed,
        1
    );

    const aerialMax = Math.max(
        home.aerialDuelsWon, home.aerialDuelsLost,
        away.aerialDuelsWon, away.aerialDuelsLost,
        1
    );

    const passMax = Math.max(
        home.backwardPass, away.backwardPass,
        home.incompletePass, away.incompletePass,
        1
    );

    const homeColor = '#3b82f6'; // blue-500
    const awayColor = '#f97316'; // orange-500
    const homeColorMuted = '#93c5fd'; // blue-300
    const awayColorMuted = '#fdba74'; // orange-300

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Match Event Stats</CardTitle>
                <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: homeColor }} />
                        <span className="text-xs">{homeTeamName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: awayColor }} />
                        <span className="text-xs">{awayTeamName}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Set Pieces Section */}
                    <StatSection
                        title="Set Pieces"
                        icon={<Flag className="h-4 w-4 text-muted-foreground" />}
                    >
                        <StatRow
                            label="Corner — Success"
                            homeValue={home.cornerSuccess}
                            awayValue={away.cornerSuccess}
                            maxValue={setPieceMax}
                            homeColor={homeColor}
                            awayColor={awayColor}
                        />
                        <StatRow
                            label="Corner — Failed"
                            homeValue={home.cornerFailed}
                            awayValue={away.cornerFailed}
                            maxValue={setPieceMax}
                            homeColor={homeColorMuted}
                            awayColor={awayColorMuted}
                        />
                        <StatRow
                            label="Throw-in — Success"
                            homeValue={home.throwInSuccess}
                            awayValue={away.throwInSuccess}
                            maxValue={setPieceMax}
                            homeColor={homeColor}
                            awayColor={awayColor}
                        />
                        <StatRow
                            label="Throw-in — Failed"
                            homeValue={home.throwInFailed}
                            awayValue={away.throwInFailed}
                            maxValue={setPieceMax}
                            homeColor={homeColorMuted}
                            awayColor={awayColorMuted}
                        />
                    </StatSection>

                    {/* Aerial Duels Section */}
                    <StatSection
                        title="Aerial Duels"
                        icon={<ArrowUp className="h-4 w-4 text-muted-foreground" />}
                    >
                        <StatRow
                            label="Won"
                            homeValue={home.aerialDuelsWon}
                            awayValue={away.aerialDuelsWon}
                            maxValue={aerialMax}
                            homeColor={homeColor}
                            awayColor={awayColor}
                        />
                        <StatRow
                            label="Lost"
                            homeValue={home.aerialDuelsLost}
                            awayValue={away.aerialDuelsLost}
                            maxValue={aerialMax}
                            homeColor={homeColorMuted}
                            awayColor={awayColorMuted}
                        />
                    </StatSection>

                    {/* Pass Quality Section */}
                    <StatSection
                        title="Pass Quality"
                        icon={<Wind className="h-4 w-4 text-muted-foreground" />}
                    >
                        <StatRow
                            label="Backward Pass"
                            homeValue={home.backwardPass}
                            awayValue={away.backwardPass}
                            maxValue={passMax}
                            homeColor={homeColor}
                            awayColor={awayColor}
                        />
                        <StatRow
                            label="Incomplete Pass"
                            homeValue={home.incompletePass}
                            awayValue={away.incompletePass}
                            maxValue={passMax}
                            homeColor={homeColorMuted}
                            awayColor={awayColorMuted}
                        />
                    </StatSection>
                </div>
            </CardContent>
        </Card>
    );
}
