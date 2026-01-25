import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";

interface PlayerPassPositionMapProps {
  passData: PlayerPassData;
  showLines?: boolean;
}

export function PlayerPassPositionMap({ passData, showLines = true }: PlayerPassPositionMapProps) {
  const pitchWidth = 300;
  const pitchHeight = 200;

  // Scale coordinates from 0-100 to pitch dimensions
  const scaleX = (x: number) => (x / 100) * pitchWidth;
  const scaleY = (y: number) => (y / 100) * pitchHeight;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Pass Map</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${pitchWidth} ${pitchHeight}`} className="w-full h-auto border rounded-lg bg-green-800/90">
          {/* Pitch markings */}
          <rect x="0" y="0" width={pitchWidth} height={pitchHeight} fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          
          {/* Center line */}
          <line x1={pitchWidth / 2} y1="0" x2={pitchWidth / 2} y2={pitchHeight} stroke="white" strokeWidth="1" opacity="0.5" />
          
          {/* Center circle */}
          <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="20" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          
          {/* Left penalty area */}
          <rect x="0" y={pitchHeight / 2 - 40} width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          
          {/* Right penalty area */}
          <rect x={pitchWidth - 40} y={pitchHeight / 2 - 40} width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          
          {/* Goal areas */}
          <rect x="0" y={pitchHeight / 2 - 20} width="15" height="40" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          <rect x={pitchWidth - 15} y={pitchHeight / 2 - 20} width="15" height="40" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />

          {/* Third dividers */}
          <line x1={pitchWidth / 3} y1="0" x2={pitchWidth / 3} y2={pitchHeight} stroke="white" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />
          <line x1={(pitchWidth / 3) * 2} y1="0" x2={(pitchWidth / 3) * 2} y2={pitchHeight} stroke="white" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />

          {/* Pass lines */}
          {showLines && passData.passes.map((pass) => {
            if (pass.endX === null || pass.endY === null) return null;
            return (
              <line
                key={`line-${pass.id}`}
                x1={scaleX(pass.x)}
                y1={scaleY(pass.y)}
                x2={scaleX(pass.endX)}
                y2={scaleY(pass.endY)}
                stroke={pass.successful ? "#22c55e" : "#ef4444"}
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}

          {/* Pass start points */}
          {passData.passes.map((pass) => (
            <circle
              key={`start-${pass.id}`}
              cx={scaleX(pass.x)}
              cy={scaleY(pass.y)}
              r="2"
              fill={pass.successful ? "#22c55e" : "#ef4444"}
              opacity="0.7"
            />
          ))}
        </svg>
        
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Successful</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Unsuccessful</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
