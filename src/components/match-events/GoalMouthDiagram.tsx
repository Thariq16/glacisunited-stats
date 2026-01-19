import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export type ShotZone = 
  | 'top_left' | 'top_center' | 'top_right'
  | 'middle_left' | 'middle_center' | 'middle_right'
  | 'bottom_left' | 'bottom_center' | 'bottom_right'
  | 'wide_left' | 'wide_right' | 'over';

export interface ShotPlacement {
  x: number;
  y: number;
  zone: ShotZone;
}

interface GoalMouthDiagramProps {
  selectedPlacement: ShotPlacement | null;
  onSelect: (placement: ShotPlacement) => void;
  outcome?: 'goal' | 'on_target' | 'off_target' | 'blocked';
  className?: string;
}

const ZONE_LABELS: Record<ShotZone, string> = {
  top_left: 'Top Left',
  top_center: 'Top Center',
  top_right: 'Top Right',
  middle_left: 'Middle Left',
  middle_center: 'Middle Center',
  middle_right: 'Middle Right',
  bottom_left: 'Bottom Left',
  bottom_center: 'Bottom Center',
  bottom_right: 'Bottom Right',
  wide_left: 'Wide Left',
  wide_right: 'Wide Right',
  over: 'Over Bar',
};

function getZoneFromPosition(x: number, y: number): ShotZone {
  // Goal frame is roughly x: 15-85, y: 20-90
  // Above or beside the goal
  if (y < 20) return 'over';
  if (x < 15) return 'wide_left';
  if (x > 85) return 'wide_right';
  
  // Inside goal frame - divide into 9 zones
  const relX = (x - 15) / 70; // 0-1 within goal width
  const relY = (y - 20) / 70; // 0-1 within goal height
  
  const col = relX < 0.33 ? 'left' : relX > 0.66 ? 'right' : 'center';
  const row = relY < 0.33 ? 'top' : relY > 0.66 ? 'bottom' : 'middle';
  
  return `${row}_${col}` as ShotZone;
}

export function GoalMouthDiagram({
  selectedPlacement,
  onSelect,
  outcome,
  className,
}: GoalMouthDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  const getPositionFromEvent = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return null;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    return {
      x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)),
      y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)),
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getPositionFromEvent(e);
    if (!pos) return;
    
    const zone = getZoneFromPosition(pos.x, pos.y);
    onSelect({ x: pos.x, y: pos.y, zone });
  }, [getPositionFromEvent, onSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getPositionFromEvent(e);
    setHoverPosition(pos);
  }, [getPositionFromEvent]);

  const hoverZone = hoverPosition ? getZoneFromPosition(hoverPosition.x, hoverPosition.y) : null;
  
  // Determine marker color based on outcome
  const getMarkerColor = () => {
    switch (outcome) {
      case 'goal': return '#22C55E'; // Green
      case 'on_target': return '#F59E0B'; // Amber
      case 'off_target': return '#EF4444'; // Red
      case 'blocked': return '#6B7280'; // Gray
      default: return '#3B82F6'; // Blue
    }
  };

  const isOnTarget = selectedPlacement && !['wide_left', 'wide_right', 'over'].includes(selectedPlacement.zone);

  return (
    <div className={cn('relative', className)}>
      <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center">
        <span>Shot Placement</span>
        {hoverPosition && hoverZone && (
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
            {ZONE_LABELS[hoverZone]}
          </span>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full max-w-xs border rounded-lg cursor-crosshair bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPosition(null)}
      >
        {/* Background - crowd/stands effect */}
        <rect x="0" y="0" width="100" height="20" fill="rgba(100, 100, 100, 0.3)" />
        
        {/* Goal frame - crossbar */}
        <rect x="14" y="18" width="72" height="3" fill="#FFFFFF" stroke="#666" strokeWidth="0.5" rx="1" />
        
        {/* Goal frame - left post */}
        <rect x="12" y="18" width="3" height="75" fill="#FFFFFF" stroke="#666" strokeWidth="0.5" rx="1" />
        
        {/* Goal frame - right post */}
        <rect x="85" y="18" width="3" height="75" fill="#FFFFFF" stroke="#666" strokeWidth="0.5" rx="1" />
        
        {/* Goal net background */}
        <rect x="15" y="21" width="70" height="69" fill="rgba(255, 255, 255, 0.4)" />
        
        {/* Net mesh pattern */}
        {[...Array(8)].map((_, i) => (
          <line
            key={`v-${i}`}
            x1={15 + (i + 1) * 7.77}
            y1="21"
            x2={15 + (i + 1) * 7.77}
            y2="90"
            stroke="rgba(200, 200, 200, 0.6)"
            strokeWidth="0.3"
          />
        ))}
        {[...Array(7)].map((_, i) => (
          <line
            key={`h-${i}`}
            x1="15"
            y1={21 + (i + 1) * 9.86}
            x2="85"
            y2={21 + (i + 1) * 9.86}
            stroke="rgba(200, 200, 200, 0.6)"
            strokeWidth="0.3"
          />
        ))}
        
        {/* Zone divider lines (dashed) */}
        {/* Vertical dividers (thirds) */}
        <line x1="38.33" y1="21" x2="38.33" y2="90" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="61.66" y1="21" x2="61.66" y2="90" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2,2" />
        {/* Horizontal dividers (thirds) */}
        <line x1="15" y1="44" x2="85" y2="44" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="15" y1="67" x2="85" y2="67" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2,2" />

        {/* "Over" zone indicator */}
        <text x="50" y="12" fill="rgba(255,255,255,0.6)" fontSize="4" textAnchor="middle">
          OVER
        </text>
        
        {/* "Wide" zone indicators */}
        <text x="6" y="55" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle" transform="rotate(-90, 6, 55)">
          WIDE
        </text>
        <text x="94" y="55" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle" transform="rotate(90, 94, 55)">
          WIDE
        </text>

        {/* Hover indicator */}
        {hoverPosition && (
          <circle
            cx={hoverPosition.x}
            cy={hoverPosition.y}
            r="3"
            fill={hoverZone && !['wide_left', 'wide_right', 'over'].includes(hoverZone) 
              ? 'rgba(34, 197, 94, 0.5)' 
              : 'rgba(239, 68, 68, 0.5)'}
            stroke="white"
            strokeWidth="0.5"
          />
        )}

        {/* Selected shot placement */}
        {selectedPlacement && (
          <g>
            {/* Outer ring */}
            <circle
              cx={selectedPlacement.x}
              cy={selectedPlacement.y}
              r="5"
              fill="none"
              stroke={getMarkerColor()}
              strokeWidth="1"
              opacity="0.5"
            >
              <animate
                attributeName="r"
                values="4;6;4"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Inner marker */}
            <circle
              cx={selectedPlacement.x}
              cy={selectedPlacement.y}
              r="3"
              fill={getMarkerColor()}
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Outcome icon */}
            {outcome === 'goal' && (
              <text
                x={selectedPlacement.x}
                y={selectedPlacement.y + 1.5}
                fill="white"
                fontSize="4"
                textAnchor="middle"
                fontWeight="bold"
              >
                ⚽
              </text>
            )}
            {outcome === 'on_target' && (
              <text
                x={selectedPlacement.x}
                y={selectedPlacement.y + 1.5}
                fill="white"
                fontSize="4"
                textAnchor="middle"
                fontWeight="bold"
              >
                🧤
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Zone info */}
      {selectedPlacement && (
        <div className="mt-2 text-xs flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getMarkerColor() }}
          />
          <span className="font-medium">{ZONE_LABELS[selectedPlacement.zone]}</span>
          {isOnTarget ? (
            <span className="text-green-600 text-xs">(On Target)</span>
          ) : (
            <span className="text-red-600 text-xs">(Off Target)</span>
          )}
        </div>
      )}
    </div>
  );
}