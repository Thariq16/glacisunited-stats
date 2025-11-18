import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AdvancedMetrics } from "@/utils/playerMetrics";
import { TrendingUp, Target, Shield, Award } from "lucide-react";

interface PlayerEfficiencyMetricsProps {
  metrics: AdvancedMetrics;
}

export function PlayerEfficiencyMetrics({ metrics }: PlayerEfficiencyMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Efficiency Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>Shot Conversion Rate</span>
            </div>
            <span className="font-semibold">{metrics.shotConversionRate}%</span>
          </div>
          <Progress value={metrics.shotConversionRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>Shot Accuracy</span>
            </div>
            <span className="font-semibold">{metrics.shotAccuracy}%</span>
          </div>
          <Progress value={metrics.shotAccuracy} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Aerial Duel Success</span>
            </div>
            <span className="font-semibold">{metrics.aerialDuelSuccessRate}%</span>
          </div>
          <Progress value={metrics.aerialDuelSuccessRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Progressive Pass Rate</span>
            </div>
            <span className="font-semibold">{metrics.progressivePassRate}%</span>
          </div>
          <Progress value={metrics.progressivePassRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Corner Success Rate</span>
            <span className="font-semibold">{metrics.cornerSuccessRate}%</span>
          </div>
          <Progress value={metrics.cornerSuccessRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Throw-In Success Rate</span>
            <span className="font-semibold">{metrics.throwInSuccessRate}%</span>
          </div>
          <Progress value={metrics.throwInSuccessRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Discipline Score</p>
            <p className="text-2xl font-bold">{metrics.disciplineScore}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Performance Rating</p>
            <p className="text-2xl font-bold">{metrics.performanceRating}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
