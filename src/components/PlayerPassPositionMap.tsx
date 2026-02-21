import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlayerPassData, PassEvent } from "@/hooks/usePlayerPassEvents";

interface PlayerPassPositionMapProps {
  passData: PlayerPassData;
  showLines?: boolean;
}

type PassFilter = 'all' | 'successful' | 'unsuccessful';

function PitchPassMap({ passes, filter }: { passes: PassEvent[]; filter: PassFilter }) {
  const pitchWidth = 100;
  const pitchHeight = 68;

  const scaleX = (x: number) => x;
  const scaleY = (y: number) => (y / 100) * pitchHeight;

  const filtered = filter === 'all'
    ? passes
    : filter === 'successful'
      ? passes.filter(p => p.successful)
      : passes.filter(p => !p.successful);

  return (
    <svg viewBox="-3 0 106 68" className="w-full h-auto border-2 border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
      {/* Arrow markers */}
      <defs>
        <marker id="arrow-success" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
          <polygon points="0 0, 3 1.5, 0 3" fill="#22c55e" />
        </marker>
        <marker id="arrow-fail" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
          <polygon points="0 0, 3 1.5, 0 3" fill="#f97316" />
        </marker>
      </defs>

      {/* Pitch outline */}
      <rect x="0" y="0" width="100" height="68" fill="none" stroke="#22c55e" strokeWidth="0.5" />

      {/* Halfway line */}
      <line x1="50" y1="0" x2="50" y2="68" stroke="#22c55e" strokeWidth="0.3" />

      {/* Center circle */}
      <circle cx="50" cy="34" r="9.15" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      <circle cx="50" cy="34" r="0.5" fill="#22c55e" />

      {/* Left penalty area */}
      <rect x="0" y="13.84" width="16.5" height="40.32" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" strokeWidth="0.3" />
      <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      <circle cx="11" cy="34" r="0.4" fill="#22c55e" />
      <path d="M 16.5 27.5 A 9.15 9.15 0 0 1 16.5 40.5" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      {/* Left goal */}
      <rect x="-2.5" y="29.84" width="3" height="8.32" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0.5" />
      <line x1="-2" y1="31" x2="-2" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="-1" y1="31" x2="-1" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="-2.5" y1="32" x2="0" y2="32" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="-2.5" y1="34" x2="0" y2="34" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="-2.5" y1="36" x2="0" y2="36" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />

      {/* Right penalty area */}
      <rect x="83.5" y="13.84" width="16.5" height="40.32" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" strokeWidth="0.3" />
      <rect x="94.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      <circle cx="89" cy="34" r="0.4" fill="#22c55e" />
      <path d="M 83.5 27.5 A 9.15 9.15 0 0 0 83.5 40.5" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      {/* Right goal */}
      <rect x="99.5" y="29.84" width="3" height="8.32" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0.5" />
      <line x1="101" y1="31" x2="101" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="102" y1="31" x2="102" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="100" y1="32" x2="102.5" y2="32" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="100" y1="34" x2="102.5" y2="34" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
      <line x1="100" y1="36" x2="102.5" y2="36" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />

      {/* Corner arcs */}
      <path d="M 0 1 A 1 1 0 0 0 1 0" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      <path d="M 99 0 A 1 1 0 0 0 100 1" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      <path d="M 0 67 A 1 1 0 0 1 1 68" fill="none" stroke="#22c55e" strokeWidth="0.3" />
      <path d="M 100 67 A 1 1 0 0 0 99 68" fill="none" stroke="#22c55e" strokeWidth="0.3" />

      {/* Zone dividers */}
      <line x1="33" y1="0" x2="33" y2="68" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" strokeDasharray="1,1" />
      <line x1="67" y1="0" x2="67" y2="68" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" strokeDasharray="1,1" />

      {/* Zone labels */}
      <text x="16.5" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">DEF</text>
      <text x="50" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">MID</text>
      <text x="83.5" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">FIN</text>

      {/* Pass lines */}
      {filtered.map((pass) => {
        if (pass.endX === null || pass.endY === null) return null;
        const isSuccess = pass.successful;
        return (
          <line
            key={`line-${pass.id}`}
            x1={scaleX(pass.x)}
            y1={scaleY(pass.y)}
            x2={scaleX(pass.endX)}
            y2={scaleY(pass.endY)}
            stroke={isSuccess ? "#22c55e" : "#f97316"}
            strokeWidth="0.35"
            opacity="0.45"
            markerEnd={isSuccess ? "url(#arrow-success)" : "url(#arrow-fail)"}
          />
        );
      })}

      {/* Pass start dots — small & transparent */}
      {filtered.map((pass) => (
        <circle
          key={`start-${pass.id}`}
          cx={scaleX(pass.x)}
          cy={scaleY(pass.y)}
          r="1"
          fill={pass.successful ? "#22c55e" : "#f97316"}
          opacity="0.5"
        />
      ))}

      {/* End markers for unsuccessful passes */}
      {filtered.map((pass) => {
        if (pass.endX === null || pass.endY === null || pass.successful) return null;
        return (
          <circle
            key={`end-${pass.id}`}
            cx={scaleX(pass.endX)}
            cy={scaleY(pass.endY)}
            r="0.8"
            fill="#ef4444"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
}

export function PlayerPassPositionMap({ passData }: PlayerPassPositionMapProps) {
  const [passFilter, setPassFilter] = useState<PassFilter>('all');

  const firstHalf = passData.byHalf?.[0] || { passes: [], totalPasses: 0 };
  const secondHalf = passData.byHalf?.[1] || { passes: [], totalPasses: 0 };

  const successCount = passData.successfulPasses;
  const failCount = passData.unsuccessfulPasses;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Pass Map</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All ({passData.totalPasses})</TabsTrigger>
            <TabsTrigger value="first">1st Half ({firstHalf.totalPasses})</TabsTrigger>
            <TabsTrigger value="second">2nd Half ({secondHalf.totalPasses})</TabsTrigger>
          </TabsList>

          {/* Pass type filter */}
          <div className="flex justify-center mb-3">
            <ToggleGroup type="single" value={passFilter} onValueChange={(v) => v && setPassFilter(v as PassFilter)} size="sm">
              <ToggleGroupItem value="all" className="text-xs px-3">All</ToggleGroupItem>
              <ToggleGroupItem value="successful" className="text-xs px-3 data-[state=on]:bg-green-100 data-[state=on]:text-green-800">
                ✓ Success ({successCount})
              </ToggleGroupItem>
              <ToggleGroupItem value="unsuccessful" className="text-xs px-3 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800">
                ✗ Failed ({failCount})
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <TabsContent value="all" className="mt-0">
            <PitchPassMap passes={passData.passes} filter={passFilter} />
          </TabsContent>
          <TabsContent value="first" className="mt-0">
            <PitchPassMap passes={firstHalf.passes} filter={passFilter} />
          </TabsContent>
          <TabsContent value="second" className="mt-0">
            <PitchPassMap passes={secondHalf.passes} filter={passFilter} />
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Successful</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Unsuccessful</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Failed end point</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
