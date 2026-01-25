import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerPassData } from "@/hooks/usePlayerPassEvents";

interface PlayerPassThirdMapProps {
  passData: PlayerPassData;
}

export function PlayerPassThirdMap({ passData }: PlayerPassThirdMapProps) {
  const pitchWidth = 300;
  const pitchHeight = 200;
  const thirdWidth = pitchWidth / 3;

  const maxPasses = Math.max(
    passData.passesDefensiveThird,
    passData.passesMiddleThird,
    passData.passesFinalThird,
    1
  );

  const getOpacity = (count: number) => {
    return Math.max(0.2, count / maxPasses);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Passes by Third</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${pitchWidth} ${pitchHeight}`} className="w-full h-auto border rounded-lg bg-green-800/90">
          {/* Pitch markings */}
          <rect x="0" y="0" width={pitchWidth} height={pitchHeight} fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          
          {/* Defensive third heat zone */}
          <rect
            x="0"
            y="0"
            width={thirdWidth}
            height={pitchHeight}
            fill="#3b82f6"
            opacity={getOpacity(passData.passesDefensiveThird)}
          />
          
          {/* Middle third heat zone */}
          <rect
            x={thirdWidth}
            y="0"
            width={thirdWidth}
            height={pitchHeight}
            fill="#eab308"
            opacity={getOpacity(passData.passesMiddleThird)}
          />
          
          {/* Final third heat zone */}
          <rect
            x={thirdWidth * 2}
            y="0"
            width={thirdWidth}
            height={pitchHeight}
            fill="#ef4444"
            opacity={getOpacity(passData.passesFinalThird)}
          />

          {/* Third dividers */}
          <line x1={thirdWidth} y1="0" x2={thirdWidth} y2={pitchHeight} stroke="white" strokeWidth="1" opacity="0.7" />
          <line x1={thirdWidth * 2} y1="0" x2={thirdWidth * 2} y2={pitchHeight} stroke="white" strokeWidth="1" opacity="0.7" />

          {/* Center line */}
          <line x1={pitchWidth / 2} y1="0" x2={pitchWidth / 2} y2={pitchHeight} stroke="white" strokeWidth="0.5" opacity="0.3" />
          
          {/* Center circle */}
          <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="20" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
          
          {/* Left penalty area */}
          <rect x="0" y={pitchHeight / 2 - 40} width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
          
          {/* Right penalty area */}
          <rect x={pitchWidth - 40} y={pitchHeight / 2 - 40} width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />

          {/* Pass counts */}
          <text x={thirdWidth / 2} y={pitchHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="24" fontWeight="bold">
            {passData.passesDefensiveThird}
          </text>
          <text x={thirdWidth * 1.5} y={pitchHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="24" fontWeight="bold">
            {passData.passesMiddleThird}
          </text>
          <text x={thirdWidth * 2.5} y={pitchHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="24" fontWeight="bold">
            {passData.passesFinalThird}
          </text>

          {/* Labels */}
          <text x={thirdWidth / 2} y={pitchHeight - 10} textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
            Defensive
          </text>
          <text x={thirdWidth * 1.5} y={pitchHeight - 10} textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
            Middle
          </text>
          <text x={thirdWidth * 2.5} y={pitchHeight - 10} textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
            Final
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
