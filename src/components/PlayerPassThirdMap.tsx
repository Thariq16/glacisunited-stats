import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerPassData, HalfPassData } from "@/hooks/usePlayerPassEvents";

interface PlayerPassThirdMapProps {
  passData: PlayerPassData;
}

function ThirdHeatMap({ data }: { data: { passesDefensiveThird: number; passesMiddleThird: number; passesFinalThird: number } }) {
  // Use real pitch proportions (100x68) for consistent coordinates
  const pitchWidth = 100;
  const pitchHeight = 68;
  const thirdWidth = pitchWidth / 3;

  const maxPasses = Math.max(
    data.passesDefensiveThird,
    data.passesMiddleThird,
    data.passesFinalThird,
    1
  );

  const getOpacity = (count: number) => {
    return Math.max(0.2, count / maxPasses);
  };

  return (
    <svg viewBox={`0 0 ${pitchWidth} ${pitchHeight}`} className="w-full h-auto border rounded-lg bg-green-800/90">
      {/* Pitch markings */}
      <rect x="0" y="0" width={pitchWidth} height={pitchHeight} fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
      
      {/* Defensive third heat zone */}
      <rect
        x="0"
        y="0"
        width={thirdWidth}
        height={pitchHeight}
        fill="#3b82f6"
        opacity={getOpacity(data.passesDefensiveThird)}
      />
      
      {/* Middle third heat zone */}
      <rect
        x={thirdWidth}
        y="0"
        width={thirdWidth}
        height={pitchHeight}
        fill="#eab308"
        opacity={getOpacity(data.passesMiddleThird)}
      />
      
      {/* Final third heat zone */}
      <rect
        x={thirdWidth * 2}
        y="0"
        width={thirdWidth}
        height={pitchHeight}
        fill="#ef4444"
        opacity={getOpacity(data.passesFinalThird)}
      />

      {/* Third dividers */}
      <line x1={thirdWidth} y1="0" x2={thirdWidth} y2={pitchHeight} stroke="white" strokeWidth="0.5" opacity="0.7" />
      <line x1={thirdWidth * 2} y1="0" x2={thirdWidth * 2} y2={pitchHeight} stroke="white" strokeWidth="0.5" opacity="0.7" />

      {/* Center line */}
      <line x1={pitchWidth / 2} y1="0" x2={pitchWidth / 2} y2={pitchHeight} stroke="white" strokeWidth="0.2" opacity="0.3" />
      
      {/* Center circle */}
      <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="9.15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.3" />
      
      {/* Left penalty area */}
      <rect x="0" y={(pitchHeight - 40.32) / 2} width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.3" />
      
      {/* Right penalty area */}
      <rect x={pitchWidth - 16.5} y={(pitchHeight - 40.32) / 2} width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.3" />

      {/* Pass counts */}
      <text x={thirdWidth / 2} y={pitchHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold">
        {data.passesDefensiveThird}
      </text>
      <text x={thirdWidth * 1.5} y={pitchHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold">
        {data.passesMiddleThird}
      </text>
      <text x={thirdWidth * 2.5} y={pitchHeight / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold">
        {data.passesFinalThird}
      </text>

      {/* Labels */}
      <text x={thirdWidth / 2} y={pitchHeight - 4} textAnchor="middle" fill="white" fontSize="4" opacity="0.8">
        Defensive
      </text>
      <text x={thirdWidth * 1.5} y={pitchHeight - 4} textAnchor="middle" fill="white" fontSize="4" opacity="0.8">
        Middle
      </text>
      <text x={thirdWidth * 2.5} y={pitchHeight - 4} textAnchor="middle" fill="white" fontSize="4" opacity="0.8">
        Final
      </text>
    </svg>
  );
}

export function PlayerPassThirdMap({ passData }: PlayerPassThirdMapProps) {
  const firstHalf = passData.byHalf?.[0] || { passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0, totalPasses: 0 };
  const secondHalf = passData.byHalf?.[1] || { passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0, totalPasses: 0 };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Passes by Third</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="all">All ({passData.totalPasses})</TabsTrigger>
            <TabsTrigger value="first">1st Half ({firstHalf.totalPasses})</TabsTrigger>
            <TabsTrigger value="second">2nd Half ({secondHalf.totalPasses})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ThirdHeatMap data={passData} />
          </TabsContent>
          
          <TabsContent value="first">
            <ThirdHeatMap data={firstHalf} />
          </TabsContent>
          
          <TabsContent value="second">
            <ThirdHeatMap data={secondHalf} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
