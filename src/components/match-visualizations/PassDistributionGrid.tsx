import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePassDistribution } from "@/hooks/usePassDistribution";

interface PassDistributionGridProps {
  matchId: string;
  teamId: string | undefined;
  teamName: string;
}

type HalfFilter = "all" | "first" | "second";

export function PassDistributionGrid({ matchId, teamId, teamName }: PassDistributionGridProps) {
  const [half, setHalf] = useState<HalfFilter>("all");
  const { data, isLoading } = usePassDistribution(matchId, teamId);

  const view = useMemo(() => {
    if (!data) return null;
    if (half === "first") return data.firstHalf;
    if (half === "second") return data.secondHalf;
    return data.all;
  }, [data, half]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Possession – Passes Distribution</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-96 w-full" /></CardContent>
      </Card>
    );
  }

  if (!view || view.players.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Possession – Passes Distribution</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No pass data available for this team.</p>
        </CardContent>
      </Card>
    );
  }

  const { players, matrix, positions } = view;

  // Row totals (passes given) and col totals (passes received)
  const rowTotals = matrix.map((row) => row.reduce((s, v) => s + v, 0));
  const colTotals = players.map((_, c) => matrix.reduce((s, r) => s + r[c], 0));
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

  // Color scale for cells based on value vs row max
  const cellBg = (val: number, rowMax: number) => {
    if (val === 0) return "bg-muted/40 text-muted-foreground/60";
    const ratio = rowMax > 0 ? val / rowMax : 0;
    if (ratio > 0.66) return "bg-primary/40 text-foreground font-semibold";
    if (ratio > 0.33) return "bg-primary/25 text-foreground font-medium";
    return "bg-primary/10 text-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Possession – Passes Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{teamName} · {grandTotal} successful passes</p>
          </div>
          <Tabs value={half} onValueChange={(v) => setHalf(v as HalfFilter)}>
            <TabsList>
              <TabsTrigger value="all">Full Match</TabsTrigger>
              <TabsTrigger value="first">1st Half</TabsTrigger>
              <TabsTrigger value="second">2nd Half</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Matrix */}
          <div className="overflow-x-auto">
            <table className="text-xs border-separate border-spacing-0 min-w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card text-left p-2 font-semibold text-muted-foreground">Pos</th>
                  <th className="sticky left-[40px] bg-card text-left p-2 font-semibold text-muted-foreground">#</th>
                  <th className="sticky left-[72px] bg-card text-left p-2 font-semibold text-muted-foreground min-w-[160px]">Player</th>
                  {players.map((p) => (
                    <th key={p.id} className="p-2 text-center font-semibold bg-destructive/80 text-destructive-foreground border border-border min-w-[28px]">
                      {p.jerseyNumber}
                    </th>
                  ))}
                  <th className="p-2 text-center font-bold bg-muted">TOT</th>
                </tr>
              </thead>
              <tbody>
                {players.map((from, r) => {
                  const rowMax = Math.max(...matrix[r]);
                  return (
                    <tr key={from.id}>
                      <td className="sticky left-0 bg-card p-2 font-mono text-[10px] text-muted-foreground border-b border-border">
                        {from.role || "-"}
                      </td>
                      <td className="sticky left-[40px] bg-card p-2 text-center font-bold text-destructive border-b border-border">
                        {from.jerseyNumber}
                      </td>
                      <td className="sticky left-[72px] bg-card p-2 whitespace-nowrap border-b border-border">
                        {from.name}
                      </td>
                      {matrix[r].map((val, c) => (
                        <td
                          key={c}
                          className={`p-1 text-center border border-border/50 ${cellBg(val, rowMax)}`}
                          title={`${from.name} → ${players[c].name}: ${val}`}
                        >
                          {val > 0 ? val : ""}
                        </td>
                      ))}
                      <td className="p-2 text-center font-bold bg-muted/60 border border-border">{rowTotals[r]}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="sticky left-0 bg-muted p-2"></td>
                  <td className="sticky left-[40px] bg-muted p-2"></td>
                  <td className="sticky left-[72px] bg-muted p-2 font-bold">TOTAL</td>
                  {colTotals.map((t, i) => (
                    <td key={i} className="p-2 text-center font-bold bg-muted border border-border">{t}</td>
                  ))}
                  <td className="p-2 text-center font-bold bg-muted border border-border">{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Distribution map */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Passes Distribution Map</p>
            <DistributionMap players={players} positions={positions} matrix={matrix} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DistributionMapProps {
  players: { id: string; jerseyNumber: number; name: string }[];
  positions: Array<{ x: number; y: number; count: number } | null>;
  matrix: number[][];
}

function DistributionMap({ players, positions, matrix }: DistributionMapProps) {
  // Pitch oriented vertically (attacking up), 100 wide x 150 tall viewBox
  const W = 100;
  const H = 150;

  // Map (x: 0-100 along length, y: 0-100 across width) → (svgX: across width, svgY: from bottom up)
  const toSvg = (x: number, y: number) => ({
    sx: y, // y is across pitch width → horizontal in vertical orientation
    sy: H - (x / 100) * H, // x is along length → invert so attack goes upward
  });

  const maxPasses = Math.max(1, ...matrix.flat());

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-card border border-border rounded">
      {/* pitch */}
      <rect x="0" y="0" width={W} height={H} fill="hsl(var(--muted))" opacity="0.15" />
      <rect x="0" y="0" width={W} height={H} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.5" />
      <circle cx={W / 2} cy={H / 2} r="9" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.5" />
      <rect x={(W - 44) / 2} y="0" width="44" height="18" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.5" />
      <rect x={(W - 44) / 2} y={H - 18} width="44" height="18" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.5" />

      {/* edges */}
      {players.map((from, r) =>
        players.map((to, c) => {
          if (r === c) return null;
          const v = matrix[r][c];
          if (v === 0) return null;
          const a = positions[r];
          const b = positions[c];
          if (!a || !b) return null;
          const pa = toSvg(a.x, a.y);
          const pb = toSvg(b.x, b.y);
          const w = 0.2 + (v / maxPasses) * 1.6;
          const op = 0.25 + (v / maxPasses) * 0.55;
          return (
            <line
              key={`${r}-${c}`}
              x1={pa.sx}
              y1={pa.sy}
              x2={pb.sx}
              y2={pb.sy}
              stroke="hsl(var(--foreground))"
              strokeWidth={w}
              opacity={op}
            />
          );
        })
      )}

      {/* nodes */}
      {players.map((p, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const { sx, sy } = toSvg(pos.x, pos.y);
        return (
          <g key={p.id}>
            <circle cx={sx} cy={sy} r="3.4" fill="hsl(var(--destructive))" stroke="hsl(var(--background))" strokeWidth="0.4" />
            <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central" fontSize="2.6" fontWeight="700" fill="hsl(var(--destructive-foreground))">
              {p.jerseyNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
