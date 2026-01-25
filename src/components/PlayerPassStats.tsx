import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";
import { ArrowRight, ArrowLeft, Target, XCircle } from "lucide-react";

interface PlayerPassStatsProps {
  passData: PlayerPassData;
}

export function PlayerPassStats({ passData }: PlayerPassStatsProps) {
  const successRate = passData.totalPasses > 0 
    ? ((passData.successfulPasses / passData.totalPasses) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Passing Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Total</span>
          </div>
          <span className="font-semibold text-right">{passData.totalPasses}</span>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Successful</span>
          </div>
          <span className="font-semibold text-right text-green-600">{passData.successfulPasses}</span>

          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">Unsuccessful</span>
          </div>
          <span className="font-semibold text-right text-destructive">{passData.unsuccessfulPasses}</span>

          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Forward</span>
          </div>
          <span className="font-semibold text-right">{passData.forwardPasses}</span>

          <div className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Backward</span>
          </div>
          <span className="font-semibold text-right">{passData.backwardPasses}</span>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pass Accuracy</span>
            <span className="text-lg font-bold text-primary">{successRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
