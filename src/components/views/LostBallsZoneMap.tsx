import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LostBallEvent } from '@/hooks/usePlayerLostBalls';

interface LostBallsZoneMapProps {
  title: string;          // e.g. "Lost Balls After Passes From"
  events: LostBallEvent[];
  /** Which endpoint anchors the zone grid: origin (FROM) or destination (TO) */
  anchor: 'origin' | 'end';
  /** Color hint applied to arrows */
  accent?: string;
}

const COLS = 5;   // across pitch width (y: 0-100)
const ROWS = 6;   // along pitch length (x: 0-100)

/**
 * Vertical-pitch (W x H = 100 x 150) zone grid that renders:
 *  - 6x3 grid of zones, shaded by event count
 *  - count label per zone
 *  - directional arrows from origin → end for every event
 *  - sidebar with Total Events / Peak Zone / Active Zones / Directional Flows
 */
export function LostBallsZoneMap({ title, events, anchor, accent = 'hsl(var(--foreground))' }: LostBallsZoneMapProps) {
  const W = 100;
  const H = 150;

  // toSvg: pitch x (0-100, length) → svgY (vertical, attack upward)
  //         pitch y (0-100, width)  → svgX (horizontal)
  const toSvg = (x: number, y: number) => ({
    sx: y,
    sy: H - (x / 100) * H,
  });

  const { grid, peak, activeZones, peakIndex } = useMemo(() => {
    const g: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    events.forEach((e) => {
      const ax = anchor === 'origin' ? e.x : e.endX;
      const ay = anchor === 'origin' ? e.y : e.endY;
      const col = Math.min(COLS - 1, Math.max(0, Math.floor((ax / 100) * COLS)));
      const row = Math.min(ROWS - 1, Math.max(0, Math.floor((ay / 100) * ROWS)));
      g[row][col] += 1;
    });
    let p = 0;
    let pIdx = -1;
    let active = 0;
    g.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v > 0) active += 1;
        if (v > p) {
          p = v;
          pIdx = r * COLS + c;
        }
      }),
    );
    return { grid: g, peak: p, activeZones: active, peakIndex: pIdx };
  }, [events, anchor]);

  const total = events.length;
  const cellW = W / COLS;
  const cellH = H / ROWS;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
          {/* Pitch */}
          <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="w-full h-auto bg-emerald-900/20 dark:bg-emerald-950/40 rounded">
            <defs>
              <marker
                id={`arrow-${anchor}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="3"
                markerHeight="3"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
              </marker>
            </defs>

            {/* Pitch outline */}
            <rect x="0" y="0" width={W} height={H} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.5" />
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.5" />
            <circle cx={W / 2} cy={H / 2} r="9" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.5" />
            <rect x={(W - 44) / 2} y="0" width="44" height="18" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.5" />
            <rect x={(W - 44) / 2} y={H - 18} width="44" height="18" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" opacity="0.5" />

            {/* Zone grid */}
            {grid.map((row, r) =>
              row.map((v, c) => {
                const idx = r * COLS + c;
                const isPeak = idx === peakIndex && v > 0;
                const intensity = peak > 0 ? v / peak : 0;
                const fill = v === 0
                  ? 'hsl(142 60% 25% / 0.15)'
                  : `hsl(142 60% ${45 - intensity * 20}% / ${0.25 + intensity * 0.45})`;
                const x = c * cellW;
                const y = (ROWS - 1 - r) * cellH; // flip row so r=0 is bottom (defensive end)
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={x}
                      y={y}
                      width={cellW}
                      height={cellH}
                      fill={fill}
                      stroke="hsl(var(--background))"
                      strokeWidth="0.4"
                    />
                    {v > 0 && (
                      <text
                        x={x + cellW / 2}
                        y={y + cellH / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="6"
                        fontWeight={isPeak ? 800 : 600}
                        fill="hsl(var(--foreground))"
                      >
                        {v}
                      </text>
                    )}
                  </g>
                );
              }),
            )}

            {/* Arrows */}
            {events.map((e) => {
              const a = toSvg(e.x, e.y);
              const b = toSvg(e.endX, e.endY);
              const dx = b.sx - a.sx;
              const dy = b.sy - a.sy;
              const len = Math.hypot(dx, dy);
              if (len < 1.2) return null;
              return (
                <line
                  key={e.id}
                  x1={a.sx}
                  y1={a.sy}
                  x2={b.sx}
                  y2={b.sy}
                  stroke={accent}
                  strokeWidth="0.5"
                  opacity="0.7"
                  markerEnd={`url(#arrow-${anchor})`}
                />
              );
            })}
          </svg>

          {/* Sidebar metrics */}
          <div className="space-y-2 text-sm">
            <Row label="Total Events" value={total} />
            <Row label="Peak Zone" value={peak} />
            <Row label="Active Zones" value={`${activeZones}/${ROWS * COLS}`} />
            <Row label="Directional Flows" value={`${total} link${total === 1 ? '' : 's'}`} highlight />
            <p className="text-[11px] text-amber-600 dark:text-amber-500 pt-1">
              Arrows show passes – key inaccurate
            </p>
            <div className="text-[11px] text-muted-foreground pt-1 border-t">
              Zone grid {COLS} × {ROWS} · {total} directional links
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}
