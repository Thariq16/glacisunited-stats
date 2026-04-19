import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart } from "@/components/RadarChart";
import { PlayerStats } from "@/utils/parseCSV";
import { calculateAdvancedMetrics, calculateTacticalProfile } from "@/utils/playerMetrics";
import { PlayerTouch } from "@/hooks/usePlayerTouches";

interface PlayerSummaryViewProps {
  player: PlayerStats;
  touches: PlayerTouch[];
  matchesCount: number;
  homeAttacksLeft?: boolean;
}

/**
 * Wyscout-style player summary: totals table + on-ball heatmap + tactical radar
 * + a row of donut KPIs.
 */
export function PlayerSummaryView({
  player,
  touches,
  matchesCount,
  homeAttacksLeft = true,
}: PlayerSummaryViewProps) {
  const metrics = useMemo(() => calculateAdvancedMetrics(player), [player]);
  const profile = useMemo(
    () => calculateTacticalProfile(player, metrics),
    [player, metrics]
  );

  const apps = Math.max(1, matchesCount);
  const avg = (n: number) => (n / apps).toFixed(2);

  // Chances created proxy: penalty area passes + cut backs + crosses
  const chancesCreated =
    (player.penaltyAreaPass || 0) + (player.cutBacks || 0) + (player.crosses || 0);
  const chancesScored = player.goals || 0;
  const chancesPct = chancesCreated > 0
    ? Math.round((chancesScored / chancesCreated) * 100)
    : 0;

  // Challenges: aerial duels + tackles
  const challengesTotal =
    (player.aerialDuelsWon || 0) +
    (player.aerialDuelsLost || 0) +
    (player.tackles || 0);
  const challengesWon = (player.aerialDuelsWon || 0) + (player.tackles || 0);
  const challengesPct = challengesTotal > 0
    ? Math.round((challengesWon / challengesTotal) * 100)
    : 0;

  // Minutes vs nominal (90 per match)
  const minutesPct = Math.min(
    100,
    Math.round((player.minutesPlayed / (matchesCount * 90 || 1)) * 100)
  );

  // Shots on target %
  const shotsPct = player.shotsAttempted > 0
    ? Math.round((player.shotsOnTarget / player.shotsAttempted) * 100)
    : 0;

  // Forward pass %
  const passesForwardPct = player.passCount > 0
    ? Math.round(((player.forwardPass || 0) / player.passCount) * 100)
    : 0;

  const radarData = [
    { category: "SCORING", value: profile.attacking },
    { category: "CREATIVITY", value: profile.passing },
    { category: "PASSING", value: profile.workRate },
    { category: "DEFENDING", value: profile.defending },
    { category: "PHYSICAL", value: profile.discipline },
  ];

  return (
    <div className="space-y-6">
      {/* Top row: totals · heatmap · radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Totals table */}
        <Card className="lg:col-span-4">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground"></th>
                  <th className="text-left p-3 font-medium text-primary">Total</th>
                  <th className="text-left p-3 font-medium text-primary">
                    Average per match
                  </th>
                </tr>
              </thead>
              <tbody className="text-primary">
                <SummaryRow label="Minutes played" total={player.minutesPlayed} avg={avg(player.minutesPlayed)} />
                <SummaryRow label="Goals" total={player.goals} avg={avg(player.goals)} />
                <SummaryRow
                  label="Chances / scored"
                  total={`${chancesCreated}/${chancesScored} (${chancesPct}%)`}
                  avg={`${avg(chancesCreated)}/${avg(chancesScored)} (${chancesPct}%)`}
                />
                <SummaryRow
                  label="Chances created"
                  total={chancesCreated}
                  avg={avg(chancesCreated)}
                />
                <SummaryRow label="Shots" total={player.shotsAttempted} avg={avg(player.shotsAttempted)} />
                <SummaryRow label="Passes" total={player.passCount} avg={avg(player.passCount)} />
                <SummaryRow label="Tackles" total={player.tackles} avg={avg(player.tackles)} />
                <SummaryRow label="Clearances" total={player.clearance} avg={avg(player.clearance)} />
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* On-ball heatmap */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
              On Ball Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TouchHeatmap touches={touches} homeAttacksLeft={homeAttacksLeft} />
          </CardContent>
        </Card>

        {/* Radar */}
        <Card className="lg:col-span-3">
          <CardContent className="p-2">
            <RadarChart data={radarData} />
          </CardContent>
        </Card>
      </div>

      {/* Donut KPIs row */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <DonutStat
              percent={minutesPct}
              title="Minutes"
              lines={[
                `Total: ${matchesCount * 90}`,
                `played: ${player.minutesPlayed} (${minutesPct}%)`,
              ]}
            />
            <DonutStat
              percent={shotsPct}
              title="Shots / on target"
              lines={[
                `Total: ${player.shotsAttempted}`,
                `on target: ${player.shotsOnTarget} (${shotsPct}%)`,
              ]}
            />
            <DonutStat
              percent={chancesPct}
              title="Chances / scored"
              lines={[
                `Total: ${chancesCreated}`,
                `scored: ${chancesScored} (${chancesPct}%)`,
              ]}
            />
            <DonutStat
              percent={challengesPct}
              title="Challenges"
              lines={[
                `Total: ${challengesTotal}`,
                `won: ${challengesWon} (${challengesPct}%)`,
              ]}
            />
            <DonutStat
              percent={passesForwardPct}
              title="Passes"
              lines={[
                `Total: ${player.passCount}`,
                `forward: ${player.forwardPass || 0} (${passesForwardPct}%)`,
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({
  label,
  total,
  avg,
}: {
  label: string;
  total: number | string;
  avg: number | string;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-3 text-primary">{label}</td>
      <td className="p-3 font-medium">{total}</td>
      <td className="p-3 font-medium">{avg}</td>
    </tr>
  );
}

/* ---------- Donut ---------- */

function DonutStat({
  percent,
  title,
  lines,
}: {
  percent: number;
  title: string;
  lines: string[];
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, percent)) / 100) * c;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <svg viewBox="0 0 70 70" className="w-20 h-20">
          <circle
            cx="35"
            cy="35"
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="35"
            cy="35"
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={c / 4}
            strokeLinecap="butt"
            transform="rotate(-90 35 35)"
          />
          <text
            x="35"
            y="38"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="hsl(var(--primary))"
          >
            {percent}%
          </text>
        </svg>
      </div>
      <p className="mt-2 text-sm font-semibold text-primary">{title}</p>
      {lines.map((l, i) => (
        <p key={i} className="text-[10px] text-muted-foreground leading-tight">
          {l}
        </p>
      ))}
    </div>
  );
}

/* ---------- Touch Heatmap ---------- */

function TouchHeatmap({
  touches,
  homeAttacksLeft,
}: {
  touches: PlayerTouch[];
  homeAttacksLeft: boolean;
}) {
  // 16 x 10 grid → smooth blob via radial gradients
  const COLS = 16;
  const ROWS = 10;

  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: ROWS }, () =>
      Array(COLS).fill(0)
    );
    touches.forEach((t) => {
      const x = homeAttacksLeft ? 100 - t.x : t.x; // orient attack → right
      const c = Math.min(COLS - 1, Math.max(0, Math.floor((x / 100) * COLS)));
      const r = Math.min(ROWS - 1, Math.max(0, Math.floor((t.y / 100) * ROWS)));
      g[r][c] += 1;
    });
    return g;
  }, [touches, homeAttacksLeft]);

  const max = Math.max(1, ...grid.flat());

  // viewBox 100 x 68 (standard pitch)
  const cellW = 100 / COLS;
  const cellH = 68 / ROWS;

  const colorFor = (v: number) => {
    if (v === 0) return null;
    const ratio = v / max;
    if (ratio > 0.66) return { fill: "#ef4444", opacity: 0.65 };
    if (ratio > 0.33) return { fill: "#f59e0b", opacity: 0.55 };
    return { fill: "#22c55e", opacity: 0.4 };
  };

  return (
    <svg
      viewBox="-1 -1 102 70"
      className="w-full rounded-md bg-green-50 dark:bg-green-950/40 border border-green-700/40"
    >
      {/* heatmap cells */}
      {grid.map((row, r) =>
        row.map((v, c) => {
          const col = colorFor(v);
          if (!col) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellW}
              y={r * cellH}
              width={cellW}
              height={cellH}
              fill={col.fill}
              opacity={col.opacity}
            />
          );
        })
      )}

      {/* pitch lines */}
      <rect x="0" y="0" width="100" height="68" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
      <line x1="50" y1="0" x2="50" y2="68" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
      <circle cx="50" cy="34" r="9.15" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
      <circle cx="50" cy="34" r="0.5" fill="hsl(var(--foreground))" opacity="0.7" />
      <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
      <rect x="83.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
      <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
      <rect x="94.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.7" />
    </svg>
  );
}
