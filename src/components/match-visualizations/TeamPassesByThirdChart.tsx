import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamPassesByThird } from "@/hooks/useMatchVisualizationData";

interface TeamPassesByThirdChartProps {
  homeTeam: TeamPassesByThird;
  awayTeam: TeamPassesByThird;
}

export function TeamPassesByThirdChart({ homeTeam, awayTeam }: TeamPassesByThirdChartProps) {
  // Get max value for scaling
  const allValues = [
    ...homeTeam.halves.flatMap(h => [h.defensive, h.middle, h.final]),
    ...awayTeam.halves.flatMap(h => [h.defensive, h.middle, h.final]),
  ];
  const maxValue = Math.max(...allValues, 1);

  const getBarWidth = (value: number) => {
    return `${(value / maxValue) * 100}%`;
  };

  const HalfSection = ({ 
    half, 
    homeData, 
    awayData 
  }: { 
    half: number; 
    homeData: { defensive: number; middle: number; final: number };
    awayData: { defensive: number; middle: number; final: number };
  }) => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-center border-b pb-2">
        {half === 1 ? '1st Half' : '2nd Half'}
      </h4>
      
      {/* Defensive Third */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Defensive Third</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs truncate text-right">{homeTeam.teamName}</div>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-sm flex items-center justify-end pr-2 text-xs text-white font-medium"
                style={{ width: getBarWidth(homeData.defensive) }}
              >
                {homeData.defensive > 0 && homeData.defensive}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs truncate text-right">{awayTeam.teamName}</div>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-sm flex items-center justify-end pr-2 text-xs text-white font-medium"
                style={{ width: getBarWidth(awayData.defensive) }}
              >
                {awayData.defensive > 0 && awayData.defensive}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Third */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Middle Third</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs truncate text-right">{homeTeam.teamName}</div>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-sm flex items-center justify-end pr-2 text-xs text-white font-medium"
                style={{ width: getBarWidth(homeData.middle) }}
              >
                {homeData.middle > 0 && homeData.middle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs truncate text-right">{awayTeam.teamName}</div>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-sm flex items-center justify-end pr-2 text-xs text-white font-medium"
                style={{ width: getBarWidth(awayData.middle) }}
              >
                {awayData.middle > 0 && awayData.middle}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Third */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Final Third</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs truncate text-right">{homeTeam.teamName}</div>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-sm flex items-center justify-end pr-2 text-xs text-white font-medium"
                style={{ width: getBarWidth(homeData.final) }}
              >
                {homeData.final > 0 && homeData.final}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-xs truncate text-right">{awayTeam.teamName}</div>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-sm flex items-center justify-end pr-2 text-xs text-white font-medium"
                style={{ width: getBarWidth(awayData.final) }}
              >
                {awayData.final > 0 && awayData.final}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Passes by Third</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-xs">{homeTeam.teamName}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="text-xs">{awayTeam.teamName}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <HalfSection 
            half={1} 
            homeData={homeTeam.halves[0]} 
            awayData={awayTeam.halves[0]} 
          />
          <HalfSection 
            half={2} 
            homeData={homeTeam.halves[1]} 
            awayData={awayTeam.halves[1]} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
