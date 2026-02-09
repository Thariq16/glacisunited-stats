import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerStats } from "@/utils/parseCSV";

interface MatchStatsTableProps {
  homeTeam: string;
  awayTeam: string;
  homePlayers: PlayerStats[];
  awayPlayers: PlayerStats[];
}

interface TeamStats {
  goals: number;
  totalPasses: number;
  completedPass: number;
  cpPercent: string;
  missedPass: number;
  mpPercent: string;
  forwardPasses: number;
  fpPercent: string;
  backwardPasses: number;
  bpPercent: string;
  passToGoalThreat: string;
  penaltyAreaPass: number;
  penaltyAreaEntry: number;
  paEntryEfficiency: string;
  runInBehind: number;
  overlaps: number;
  shotsAttempted: number;
  shotsOnTarget: number;
  shotAccuracy: string;
  conversionRate: string;
  clinicalFinishing: string;
  fouls: number;
  foulsWon: number;
  saves: number;
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
  const missedPass = players.reduce((sum, p) => sum + p.missPass, 0);
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
  const crosses = players.reduce((sum, p) => sum + p.crosses, 0);
  const corners = players.reduce((sum, p) => sum + p.corners, 0);
  const freekicks = players.reduce((sum, p) => sum + p.freeKicks, 0);
  const throwIns = players.reduce((sum, p) => sum + p.throwIns, 0);
  const offside = players.reduce((sum, p) => sum + p.offside, 0);
  const yellowCards = players.reduce((sum, p) => sum + (p.yellowCards || 0), 0);
  const redCards = players.reduce((sum, p) => sum + (p.redCards || 0), 0);

  const cpPercent = totalPasses > 0 ? ((completedPass / totalPasses) * 100).toFixed(2) : "0.00";
  const mpPercent = totalPasses > 0 ? ((missedPass / totalPasses) * 100).toFixed(2) : "0.00";
  const fpPercent = totalPasses > 0 ? ((forwardPasses / totalPasses) * 100).toFixed(2) : "0.00";
  const bpPercent = totalPasses > 0 ? ((backwardPasses / totalPasses) * 100).toFixed(2) : "0.00";
  const passToGoalThreat = totalPasses > 0 ? ((penaltyAreaPass / totalPasses) * 100).toFixed(2) : "0.00";
  const paEntryEfficiency = penaltyAreaPass > 0 ? ((penaltyAreaEntry / penaltyAreaPass) * 100).toFixed(2) : "0.00";
  const shotAccuracy = shotsAttempted > 0 ? ((shotsOnTarget / shotsAttempted) * 100).toFixed(2) : "0.00";
  const conversionRate = shotsAttempted > 0 ? ((goals / shotsAttempted) * 100).toFixed(2) : "0.00";
  const clinicalFinishing = shotsOnTarget > 0 ? ((goals / shotsOnTarget) * 100).toFixed(2) : "0.00";

  return {
    goals,
    totalPasses,
    completedPass,
    cpPercent: `${cpPercent}%`,
    missedPass,
    mpPercent: `${mpPercent}%`,
    forwardPasses,
    fpPercent: `${fpPercent}%`,
    backwardPasses,
    bpPercent: `${bpPercent}%`,
    passToGoalThreat: `${passToGoalThreat}%`,
    penaltyAreaPass,
    penaltyAreaEntry,
    paEntryEfficiency: `${paEntryEfficiency}%`,
    runInBehind,
    overlaps,
    shotsAttempted,
    shotsOnTarget,
    shotAccuracy: `${shotAccuracy}%`,
    conversionRate: `${conversionRate}%`,
    clinicalFinishing: `${clinicalFinishing}%`,
    fouls,
    foulsWon,
    saves,
    crosses,
    corners,
    freekicks,
    throwIns,
    offside,
    yellowCards,
    redCards,
  };
}

export function MatchStatsTable({ homeTeam, awayTeam, homePlayers, awayPlayers }: MatchStatsTableProps) {
  const homeStats = calculateTeamStats(homePlayers);
  const awayStats = calculateTeamStats(awayPlayers);

  const statsRows = [
    { label: "Goals", home: homeStats.goals, away: awayStats.goals },
    { label: "Total Passes", home: homeStats.totalPasses, away: awayStats.totalPasses },
    { label: "Completed Passes", home: homeStats.completedPass, away: awayStats.completedPass },
    { label: "Completed Pass %", home: homeStats.cpPercent, away: awayStats.cpPercent },
    { label: "Missed Passes", home: homeStats.missedPass, away: awayStats.missedPass },
    { label: "Missed Pass %", home: homeStats.mpPercent, away: awayStats.mpPercent },
    { label: "Forward Passes", home: homeStats.forwardPasses, away: awayStats.forwardPasses },
    { label: "Forward Pass %", home: homeStats.fpPercent, away: awayStats.fpPercent },
    { label: "Backward Passes", home: homeStats.backwardPasses, away: awayStats.backwardPasses },
    { label: "Backward Pass %", home: homeStats.bpPercent, away: awayStats.bpPercent },
    { label: "Pass to Goal Threat", home: homeStats.passToGoalThreat, away: awayStats.passToGoalThreat },
    { label: "Penalty Area Pass", home: homeStats.penaltyAreaPass, away: awayStats.penaltyAreaPass },
    { label: "Penalty Area Entry", home: homeStats.penaltyAreaEntry, away: awayStats.penaltyAreaEntry },
    { label: "Penalty Area Entry Efficiency", home: homeStats.paEntryEfficiency, away: awayStats.paEntryEfficiency },
    { label: "Run in Behind", home: homeStats.runInBehind, away: awayStats.runInBehind },
    { label: "Overlaps", home: homeStats.overlaps, away: awayStats.overlaps },
    { label: "Shots Attempted", home: homeStats.shotsAttempted, away: awayStats.shotsAttempted },
    { label: "Shots on Target", home: homeStats.shotsOnTarget, away: awayStats.shotsOnTarget },
    { label: "Shot Accuracy", home: homeStats.shotAccuracy, away: awayStats.shotAccuracy },
    { label: "Conversion Rate", home: homeStats.conversionRate, away: awayStats.conversionRate },
    { label: "Clinical Finishing", home: homeStats.clinicalFinishing, away: awayStats.clinicalFinishing },
    { label: "Yellow Cards", home: homeStats.yellowCards, away: awayStats.yellowCards },
    { label: "Red Cards", home: homeStats.redCards, away: awayStats.redCards },
    { label: "Fouls", home: homeStats.fouls, away: awayStats.fouls },
    { label: "Fouls Won", home: homeStats.foulsWon, away: awayStats.foulsWon },
    { label: "Saves", home: homeStats.saves, away: awayStats.saves },
    { label: "Crosses", home: homeStats.crosses, away: awayStats.crosses },
    { label: "Corners", home: homeStats.corners, away: awayStats.corners },
    { label: "Free Kicks", home: homeStats.freekicks, away: awayStats.freekicks },
    { label: "Throw Ins", home: homeStats.throwIns, away: awayStats.throwIns },
    { label: "Offside", home: homeStats.offside, away: awayStats.offside },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Detailed Match Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right font-bold">{homeTeam}</TableHead>
              <TableHead className="text-center font-bold">Statistic</TableHead>
              <TableHead className="text-left font-bold">{awayTeam}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statsRows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-right font-medium">{row.home}</TableCell>
                <TableCell className="text-center text-muted-foreground">{row.label}</TableCell>
                <TableCell className="text-left font-medium">{row.away}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
