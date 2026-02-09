import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatComparisonRow } from "@/components/StatComparisonRow";
import { PlayerStats } from "@/utils/parseCSV";
import { Target, Users, Shield, Flag } from "lucide-react";

interface MatchStatsCardsProps {
    homeTeam: string;
    awayTeam: string;
    homePlayers: PlayerStats[];
    awayPlayers: PlayerStats[];
    xgStats?: {
        home: { totalXG: number; shotCount: number };
        away: { totalXG: number; shotCount: number };
    } | null;
}

interface TeamStats {
    goals: number;
    totalPasses: number;
    completedPass: number;
    cpPercent: number;
    forwardPasses: number;
    fpPercent: number;
    backwardPasses: number;
    penaltyAreaPass: number;
    penaltyAreaEntry: number;
    runInBehind: number;
    overlaps: number;
    shotsAttempted: number;
    shotsOnTarget: number;
    shotAccuracy: number;
    conversionRate: number;
    fouls: number;
    foulsWon: number;
    saves: number;
    tackles: number;
    clearances: number;
    aerialDuelsWon: number;
    crosses: number;
    corners: number;
    freekicks: number;
    throwIns: number;
    offside: number;
    yellowCards: number;
    redCards: number;
}

function calculateTeamStats(players: PlayerStats[]): TeamStats {
    const goals = players.reduce((sum, p) => sum + p.goals, 0);
    const totalPasses = players.reduce((sum, p) => sum + p.passCount, 0);
    const completedPass = players.reduce((sum, p) => sum + p.successfulPass, 0);
    const forwardPasses = players.reduce((sum, p) => sum + p.forwardPass, 0);
    const backwardPasses = players.reduce((sum, p) => sum + p.backwardPass, 0);
    const penaltyAreaPass = players.reduce((sum, p) => sum + p.penaltyAreaPass, 0);
    const penaltyAreaEntry = players.reduce((sum, p) => sum + p.penaltyAreaEntry, 0);
    const runInBehind = players.reduce((sum, p) => sum + p.runInBehind, 0);
    const overlaps = players.reduce((sum, p) => sum + p.overlaps, 0);
    const shotsAttempted = players.reduce((sum, p) => sum + p.shotsAttempted, 0);
    const shotsOnTarget = players.reduce((sum, p) => sum + p.shotsOnTarget, 0);
    const saves = players.reduce((sum, p) => sum + p.saves, 0);
    const fouls = players.reduce((sum, p) => sum + p.fouls, 0);
    const foulsWon = players.reduce((sum, p) => sum + p.foulWon, 0);
    const tackles = players.reduce((sum, p) => sum + p.tackles, 0);
    const clearances = players.reduce((sum, p) => sum + p.clearance, 0);
    const aerialDuelsWon = players.reduce((sum, p) => sum + p.aerialDuelsWon, 0);
    const crosses = players.reduce((sum, p) => sum + p.crosses, 0);
    const corners = players.reduce((sum, p) => sum + p.corners, 0);
    const freekicks = players.reduce((sum, p) => sum + p.freeKicks, 0);
    const throwIns = players.reduce((sum, p) => sum + p.throwIns, 0);
    const offside = players.reduce((sum, p) => sum + p.offside, 0);
    const yellowCards = players.reduce((sum, p) => sum + (p.yellowCards || 0), 0);
    const redCards = players.reduce((sum, p) => sum + (p.redCards || 0), 0);

    const cpPercent = totalPasses > 0 ? (completedPass / totalPasses) * 100 : 0;
    const fpPercent = totalPasses > 0 ? (forwardPasses / totalPasses) * 100 : 0;
    const shotAccuracy = shotsAttempted > 0 ? (shotsOnTarget / shotsAttempted) * 100 : 0;
    const conversionRate = shotsAttempted > 0 ? (goals / shotsAttempted) * 100 : 0;

    return {
        goals,
        totalPasses,
        completedPass,
        cpPercent,
        forwardPasses,
        fpPercent,
        backwardPasses,
        penaltyAreaPass,
        penaltyAreaEntry,
        runInBehind,
        overlaps,
        shotsAttempted,
        shotsOnTarget,
        shotAccuracy,
        conversionRate,
        fouls,
        foulsWon,
        saves,
        tackles,
        clearances,
        aerialDuelsWon,
        crosses,
        corners,
        freekicks,
        throwIns,
        offside,
        yellowCards,
        redCards,
    };
}

interface StatsCardProps {
    title: string;
    icon: React.ReactNode;
    homeTeam: string;
    awayTeam: string;
    children: React.ReactNode;
}

function StatsCard({ title, icon, homeTeam, awayTeam, children }: StatsCardProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    {icon}
                    {title}
                </CardTitle>
                {/* Team column headers */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm font-semibold text-muted-foreground">
                    <span className="text-primary">{homeTeam}</span>
                    <span className="text-xs uppercase tracking-wide">Stat</span>
                    <span className="text-primary">{awayTeam}</span>
                </div>
            </CardHeader>
            <CardContent className="pt-0 divide-y divide-border/50">
                {children}
            </CardContent>
        </Card>
    );
}

export function MatchStatsCards({
    homeTeam,
    awayTeam,
    homePlayers,
    awayPlayers,
    xgStats
}: MatchStatsCardsProps) {
    const homeStats = calculateTeamStats(homePlayers);
    const awayStats = calculateTeamStats(awayPlayers);

    const formatPercent = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return `${num.toFixed(1)}%`;
    };

    const formatDecimal = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toFixed(2);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Attacking Stats */}
            <StatsCard
                title="Attacking"
                icon={<Target className="h-5 w-5 text-primary" />}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
            >
                <StatComparisonRow
                    label="Goals"
                    homeValue={homeStats.goals}
                    awayValue={awayStats.goals}
                />
                {xgStats && (
                    <StatComparisonRow
                        label="xG"
                        homeValue={xgStats.home.totalXG}
                        awayValue={xgStats.away.totalXG}
                        formatValue={formatDecimal}
                    />
                )}
                <StatComparisonRow
                    label="Shots"
                    homeValue={homeStats.shotsAttempted}
                    awayValue={awayStats.shotsAttempted}
                />
                <StatComparisonRow
                    label="On Target"
                    homeValue={homeStats.shotsOnTarget}
                    awayValue={awayStats.shotsOnTarget}
                />
                <StatComparisonRow
                    label="Shot Accuracy"
                    homeValue={homeStats.shotAccuracy}
                    awayValue={awayStats.shotAccuracy}
                    formatValue={formatPercent}
                />
                <StatComparisonRow
                    label="Conversion"
                    homeValue={homeStats.conversionRate}
                    awayValue={awayStats.conversionRate}
                    formatValue={formatPercent}
                />
                <StatComparisonRow
                    label="PA Entries"
                    homeValue={homeStats.penaltyAreaEntry}
                    awayValue={awayStats.penaltyAreaEntry}
                />
            </StatsCard>

            {/* Passing Stats */}
            <StatsCard
                title="Passing"
                icon={<Users className="h-5 w-5 text-primary" />}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
            >
                <StatComparisonRow
                    label="Total Passes"
                    homeValue={homeStats.totalPasses}
                    awayValue={awayStats.totalPasses}
                />
                <StatComparisonRow
                    label="Completed"
                    homeValue={homeStats.completedPass}
                    awayValue={awayStats.completedPass}
                />
                <StatComparisonRow
                    label="Accuracy"
                    homeValue={homeStats.cpPercent}
                    awayValue={awayStats.cpPercent}
                    formatValue={formatPercent}
                />
                <StatComparisonRow
                    label="Forward"
                    homeValue={homeStats.forwardPasses}
                    awayValue={awayStats.forwardPasses}
                />
                <StatComparisonRow
                    label="PA Passes"
                    homeValue={homeStats.penaltyAreaPass}
                    awayValue={awayStats.penaltyAreaPass}
                />
                <StatComparisonRow
                    label="Crosses"
                    homeValue={homeStats.crosses}
                    awayValue={awayStats.crosses}
                />
                <StatComparisonRow
                    label="Overlaps"
                    homeValue={homeStats.overlaps}
                    awayValue={awayStats.overlaps}
                />
            </StatsCard>

            {/* Defensive Stats */}
            <StatsCard
                title="Defensive"
                icon={<Shield className="h-5 w-5 text-primary" />}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
            >
                <StatComparisonRow
                    label="Tackles"
                    homeValue={homeStats.tackles}
                    awayValue={awayStats.tackles}
                />
                <StatComparisonRow
                    label="Clearances"
                    homeValue={homeStats.clearances}
                    awayValue={awayStats.clearances}
                />
                <StatComparisonRow
                    label="Aerials Won"
                    homeValue={homeStats.aerialDuelsWon}
                    awayValue={awayStats.aerialDuelsWon}
                />
                <StatComparisonRow
                    label="Saves"
                    homeValue={homeStats.saves}
                    awayValue={awayStats.saves}
                />
                <StatComparisonRow
                    label="Fouls"
                    homeValue={homeStats.fouls}
                    awayValue={awayStats.fouls}
                    higherIsBetter={false}
                />
                <StatComparisonRow
                    label="Fouls Won"
                    homeValue={homeStats.foulsWon}
                    awayValue={awayStats.foulsWon}
                />
                <StatComparisonRow
                    label="Yellow Cards"
                    homeValue={homeStats.yellowCards}
                    awayValue={awayStats.yellowCards}
                    higherIsBetter={false}
                />
            </StatsCard>

            {/* Set Pieces Stats */}
            <StatsCard
                title="Set Pieces"
                icon={<Flag className="h-5 w-5 text-primary" />}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
            >
                <StatComparisonRow
                    label="Corners"
                    homeValue={homeStats.corners}
                    awayValue={awayStats.corners}
                />
                <StatComparisonRow
                    label="Free Kicks"
                    homeValue={homeStats.freekicks}
                    awayValue={awayStats.freekicks}
                />
                <StatComparisonRow
                    label="Throw Ins"
                    homeValue={homeStats.throwIns}
                    awayValue={awayStats.throwIns}
                />
                <StatComparisonRow
                    label="Offsides"
                    homeValue={homeStats.offside}
                    awayValue={awayStats.offside}
                    higherIsBetter={false}
                />
                <StatComparisonRow
                    label="Runs Behind"
                    homeValue={homeStats.runInBehind}
                    awayValue={awayStats.runInBehind}
                />
            </StatsCard>
        </div>
    );
}
