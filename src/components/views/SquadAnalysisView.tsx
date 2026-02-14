import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Award, TrendingUp, Shield, Target, Activity } from "lucide-react";
import { calculateAdvancedMetrics } from "@/utils/playerMetrics";
import { PlayerStats } from "@/utils/parseCSV";

import { AttackingPhasesSection } from "@/components/match-visualizations/AttackingPhasesSection";
import { AttackingPhase } from "@/hooks/useMatchVisualizationData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { SquadShotMap, ShotEvent } from "@/components/match-visualizations/SquadShotMap";
import { LocalEvent } from "@/components/match-events/types";
import { ConsistencyMetrics, MatchStats } from "@/components/views/ConsistencyMetrics";

import { DefensiveHeatmap, DefensiveEvent } from "@/components/views/DefensiveHeatmap";
import { SetPieceEfficiency, SetPieceStats, PlayerSetPieceStats } from "@/components/views/SetPieceEfficiency";
import { AttackingThreatMap, LaneStats } from "@/components/views/AttackingThreatMap";
import { LostPossessionHeatmap, PossessionLossEvent } from "@/components/views/LostPossessionHeatmap";

interface SquadAnalysisViewProps {
    players: PlayerStats[];
    phases?: AttackingPhase[];
    events?: LocalEvent[];
    shots?: ShotEvent[];
    history?: readonly MatchStats[];
    setPieceStats?: readonly SetPieceStats[];
    playerSetPieceStats?: readonly PlayerSetPieceStats[];
    setPieceData?: {
        all: { team: SetPieceStats[], players: PlayerSetPieceStats[] },
        firstHalf: { team: SetPieceStats[], players: PlayerSetPieceStats[] },
        secondHalf: { team: SetPieceStats[], players: PlayerSetPieceStats[] }
    };
    opponentSetPieceData?: {
        all: { team: SetPieceStats[], players: PlayerSetPieceStats[] },
        firstHalf: { team: SetPieceStats[], players: PlayerSetPieceStats[] },
        secondHalf: { team: SetPieceStats[], players: PlayerSetPieceStats[] }
    };
    defensiveEvents?: readonly DefensiveEvent[];
    attackingThreat?: readonly LaneStats[] | { all: LaneStats[], firstHalf: LaneStats[], secondHalf: LaneStats[] };
    opponentAttackingThreat?: readonly LaneStats[] | { all: LaneStats[], firstHalf: LaneStats[], secondHalf: LaneStats[] };
    possessionLossEvents?: readonly PossessionLossEvent[];
    teamName?: string;
    opponentName?: string;
    focusTeamId?: string;
    matchCount?: number;
}

export function SquadAnalysisView({
    players,
    phases = [],
    events = [],
    shots = [],
    history = [],
    setPieceStats = [],
    playerSetPieceStats = [],
    setPieceData,
    opponentSetPieceData,
    defensiveEvents = [],
    attackingThreat = [],
    opponentAttackingThreat = [],
    possessionLossEvents = [],
    teamName = "Demo Team",
    opponentName = "Opposition",
    focusTeamId,
    matchCount = 1
}: SquadAnalysisViewProps) {
    const [selectedHalf, setSelectedHalf] = useState<'all' | 'first' | 'second'>('all');


    const squadStats = useMemo(() => {
        if (!players || players.length === 0) return null;

        const activePlayers = players.filter(p => p.passCount > 0 || p.goals > 0 || p.tackles > 0 || p.minutesPlayed > 0);
        if (activePlayers.length === 0) return null;

        const positionCounts: Record<string, number> = {};
        activePlayers.forEach(player => {
            const pos = player.role || 'Unknown';
            positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });

        const totalPlayers = activePlayers.length;
        const avgGoals = activePlayers.reduce((sum, p) => sum + p.goals, 0) / totalPlayers;
        const avgPassAccuracy = activePlayers.reduce((sum, p) => {
            const acc = p.passCount > 0 ? (p.successfulPass / p.passCount) * 100 : 0;
            return sum + acc;
        }, 0) / totalPlayers;
        const avgTackles = activePlayers.reduce((sum, p) => sum + p.tackles, 0) / totalPlayers;
        const avgMinutesPerPlayer = activePlayers.reduce((sum, p) => sum + p.minutesPlayed, 0) / totalPlayers;
        const totalRunInBehind = activePlayers.reduce((sum, p) => sum + p.runInBehind, 0);
        const totalOverlaps = activePlayers.reduce((sum, p) => sum + p.overlaps, 0);

        const topScorer = [...activePlayers].sort((a, b) => b.goals - a.goals)[0];
        const topPasser = [...activePlayers].sort((a, b) => {
            const accA = a.passCount > 0 ? (a.successfulPass / a.passCount) : 0;
            const accB = b.passCount > 0 ? (b.successfulPass / b.passCount) : 0;
            return accB - accA;
        })[0];
        const topDefender = activePlayers.reduce((prev, current) => (prev.tackles > current.tackles) ? prev : current);

        const playersWithRatings = activePlayers.map(player => ({
            player,
            rating: calculateAdvancedMetrics(player).performanceRating
        }));
        const bestXI = [...playersWithRatings].sort((a, b) => b.rating - a.rating).slice(0, 11);

        const positionDepth = Object.entries(positionCounts).map(([position, count]) => ({
            position,
            count,
            depth: count >= 3 ? 'Good' : count >= 2 ? 'Adequate' : 'Weak'
        }));

        const sortedByGoals = [...activePlayers].sort((a, b) => b.goals - a.goals);
        const sortedByPasses = [...activePlayers].sort((a, b) => b.successfulPass - a.successfulPass);

        return {
            totalPlayers,
            positionCounts,
            positionDepth,
            avgGoals: avgGoals.toFixed(1),
            avgPassAccuracy: avgPassAccuracy.toFixed(1),
            avgTackles: avgTackles.toFixed(1),
            totalAnalyzedMinutes: matchCount * 90,
            totalRunInBehind,
            totalOverlaps,
            topScorer,
            topPasser,
            topDefender,
            bestXI,
            sortedByGoals,
            sortedByPasses
        };
    }, [players]);

    // Filtering Logic
    const derivedShots = useMemo(() => {
        let sourceShots = shots;
        if (!sourceShots || sourceShots.length === 0) {
            sourceShots = events.filter(e => e.eventType === 'shot').map(e => ({
                id: e.id,
                x: e.x,
                y: e.y,
                half: (e as any).half || 1, // Fallback
                shot_outcome: e.shotOutcome || null,
                team_id: (e as any).teamId,
                player: {
                    name: e.playerName,
                    jersey_number: e.jerseyNumber
                }
            }));
        }

        // 1. Filter by Team (Focus Team)
        if (focusTeamId) {
            sourceShots = sourceShots.filter(s => (s as any).team_id === focusTeamId);
        }

        // 2. Filter by Half
        if (selectedHalf === 'all') return sourceShots;
        const targetHalf = selectedHalf === 'first' ? 1 : 2;
        return sourceShots.filter(s => (s as any).half === targetHalf);
    }, [shots, events, selectedHalf, focusTeamId]);

    const derivedOpponentShots = useMemo(() => {
        let sourceShots = shots;
        if (!sourceShots || sourceShots.length === 0) return [];

        // 1. Filter by Opponent Team (NOT focus team)
        if (focusTeamId) {
            sourceShots = sourceShots.filter(s => (s as any).team_id !== focusTeamId);
        } else {
            // Fallback if no focus ID check: return empty to avoid confusion or all
            return [];
        }

        // 2. Filter by Half
        if (selectedHalf === 'all') return sourceShots;
        const targetHalf = selectedHalf === 'first' ? 1 : 2;
        return sourceShots.filter(s => (s as any).half === targetHalf);

    }, [shots, events, selectedHalf, focusTeamId]);

    // Phases: ALWAYS SHOW ALL (User Request: "Other data should be for the entire match")
    const filteredPhases = useMemo(() => {
        return phases;
    }, [phases]);

    // Defensive Events: ALWAYS SHOW ALL (User Request)
    const filteredDefensiveEvents = useMemo(() => {
        return defensiveEvents;
    }, [defensiveEvents]);

    // Possession: Apply Filter - only show focus team's losses
    const filteredPossessionLoss = useMemo(() => {
        let filtered = possessionLossEvents.filter(e => !focusTeamId || (e as any).teamId === focusTeamId);
        if (selectedHalf === 'all') return filtered;
        const targetHalf = selectedHalf === 'first' ? 1 : 2;
        return filtered.filter(e => (e as any).half === targetHalf);
    }, [possessionLossEvents, selectedHalf, focusTeamId]);

    // Attacking Threat: Apply Filter (User Request: "Attacking Threat Channel")
    const filteredAttackingThreat = useMemo(() => {
        if (Array.isArray(attackingThreat)) return attackingThreat; // Legacy/Demo support

        // Use type assertion or check properties
        const threatObj = attackingThreat as { all: LaneStats[], firstHalf: LaneStats[], secondHalf: LaneStats[] };

        if (selectedHalf === 'all') return threatObj.all || []; // Fallback to empty array

        if (selectedHalf === 'first') return threatObj.firstHalf;
        return threatObj.secondHalf;
    }, [attackingThreat, selectedHalf]);

    const filteredOpponentThreat = useMemo(() => {
        if (Array.isArray(opponentAttackingThreat)) return opponentAttackingThreat;

        const threatObj = opponentAttackingThreat as { all: LaneStats[], firstHalf: LaneStats[], secondHalf: LaneStats[] };

        if (selectedHalf === 'all') return threatObj.all || [];
        if (selectedHalf === 'first') return threatObj.firstHalf;
        return threatObj.secondHalf;
    }, [opponentAttackingThreat, selectedHalf]);

    const filteredSetPieceStats = useMemo(() => {
        if (!setPieceData) return setPieceStats; // Fallback to legacy/simple

        if (selectedHalf === 'all') return setPieceData.all.team || [];
        if (selectedHalf === 'first') return setPieceData.firstHalf.team || [];
        return setPieceData.secondHalf.team || [];
    }, [setPieceStats, setPieceData, selectedHalf]);

    const filteredPlayerSetPieceStats = useMemo(() => {
        if (!setPieceData) return playerSetPieceStats;

        if (selectedHalf === 'all') return setPieceData.all.players || [];
        if (selectedHalf === 'first') return setPieceData.firstHalf.players || [];
        return setPieceData.secondHalf.players || [];
    }, [playerSetPieceStats, setPieceData, selectedHalf]);

    const filteredOpponentSetPieceStats = useMemo(() => {
        if (!opponentSetPieceData) return [];
        if (selectedHalf === 'all') return opponentSetPieceData.all.team || [];
        if (selectedHalf === 'first') return opponentSetPieceData.firstHalf.team || [];
        return opponentSetPieceData.secondHalf.team || [];
    }, [opponentSetPieceData, selectedHalf]);

    const filteredOpponentPlayerSetPieceStats = useMemo(() => {
        if (!opponentSetPieceData) return [];
        if (selectedHalf === 'all') return opponentSetPieceData.all.players || [];
        if (selectedHalf === 'first') return opponentSetPieceData.firstHalf.players || [];
        return opponentSetPieceData.secondHalf.players || [];
    }, [opponentSetPieceData, selectedHalf]);

    if (!squadStats) {
        return (
            <Card>
                <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">No player data available to analyze.</p>
                </CardContent>
            </Card>
        );
    }

    const FilterControl = () => (
        <div className="flex justify-end mb-4">
            <Tabs value={selectedHalf} onValueChange={(v) => setSelectedHalf(v as any)} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All Match</TabsTrigger>
                    <TabsTrigger value="first">1st Half</TabsTrigger>
                    <TabsTrigger value="second">2nd Half</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );

    return (
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attacking">Attacking</TabsTrigger>
                <TabsTrigger value="defensive">Defensive</TabsTrigger>
                <TabsTrigger value="set-pieces">Set Pieces</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Squad Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Active Players</p>
                                <p className="text-2xl md:text-3xl font-bold">{squadStats.totalPlayers}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Total Minutes</p>
                                <p className="text-2xl md:text-3xl font-bold">{squadStats.totalAnalyzedMinutes}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Avg Goals</p>
                                <p className="text-2xl md:text-3xl font-bold">{squadStats.avgGoals}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Avg Pass Acc.</p>
                                <p className="text-2xl md:text-3xl font-bold">{squadStats.avgPassAccuracy}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Run in Behind</p>
                                <p className="text-2xl md:text-3xl font-bold">{squadStats.totalRunInBehind}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Total Overlaps</p>
                                <p className="text-2xl md:text-3xl font-bold">{squadStats.totalOverlaps}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Position Distribution & Depth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {squadStats.positionDepth.map(({ position, count, depth }) => (
                                    <div key={position} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold">{position || 'Unknown'}</span>
                                            <Badge variant={depth === 'Good' ? 'default' : depth === 'Adequate' ? 'secondary' : 'destructive'}>
                                                {depth}
                                            </Badge>
                                        </div>
                                        <p className="text-2xl font-bold">{count} player{count !== 1 ? 's' : ''}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Top Scorers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart
                                        data={squadStats.sortedByGoals.slice(0, 5).filter(p => p.goals > 0)}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="playerName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="goals" fill="#8884d8">
                                            <LabelList dataKey="goals" position="top" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Top Passers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart
                                        data={squadStats.sortedByPasses.slice(0, 5).filter(p => p.successfulPass > 0)}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="playerName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="successfulPass" fill="#82ca9d">
                                            <LabelList dataKey="successfulPass" position="top" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Best XI (By Performance Rating)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {squadStats.bestXI.map(({ player, rating }, index) => (
                                <div key={player.jerseyNumber} className="p-4 border rounded-lg hover:border-primary transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{index + 1}</Badge>
                                            <span className="font-semibold">{player.playerName}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">#{player.jerseyNumber}</span>
                                    </div>
                                    {player.role && (
                                        <Badge variant="secondary" className="mb-2">{player.role}</Badge>
                                    )}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                        <span className="text-sm text-muted-foreground">Rating</span>
                                        <span className="text-lg font-bold text-primary">{rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {history && history.length > 0 && (
                    <ConsistencyMetrics history={history} />
                )}
            </TabsContent>

            <TabsContent value="attacking" className="space-y-6">
                <FilterControl />

                {derivedShots.length > 0 && (
                    <div className="grid grid-cols-1">
                        <SquadShotMap
                            shots={derivedShots}
                        />
                    </div>
                )}

                {filteredAttackingThreat && (
                    <div className="grid grid-cols-1">
                        <AttackingThreatMap stats={filteredAttackingThreat} />
                    </div>
                )}

                {filteredPhases && filteredPhases.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Attacking Phases Analysis ({selectedHalf === 'all' ? 'Full Match' : selectedHalf === 'first' ? '1st Half' : '2nd Half'})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AttackingPhasesSection teamName={teamName} phases={filteredPhases} isHomeTeam={true} />
                        </CardContent>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="defensive" className="space-y-6">
                <FilterControl />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredDefensiveEvents && filteredDefensiveEvents.length > 0 ? (
                        <div className="grid grid-cols-1">
                            <DefensiveHeatmap events={filteredDefensiveEvents} />
                        </div>
                    ) : (
                        <Card><CardContent className="pt-6 text-center text-muted-foreground">No defensive events</CardContent></Card>
                    )}

                    {filteredPossessionLoss && filteredPossessionLoss.length > 0 ? (
                        <div className="grid grid-cols-1">
                            <LostPossessionHeatmap events={filteredPossessionLoss} />
                        </div>
                    ) : (
                        <Card><CardContent className="pt-6 text-center text-muted-foreground">No possession loss data</CardContent></Card>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Opponent Shots */}
                    <Card>
                        <CardHeader><CardTitle>Shots Faced (Opponent)</CardTitle></CardHeader>
                        <CardContent>
                            {derivedOpponentShots.length > 0 ? (
                                <SquadShotMap shots={derivedOpponentShots} />
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No opponent shots recorded</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Opponent Threat */}
                    <Card>
                        <CardHeader><CardTitle>Opponent Attacking Threat</CardTitle></CardHeader>
                        <CardContent>
                            {filteredOpponentThreat ? (
                                <AttackingThreatMap stats={filteredOpponentThreat} />
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No opponent threat data</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="set-pieces" className="space-y-6">
                <FilterControl />

                <Tabs defaultValue="own" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="own">{teamName}</TabsTrigger>
                        <TabsTrigger value="opponent">{opponentName}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="own">
                        {filteredSetPieceStats && filteredSetPieceStats.length > 0 ? (
                            <div className="grid grid-cols-1">
                                <SetPieceEfficiency stats={filteredSetPieceStats} playerStats={filteredPlayerSetPieceStats} />
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">No set piece data available for {teamName}.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                    <TabsContent value="opponent">
                        {filteredOpponentSetPieceStats && filteredOpponentSetPieceStats.length > 0 ? (
                            <div className="grid grid-cols-1">
                                <SetPieceEfficiency stats={filteredOpponentSetPieceStats} playerStats={filteredOpponentPlayerSetPieceStats} />
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">No set piece data available for {opponentName}.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
    );
}
