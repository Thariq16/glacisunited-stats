import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ZonesOfControlData, ZoneCell } from "@/hooks/useMatchVisualizationData";

interface ZonesOfControlProps {
  zones: ZonesOfControlData;
  homeTeamName: string;
  awayTeamName: string;
}

type HalfFilter = "all" | "first" | "second";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function ZonesOfControl({ zones, homeTeamName, awayTeamName }: ZonesOfControlProps) {
  const [halfFilter, setHalfFilter] = useState<HalfFilter>("all");

  const grid: ZoneCell[][] = useMemo(() => {
    if (halfFilter === "first") return zones.firstHalf;
    if (halfFilter === "second") return zones.secondHalf;
    return zones.all;
  }, [zones, halfFilter]);

  const width = 600;
  const height = 400;
  const cellW = width / zones.cols;
  const cellH = height / zones.rows;

  const homeColor = "hsl(var(--primary))";
  const awayColor = "hsl(0 75% 60%)";

  const homeInitials = getInitials(homeTeamName);
  const awayInitials = getInitials(awayTeamName);
  const threshold = zones.threshold;

  const getCellInfo = (cell: ZoneCell) => {
    if (cell.total === 0) return { fill: "hsl(var(--muted))", opacity: 0.15, owner: "none" as const };
    if (cell.homeShare >= threshold) {
      const intensity = 0.4 + ((cell.homeShare - threshold) / (1 - threshold)) * 0.55;
      return { fill: homeColor, opacity: intensity, owner: "home" as const };
    }
    if (cell.awayShare >= threshold) {
      const intensity = 0.4 + ((cell.awayShare - threshold) / (1 - threshold)) * 0.55;
      return { fill: awayColor, opacity: intensity, owner: "away" as const };
    }
    return { fill: "hsl(var(--muted-foreground))", opacity: 0.2, owner: "contested" as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Zones of Control</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              A team owns a zone when they have more than {Math.round(threshold * 100)}% of touches in it.
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={halfFilter}
            onValueChange={(v) => v && setHalfFilter(v as HalfFilter)}
            size="sm"
          >
            <ToggleGroupItem value="all" className="text-xs px-3">Full Match</ToggleGroupItem>
            <ToggleGroupItem value="first" className="text-xs px-3">1st Half</ToggleGroupItem>
            <ToggleGroupItem value="second" className="text-xs px-3">2nd Half</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto flex justify-center">
          <div className="min-w-[600px]">
            <svg
              width="100%"
              viewBox={`0 0 ${width} ${height + 60}`}
              className="bg-card border border-border rounded"
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const { fill, opacity, owner } = getCellInfo(cell);
                  const cx = c * cellW + cellW / 2;
                  const cy = r * cellH + cellH / 2;
                  return (
                    <g key={`${r}-${c}`}>
                      <rect
                        x={c * cellW}
                        y={r * cellH}
                        width={cellW}
                        height={cellH}
                        fill={fill}
                        opacity={opacity}
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                      {(owner === "home" || owner === "away") && (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy - 6}
                            r="14"
                            fill="hsl(var(--card))"
                            stroke={owner === "home" ? homeColor : awayColor}
                            strokeWidth="2"
                          />
                          <text
                            x={cx}
                            y={cy - 6}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                            fontWeight="700"
                            fill={owner === "home" ? homeColor : awayColor}
                          >
                            {owner === "home" ? homeInitials : awayInitials}
                          </text>
                          <text
                            x={cx}
                            y={cy + 16}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="600"
                            fill="hsl(var(--foreground))"
                            opacity={0.85}
                          >
                            {owner === "home"
                              ? `${Math.round(cell.homeShare * 100)}%`
                              : `${Math.round(cell.awayShare * 100)}%`}
                          </text>
                        </g>
                      )}
                      {(owner === "contested" || owner === "none") && cell.total > 0 && (
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="hsl(var(--muted-foreground))"
                        >
                          {cell.total}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              <rect x="0" y="0" width={width} height={height} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.4" />
              <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />
              <circle cx={width / 2} cy={height / 2} r="50" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />
              <rect x="0" y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />
              <rect x={width * 0.84} y={height * 0.2} width={width * 0.16} height={height * 0.6} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.4" />

              <g transform={`translate(${width / 2 - 40}, ${height + 30})`}>
                {[0, 1, 2, 3].map((i) => (
                  <polygon
                    key={i}
                    points={`${i * 22},0 ${i * 22 + 14},8 ${i * 22},16`}
                    fill="hsl(var(--muted-foreground))"
                    opacity={0.4 + i * 0.15}
                  />
                ))}
                <text x="40" y="38" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
                  Attacking Direction ({homeTeamName})
                </text>
              </g>
            </svg>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: homeColor, opacity: 0.7 }} />
                <span className="font-medium">{homeTeamName}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: awayColor, opacity: 0.7 }} />
                <span className="font-medium">{awayTeamName}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted-foreground/30" />
                <span className="text-muted-foreground">Contested</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
