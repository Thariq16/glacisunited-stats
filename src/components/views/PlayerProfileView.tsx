import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Target, Shield, Zap, TrendingUp, Award, MapPin } from "lucide-react";
import { calculateAdvancedMetrics, calculateTacticalProfile, analyzePositioning } from "@/utils/playerMetrics";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { PlayerStats } from "@/utils/parseCSV";
import { PlayerPassPositionMap } from "@/components/PlayerPassPositionMap";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";

interface PlayerProfileViewProps {
    player: PlayerStats;
    passData?: PlayerPassData;
}

export function PlayerProfileView({ player, passData }: PlayerProfileViewProps) {
    const metrics = useMemo(() => calculateAdvancedMetrics(player), [player]);
    const tacticalProfile = useMemo(() => calculateTacticalProfile(player, metrics), [player, metrics]);
    const positioning = useMemo(() => analyzePositioning(player), [player]);

    const radarData = [
        { subject: 'Attack', A: tacticalProfile.attackingThreat, fullMark: 100 },
        { subject: 'Defense', A: tacticalProfile.defensiveStrength, fullMark: 100 },
        { subject: 'Passing', A: tacticalProfile.passingQuality, fullMark: 100 },
        { subject: 'Set Piece', A: tacticalProfile.setpieceAbility, fullMark: 100 },
        { subject: 'Work Rate', A: tacticalProfile.workRate, fullMark: 100 },
        { subject: 'Discip.', A: tacticalProfile.discipline, fullMark: 100 },
    ];

    const StatBox = ({ label, value, subtext, className }: { label: string; value: string | number; subtext?: string; className?: string }) => (
        <div className={`p-4 bg-muted/50 rounded-lg ${className || ''}`}>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Player Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
                                {player.jerseyNumber}
                            </div>
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{player.playerName}</h1>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <Badge variant="secondary" className="text-base md:text-lg">{player.role}</Badge>
                                    <Badge variant="outline" className="text-base md:text-lg">
                                        Rating: {metrics.performanceRating}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 md:gap-8 text-center w-full md:w-auto">
                            <div>
                                <p className="text-xs md:text-sm text-muted-foreground mb-1">Minutes</p>
                                <p className="text-xl md:text-2xl font-bold">{player.minutesPlayed}</p>
                            </div>
                            <div>
                                <p className="text-xs md:text-sm text-muted-foreground mb-1">Goals</p>
                                <p className="text-xl md:text-2xl font-bold">{player.goals}</p>
                            </div>
                            <div>
                                <p className="text-xs md:text-sm text-muted-foreground mb-1">Assists</p>
                                <p className="text-xl md:text-2xl font-bold">{(player as any).assist || 0}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Stats */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="attacking" className="w-full">
                                <TabsList className="mb-6 w-full flex flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
                                    <TabsTrigger value="attacking" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border bg-background">Attacking</TabsTrigger>
                                    <TabsTrigger value="passing" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border bg-background">Possession</TabsTrigger>
                                    <TabsTrigger value="defensive" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border bg-background">Defensive</TabsTrigger>
                                    {passData && <TabsTrigger value="passmap" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground border bg-background">Pass Map</TabsTrigger>}
                                </TabsList>

                                <TabsContent value="attacking" className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatBox label="Shot Conversion" value={`${metrics.shotConversionRate}%`} subtext={`${player.goals} goals / ${player.shotsAttempted} shots`} />
                                        <StatBox label="Shot Accuracy" value={`${metrics.shotAccuracy}%`} subtext={`${player.shotsOnTarget} on target`} />
                                        <StatBox label="Exp. Contribution" value={metrics.attackingContribution.toFixed(0)} subtext="Combined metric" />
                                        <StatBox label="Deep Runs" value={player.runInBehind} />
                                        <StatBox label="Pen. Area Entries" value={player.penaltyAreaEntry} />
                                        <StatBox label="Cutbacks" value={player.cutBacks} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="passing" className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatBox label="Pass Accuracy" value={`${player.successPassPercent}`} subtext={`${player.successfulPass}/${player.passCount}`} />
                                        <StatBox label="Progressive Passing" value={`${metrics.progressivePassRate}%`} subtext="Forward play ratio" />
                                        <StatBox label="Crossing" value={player.crosses} />
                                        <StatBox label="Key Passes" value={(player as any).key_pass || 0} />
                                        <StatBox label="Through Balls" value={(player as any).through_ball || 0} />
                                        <StatBox label="Deep Completions" value={player.penaltyAreaPass} />
                                    </div>
                                </TabsContent>

                                {passData && (
                                    <TabsContent value="passmap" className="space-y-6">
                                        <PlayerPassPositionMap passData={passData} />
                                    </TabsContent>
                                )}


                                <TabsContent value="defensive" className="space-y-6">
                                    {/* Top Row: Defensive Stats */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">Defensive Statistics</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-background border rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Clearances</p>
                                                <p className="text-2xl font-bold">{player.clearance}</p>
                                            </div>
                                            <div className="p-4 bg-background border rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Aerial Duels Won</p>
                                                <p className="text-2xl font-bold text-primary">{player.aerialDuelsWon}</p>
                                            </div>
                                            <div className="p-4 bg-background border rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Aerial Duels Lost</p>
                                                <p className="text-2xl font-bold text-foreground">{player.aerialDuelsLost}</p>
                                            </div>
                                            <div className="p-4 bg-background border rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Saves</p>
                                                <p className="text-2xl font-bold">{player.saves}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Discipline and Set Pieces */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Discipline */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <div className="h-4 w-4 border-2 border-primary rounded-full" />
                                                    Discipline
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-muted-foreground">Total Fouls</span>
                                                    <span className="font-bold">{player.fouls}</span>
                                                </div>
                                                <div className="pl-4 space-y-2 border-l-2 border-muted">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Final Third</span>
                                                        <span>{player.foulsInFinalThird}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Middle Third</span>
                                                        <span>{player.foulsInMiddleThird}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Defensive Third</span>
                                                        <span>{player.foulsInDefensiveThird}</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center py-2 border-b pt-4">
                                                    <span className="text-muted-foreground">Fouls Won</span>
                                                    <span className="font-bold text-primary">{player.foulWon}</span>
                                                </div>
                                                <div className="pl-4 space-y-2 border-l-2 border-muted">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Final Third</span>
                                                        <span>{player.fwFinalThird}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Middle Third</span>
                                                        <span>{player.fwMiddleThird}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">Defensive Third</span>
                                                        <span>{player.fwDefensiveThird}</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-muted-foreground">Defensive Errors</span>
                                                    <span className="font-bold">{player.defensiveErrors}</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Set Pieces */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <TrendingUp className="h-4 w-4 px-0" />
                                                    Set Pieces
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Corners */}
                                                <div>
                                                    <div className="flex justify-between items-center py-2 border-b">
                                                        <span className="text-muted-foreground">Corners</span>
                                                        <span className="font-bold">{player.corners}</span>
                                                    </div>
                                                    <div className="pl-4 mt-2 space-y-2 border-l-2 border-muted">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Successful</span>
                                                            <span className="text-green-600 font-medium">{player.cornerSuccess}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Failed</span>
                                                            <span className="text-red-500 font-medium">{player.cornerFailed}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Success Rate</span>
                                                            <span className="font-bold">
                                                                {player.corners > 0
                                                                    ? Math.round((player.cornerSuccess / player.corners) * 100)
                                                                    : 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Throw Ins */}
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center py-2 border-b">
                                                        <span className="text-muted-foreground">Throw Ins</span>
                                                        <span className="font-bold">{player.throwIns}</span>
                                                    </div>
                                                    <div className="pl-4 mt-2 space-y-2 border-l-2 border-muted">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Successful</span>
                                                            <span className="text-green-600 font-medium">{player.tiSuccess}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Failed</span>
                                                            <span className="text-red-500 font-medium">{player.tiFailed}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Success Rate</span>
                                                            <span className="font-bold">
                                                                {player.throwIns > 0
                                                                    ? Math.round((player.tiSuccess / player.throwIns) * 100)
                                                                    : 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-muted-foreground">Free Kicks</span>
                                                    <span className="font-bold">{player.freeKicks}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Positional Intelligence */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Positional Intelligence
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold mb-4">Activity Zones (Fouls Committed)</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Defensive Third</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${positioning.foulDistribution.defensiveThird}%` }} />
                                                </div>
                                                <span className="w-8 text-right">{positioning.foulDistribution.defensiveThird}%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Middle Third</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${positioning.foulDistribution.middleThird}%` }} />
                                                </div>
                                                <span className="w-8 text-right">{positioning.foulDistribution.middleThird}%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Final Third</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${positioning.foulDistribution.finalThird}%` }} />
                                                </div>
                                                <span className="w-8 text-right">{positioning.foulDistribution.finalThird}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-4">Impact Zones (Fouls Won)</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Defensive Third</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${positioning.foulsWonDistribution.defensiveThird}%` }} />
                                                </div>
                                                <span className="w-8 text-right">{positioning.foulsWonDistribution.defensiveThird}%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Middle Third</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${positioning.foulsWonDistribution.middleThird}%` }} />
                                                </div>
                                                <span className="w-8 text-right">{positioning.foulsWonDistribution.middleThird}%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Final Third</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${positioning.foulsWonDistribution.finalThird}%` }} />
                                                </div>
                                                <span className="w-8 text-right">{positioning.foulsWonDistribution.finalThird}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Radar Chart & Insights */}
                <div className="space-y-6 md:space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tactical Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar
                                            name={player.playerName}
                                            dataKey="A"
                                            stroke="hsl(var(--primary))"
                                            fill="hsl(var(--primary))"
                                            fillOpacity={0.5}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                AI Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="mt-1">
                                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">Elite Passing Range:</span>{' '}
                                        Top 5% in progressive passing attempts.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="mt-1">
                                        <span className="flex h-2 w-2 rounded-full bg-yellow-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">Defensive Discipline:</span>{' '}
                                        Higher than average foul count in dangerous areas.
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="mt-1">
                                        <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">Role Suitability:</span>{' '}
                                        Metrics suggest optimal deployment as a{' '}
                                        <span className="font-semibold">{player.role}</span>.
                                    </p>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
