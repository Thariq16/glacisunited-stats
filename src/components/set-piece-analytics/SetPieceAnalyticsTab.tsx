import { useSetPieceAnalytics } from "@/hooks/useSetPieceAnalytics";
import { SetPieceRetentionCard } from "./SetPieceRetentionCard";
import { ThrowInZoneChart } from "./ThrowInZoneChart";
import { PossessionLossHeatmap } from "./PossessionLossHeatmap";
import { PlayerAccountabilityTable } from "./PlayerAccountabilityTable";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface SetPieceAnalyticsTabProps {
    matchId: string;
    teamId: string;
    teamName: string;
}

export function SetPieceAnalyticsTab({ matchId, teamId, teamName }: SetPieceAnalyticsTabProps) {
    const { data, isLoading, error } = useSetPieceAnalytics(matchId, teamId);

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

    if (!hasSetPieceData && !hasPossessionData) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
                No set piece or possession data tracked for this match
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold">{teamName} - Set Piece & Possession Analysis</h3>

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
        </div>
    );
}

// Export all components for use elsewhere
export { SetPieceRetentionCard } from "./SetPieceRetentionCard";
export { ThrowInZoneChart } from "./ThrowInZoneChart";
export { PossessionLossHeatmap } from "./PossessionLossHeatmap";
export { PlayerAccountabilityTable } from "./PlayerAccountabilityTable";
