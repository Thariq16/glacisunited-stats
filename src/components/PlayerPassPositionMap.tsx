import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerPassData, HalfPassData, PassEvent } from "@/hooks/usePlayerPassEvents";

interface PlayerPassPositionMapProps {
  passData: PlayerPassData;
  showLines?: boolean;
}

// Pitch SVG component for rendering passes
function PitchPassMap({ passes, jerseyNumber }: { passes: PassEvent[]; jerseyNumber: number }) {
  // Use real pitch proportions (100x68) for consistent coordinates
  const pitchWidth = 100;
  const pitchHeight = 68;

  // Coordinates are stored as 0-100 for both X and Y
  // X maps directly to 0-100, Y needs to be scaled from 0-100 to 0-68
  const scaleX = (x: number) => x;
  const scaleY = (y: number) => (y / 100) * pitchHeight;

  return (
    <svg viewBox={`0 0 ${pitchWidth} ${pitchHeight}`} className="w-full h-auto border rounded-lg bg-green-800/90">
      {/* Arrow marker definitions */}
      <defs>
        <marker
          id="arrow-success"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 4 2, 0 4" fill="#22c55e" />
        </marker>
        <marker
          id="arrow-fail"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 4 2, 0 4" fill="#f97316" />
        </marker>
      </defs>

      {/* Pitch markings */}
      <rect x="0" y="0" width={pitchWidth} height={pitchHeight} fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
      
      {/* Center line */}
      <line x1={pitchWidth / 2} y1="0" x2={pitchWidth / 2} y2={pitchHeight} stroke="white" strokeWidth="0.3" opacity="0.5" />
      
      {/* Center circle */}
      <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="9.15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
      
      {/* Left penalty area */}
      <rect x="0" y={(pitchHeight - 40.32) / 2} width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
      
      {/* Right penalty area */}
      <rect x={pitchWidth - 16.5} y={(pitchHeight - 40.32) / 2} width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
      
      {/* Goal areas */}
      <rect x="0" y={(pitchHeight - 18.32) / 2} width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
      <rect x={pitchWidth - 5.5} y={(pitchHeight - 18.32) / 2} width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />

      {/* Third dividers */}
      <line x1={pitchWidth / 3} y1="0" x2={pitchWidth / 3} y2={pitchHeight} stroke="white" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.3" />
      <line x1={(pitchWidth / 3) * 2} y1="0" x2={(pitchWidth / 3) * 2} y2={pitchHeight} stroke="white" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.3" />

      {/* Pass lines with arrows */}
      {passes.map((pass) => {
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
            strokeWidth="0.5"
            opacity="0.7"
            markerEnd={isSuccess ? "url(#arrow-success)" : "url(#arrow-fail)"}
          />
        );
      })}

      {/* Pass start points with jersey number */}
      {passes.map((pass) => (
        <g key={`start-${pass.id}`}>
          <circle
            cx={scaleX(pass.x)}
            cy={scaleY(pass.y)}
            r="2"
            fill={pass.successful ? "#22c55e" : "#f97316"}
            stroke="white"
            strokeWidth="0.2"
            opacity="0.9"
          />
          <text
            x={scaleX(pass.x)}
            y={scaleY(pass.y) + 0.6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="1.8"
            fontWeight="bold"
          >
            {jerseyNumber}
          </text>
        </g>
      ))}

      {/* End position markers for unsuccessful passes (red dot) */}
      {passes.map((pass) => {
        if (pass.endX === null || pass.endY === null) return null;
        if (pass.successful) return null;
        return (
          <circle
            key={`end-${pass.id}`}
            cx={scaleX(pass.endX)}
            cy={scaleY(pass.endY)}
            r="1.2"
            fill="#ef4444"
            stroke="white"
            strokeWidth="0.2"
          />
        );
      })}
    </svg>
  );
}

export function PlayerPassPositionMap({ passData }: PlayerPassPositionMapProps) {
  const firstHalf = passData.byHalf?.[0] || { passes: [], totalPasses: 0 };
  const secondHalf = passData.byHalf?.[1] || { passes: [], totalPasses: 0 };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Pass Map</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="all">All ({passData.totalPasses})</TabsTrigger>
            <TabsTrigger value="first">1st Half ({firstHalf.totalPasses})</TabsTrigger>
            <TabsTrigger value="second">2nd Half ({secondHalf.totalPasses})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <PitchPassMap passes={passData.passes} jerseyNumber={passData.jerseyNumber} />
          </TabsContent>
          
          <TabsContent value="first">
            <PitchPassMap passes={firstHalf.passes} jerseyNumber={passData.jerseyNumber} />
          </TabsContent>
          
          <TabsContent value="second">
            <PitchPassMap passes={secondHalf.passes} jerseyNumber={passData.jerseyNumber} />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Successful</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span>Unsuccessful (line)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>End position</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
