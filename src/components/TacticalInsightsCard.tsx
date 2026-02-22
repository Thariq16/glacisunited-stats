import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "./RadarChart";
import { TacticalProfile, PositionAnalysis, AdvancedMetrics } from "@/utils/playerMetrics";
import { MapPin, AlertCircle, Award, Target, Crosshair } from "lucide-react";
import { PlayerStats } from "@/utils/parseCSV";
import { Progress } from "@/components/ui/progress";

interface TacticalInsightsCardProps {
  player: PlayerStats;
  tacticalProfile: TacticalProfile;
  positioning: PositionAnalysis;
  metrics: AdvancedMetrics;
}

function MiniStatCard({ icon: Icon, title, children, className = "" }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border bg-card/50 ${className}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
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

  const foulDistItems = [
    { label: 'Final Third', value: positioning.foulDistribution.finalThird },
    { label: 'Middle Third', value: positioning.foulDistribution.middleThird },
    { label: 'Defensive Third', value: positioning.foulDistribution.defensiveThird },
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
        {/* Radar Chart */}
        <RadarChart data={radarData} />

        {/* Mini Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position Analysis */}
          <MiniStatCard icon={MapPin} title="Position Analysis">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Primary Zone:</span>
                <Badge variant="secondary" className="font-semibold">{positioning.primary}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Foul Distribution</p>
                {foulDistItems.map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </MiniStatCard>

          {/* Discipline & Set Pieces */}
          <MiniStatCard icon={AlertCircle} title="Discipline & Set Pieces">
            <div className="space-y-2">
              <StatRow label="Fouls Committed" value={player.fouls} />
              <StatRow label="Fouls Won" value={player.foulWon} highlight />
              <StatRow label="Fouls Won/Committed" value={`${metrics.foulsCommittedVsWonRatio}x`} />
            </div>
            <div className="pt-3 mt-3 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Set Piece Stats</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <span className="text-xs text-muted-foreground block">Corners</span>
                  <span className="font-bold text-sm">{player.corners} <span className="text-xs text-muted-foreground">({metrics.cornerSuccessRate}%)</span></span>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <span className="text-xs text-muted-foreground block">Free Kicks</span>
                  <span className="font-bold text-sm">{player.freeKicks}</span>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <span className="text-xs text-muted-foreground block">Crosses</span>
                  <span className="font-bold text-sm">{player.crosses}</span>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <span className="text-xs text-muted-foreground block">Cut Backs</span>
                  <span className="font-bold text-sm">{player.cutBacks}</span>
                </div>
              </div>
            </div>
          </MiniStatCard>
        </div>

        {/* Attacking Threat Analysis */}
        <MiniStatCard icon={Award} title="Attacking Threat Analysis" className="border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Penalty Area Entries', value: player.penaltyAreaEntry },
              { label: 'PA Passes', value: player.penaltyAreaPass },
              { label: 'Attacking Contribution', value: metrics.attackingContribution },
              { label: 'Defensive Contribution', value: metrics.defensiveContribution },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground block mb-1">{item.label}</span>
                <span className="font-bold text-xl text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </MiniStatCard>
      </CardContent>
    </Card>
  );
}
