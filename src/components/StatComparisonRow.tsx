import { cn } from "@/lib/utils";

interface StatComparisonRowProps {
    label: string;
    homeValue: number | string;
    awayValue: number | string;
    /** If true, higher value is better (shown in green) */
    higherIsBetter?: boolean;
    /** Custom format function for display */
    formatValue?: (value: number | string) => string;
}

export function StatComparisonRow({
    label,
    homeValue,
    awayValue,
    higherIsBetter = true,
    formatValue,
}: StatComparisonRowProps) {
    // Convert to numbers for comparison
    const homeNum = typeof homeValue === 'string' ? parseFloat(homeValue) || 0 : homeValue;
    const awayNum = typeof awayValue === 'string' ? parseFloat(awayValue) || 0 : awayValue;

    // Calculate percentages for the bar
    const total = homeNum + awayNum;
    const homePercent = total > 0 ? (homeNum / total) * 100 : 50;

    // Determine which value is "better"
    const homeWins = higherIsBetter ? homeNum > awayNum : homeNum < awayNum;
    const awayWins = higherIsBetter ? awayNum > homeNum : awayNum < homeNum;

    // Format display values
    const displayHome = formatValue ? formatValue(homeValue) : String(homeValue);
    const displayAway = formatValue ? formatValue(awayValue) : String(awayValue);

    return (
        <div className="py-2">
            {/* Stat label */}
            <div className="flex items-center justify-between mb-1.5">
                <span
                    className={cn(
                        "font-bold text-base tabular-nums",
                        homeWins && "text-emerald-600 dark:text-emerald-400",
                    )}
                >
                    {displayHome}
                </span>

                <span className="text-sm text-muted-foreground font-medium px-2 text-center flex-1">
                    {label}
                </span>

                <span
                    className={cn(
                        "font-bold text-base tabular-nums",
                        awayWins && "text-emerald-600 dark:text-emerald-400",
                    )}
                >
                    {displayAway}
                </span>
            </div>

            {/* Visual comparison bar */}
            {total > 0 && (
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                    <div
                        className={cn(
                            "transition-all duration-300 rounded-l-full",
                            homeWins ? "bg-emerald-500" : "bg-primary/50"
                        )}
                        style={{ width: `${homePercent}%` }}
                    />
                    <div
                        className={cn(
                            "transition-all duration-300 rounded-r-full",
                            awayWins ? "bg-emerald-500" : "bg-primary/50"
                        )}
                        style={{ width: `${100 - homePercent}%` }}
                    />
                </div>
            )}
        </div>
    );
}
