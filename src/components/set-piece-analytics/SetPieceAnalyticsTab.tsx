import { useState } from "react";
import { useSetPieceAnalytics } from "@/hooks/useSetPieceAnalytics";
import { SetPieceRetentionCard } from "./SetPieceRetentionCard";
import { ThrowInZoneChart } from "./ThrowInZoneChart";
import { PossessionLossHeatmap } from "./PossessionLossHeatmap";
import { PlayerAccountabilityTable } from "./PlayerAccountabilityTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

interface SetPieceAnalyticsTabProps {
    matchId: string | string[];
    teamId: string;
    teamName: string;
}

export function SetPieceAnalyticsTab({ matchId, teamId, teamName }: SetPieceAnalyticsTabProps) {
    const [selectedHalf, setSelectedHalf] = useState<string>("full");
    const halfFilter = selectedHalf === "full" ? null : Number(selectedHalf);
    const { data, isLoading, error } = useSetPieceAnalytics(matchId, teamId, halfFilter);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Failed to load set piece analytics
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                No set piece data available for this match
            </div>
        );
    }

    const hasSetPieceData = data.overview.some(s => s.total > 0);
    const hasPossessionData = data.possessionLosses.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-bold">{teamName} - Set Piece & Possession Analysis</h3>
                <Tabs value={selectedHalf} onValueChange={setSelectedHalf}>
                    <TabsList>
                        <TabsTrigger value="full">Full Match</TabsTrigger>
                        <TabsTrigger value="1">1st Half</TabsTrigger>
                        <TabsTrigger value="2">2nd Half</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {!hasSetPieceData && !hasPossessionData ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    No set piece or possession data tracked for {selectedHalf === "full" ? "this match" : `the ${selectedHalf === "1" ? "1st" : "2nd"} half`}
                </div>
            ) : (
                <>
                    {/* Overview Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {hasSetPieceData && (
                            <SetPieceRetentionCard stats={data.overview} />
                        )}

                        {hasPossessionData && (
                            <PossessionLossHeatmap
                                losses={data.possessionLosses}
                                zoneSummary={data.possessionLossByZone}
                            />
                        )}
                    </div>

                    {/* Throw-in Analysis */}
                    {data.throwInsByZone.some(z => z.total > 0) && (
                        <ThrowInZoneChart zoneStats={data.throwInsByZone} />
                    )}

                    {/* Player Accountability */}
                    {data.playerStats.length > 0 && (
                        <PlayerAccountabilityTable players={data.playerStats} />
                    )}
                </>
            )}
        </div>
    );
}

// Export all components for use elsewhere
export { SetPieceRetentionCard } from "./SetPieceRetentionCard";
export { ThrowInZoneChart } from "./ThrowInZoneChart";
export { PossessionLossHeatmap } from "./PossessionLossHeatmap";
export { PlayerAccountabilityTable } from "./PlayerAccountabilityTable";
