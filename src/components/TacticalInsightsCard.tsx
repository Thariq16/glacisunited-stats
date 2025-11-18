import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "./RadarChart";
import { TacticalProfile, PositionAnalysis, AdvancedMetrics } from "@/utils/playerMetrics";
import { MapPin, AlertCircle, Award, Target } from "lucide-react";
import { PlayerStats } from "@/utils/parseCSV";

interface TacticalInsightsCardProps {
  player: PlayerStats;
  tacticalProfile: TacticalProfile;
  positioning: PositionAnalysis;
  metrics: AdvancedMetrics;
}

export function TacticalInsightsCard({ player, tacticalProfile, positioning, metrics }: TacticalInsightsCardProps) {
  const radarData = [
    { category: 'Attacking', value: tacticalProfile.attackingThreat, fullMark: 100 },
    { category: 'Defending', value: tacticalProfile.defensiveStrength, fullMark: 100 },
    { category: 'Passing', value: tacticalProfile.passingQuality, fullMark: 100 },
    { category: 'Set Pieces', value: tacticalProfile.setpieceAbility, fullMark: 100 },
    { category: 'Discipline', value: tacticalProfile.discipline, fullMark: 100 },
    { category: 'Work Rate', value: tacticalProfile.workRate, fullMark: 100 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Tactical Profile & Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadarChart data={radarData} />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Positioning Analysis */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Position Analysis</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Primary Zone:</span>
              <Badge variant="secondary">{positioning.primary}</Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Foul Distribution</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Third:</span>
                  <span>{positioning.foulDistribution.finalThird}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Middle Third:</span>
                  <span>{positioning.foulDistribution.middleThird}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Defensive Third:</span>
                  <span>{positioning.foulDistribution.defensiveThird}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Discipline & Set Pieces */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Discipline & Set Pieces</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fouls Committed:</span>
                <span className="font-medium">{player.fouls}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fouls Won:</span>
                <span className="font-medium">{player.foulWon}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fouls Won/Committed:</span>
                <span className="font-medium">{metrics.foulsCommittedVsWonRatio}x</span>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <p className="text-sm font-medium">Set Piece Stats</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground block">Corners:</span>
                  <span className="font-medium">{player.corners} ({metrics.cornerSuccessRate}%)</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Free Kicks:</span>
                  <span className="font-medium">{player.freeKicks}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Crosses:</span>
                  <span className="font-medium">{player.crosses}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Cut Backs:</span>
                  <span className="font-medium">{player.cutBacks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attacking Threat Analysis */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Attacking Threat Analysis</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Penalty Area Entries</span>
              <span className="font-semibold text-lg">{player.penaltyAreaEntry}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">PA Passes</span>
              <span className="font-semibold text-lg">{player.penaltyAreaPass}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Attacking Contribution</span>
              <span className="font-semibold text-lg">{metrics.attackingContribution}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Defensive Contribution</span>
              <span className="font-semibold text-lg">{metrics.defensiveContribution}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
