import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Position, BallTrailPoint } from './types';

export interface BallPosition {
  x: number;
  y: number;
  jerseyNumber: number;
  playerName: string;
}

interface PitchDiagramProps {
  startPosition: Position | null;
  endPosition: Position | null;
  onStartClick: (pos: Position) => void;
  onEndClick: (pos: Position) => void;
  onClear: () => void;
  requiresEndPosition: boolean;
  ballPosition?: BallPosition | null;
  ballTrail?: BallTrailPoint[];
}

export function PitchDiagram({
  startPosition,
  endPosition,
  onStartClick,
  onEndClick,
  onClear,
  requiresEndPosition,
  ballPosition,
  ballTrail = [],
}: PitchDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null);

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

    if (!startPosition) {
      onStartClick(pos);
    } else if (requiresEndPosition && !endPosition) {
      onEndClick(pos);
    }
  }, [startPosition, endPosition, requiresEndPosition, onStartClick, onEndClick, getPositionFromEvent]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getPositionFromEvent(e);
    setHoverPosition(pos);
  }, [getPositionFromEvent]);

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  // Determine if forward pass (left to right is forward)
  const isForward = startPosition && endPosition && endPosition.x > startPosition.x;

  return (
    <div className="relative">
      {/* Coordinate display */}
      <div className="absolute top-2 left-2 z-10 bg-background/90 px-2 py-1 rounded text-xs font-mono">
        {hoverPosition ? (
          <span>({hoverPosition.x}, {hoverPosition.y})</span>
        ) : (
          <span className="text-muted-foreground">Hover to see coordinates</span>
        )}
      </div>

      {/* Clear button */}
      {(startPosition || endPosition) && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 z-10"
          onClick={onClear}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 z-10 bg-background/90 px-2 py-1 rounded text-xs">
        {!startPosition ? (
          <span className="text-green-600">Click to set START position</span>
        ) : requiresEndPosition && !endPosition ? (
          <span className="text-red-600">Click to set END position</span>
        ) : (
          <span className="text-muted-foreground">Position(s) set</span>
        )}
      </div>

      {/* SVG Pitch */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 68"
        className="w-full border rounded-lg cursor-crosshair"
        style={{ backgroundColor: '#2D5016' }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Pitch outline */}
        <rect x="0" y="0" width="100" height="68" fill="none" stroke="white" strokeWidth="0.5" />

        {/* Halfway line */}
        <line x1="50" y1="0" x2="50" y2="68" stroke="white" strokeWidth="0.3" />

        {/* Center circle */}
        <circle cx="50" cy="34" r="9.15" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="34" r="0.5" fill="white" />

        {/* Left penalty area */}
        <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Left 6-yard box */}
        <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Left penalty spot */}
        <circle cx="11" cy="34" r="0.4" fill="white" />
        {/* Left penalty arc */}
        <path d="M 16.5 27.5 A 9.15 9.15 0 0 1 16.5 40.5" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Left goal */}
        <rect x="-2" y="30.34" width="2" height="7.32" fill="none" stroke="white" strokeWidth="0.3" />

        {/* Right penalty area */}
        <rect x="83.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Right 6-yard box */}
        <rect x="94.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Right penalty spot */}
        <circle cx="89" cy="34" r="0.4" fill="white" />
        {/* Right penalty arc */}
        <path d="M 83.5 27.5 A 9.15 9.15 0 0 0 83.5 40.5" fill="none" stroke="white" strokeWidth="0.3" />
        {/* Right goal */}
        <rect x="100" y="30.34" width="2" height="7.32" fill="none" stroke="white" strokeWidth="0.3" />

        {/* Corner arcs */}
        <path d="M 0 1 A 1 1 0 0 0 1 0" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 99 0 A 1 1 0 0 0 100 1" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 0 67 A 1 1 0 0 1 1 68" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 100 67 A 1 1 0 0 0 99 68" fill="none" stroke="white" strokeWidth="0.3" />

        {/* Zone divider lines (thirds) */}
        <line x1="33" y1="0" x2="33" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" strokeDasharray="1,1" />
        <line x1="67" y1="0" x2="67" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2" strokeDasharray="1,1" />

        {/* Zone labels */}
        <text x="16.5" y="4" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle">DEF</text>
        <text x="50" y="4" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle">MID</text>
        <text x="83.5" y="4" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle">FIN</text>

        {/* Ball movement trail - faded arrows showing recent movements */}
        {ballTrail.map((trail, index) => {
          const opacity = 0.2 + (index / ballTrail.length) * 0.4; // Fade older trails
          const hasEnd = trail.endX !== undefined && trail.endY !== undefined;
          const trailColor = trail.successful ? '#60A5FA' : '#F87171'; // Blue for success, red for fail
          const markerId = `trail-arrow-${index}`;
          
          return (
            <g key={index}>
              <defs>
                <marker
                  id={markerId}
                  markerWidth="3"
                  markerHeight="3"
                  refX="2.5"
                  refY="1.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 3 1.5, 0 3"
                    fill={trailColor}
                    opacity={opacity}
                  />
                </marker>
              </defs>
              {/* Trail line */}
              <line
                x1={trail.x}
                y1={trail.y}
                x2={hasEnd ? trail.endX! : trail.x}
                y2={hasEnd ? trail.endY! : trail.y}
                stroke={trailColor}
                strokeWidth="0.4"
                opacity={opacity}
                markerEnd={hasEnd ? `url(#${markerId})` : undefined}
                strokeDasharray={trail.successful ? undefined : '1,0.5'}
              />
              {/* Start point marker */}
              <circle
                cx={trail.x}
                cy={trail.y}
                r="1.2"
                fill={trailColor}
                opacity={opacity}
              />
              {/* Jersey number label */}
              <text
                x={trail.x}
                y={trail.y - 2}
                fill="white"
                fontSize="1.8"
                textAnchor="middle"
                opacity={opacity + 0.2}
              >
                #{trail.jerseyNumber}
              </text>
              {/* Target player label at end position */}
              {hasEnd && trail.targetJerseyNumber && (
                <text
                  x={trail.endX!}
                  y={trail.endY! + 3}
                  fill="white"
                  fontSize="1.6"
                  textAnchor="middle"
                  opacity={opacity + 0.2}
                >
                  →#{trail.targetJerseyNumber}
                </text>
              )}
            </g>
          );
        })}
        {startPosition && endPosition && (
          <>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="4"
                markerHeight="4"
                refX="3"
                refY="2"
                orient="auto"
              >
                <polygon
                  points="0 0, 4 2, 0 4"
                  fill={isForward ? '#22C55E' : '#F97316'}
                />
              </marker>
            </defs>
            <line
              x1={startPosition.x}
              y1={startPosition.y}
              x2={endPosition.x}
              y2={endPosition.y}
              stroke={isForward ? '#22C55E' : '#F97316'}
              strokeWidth="0.5"
              markerEnd="url(#arrowhead)"
            />
          </>
        )}

        {/* Preview line while placing end position */}
        {startPosition && !endPosition && requiresEndPosition && hoverPosition && (
          <line
            x1={startPosition.x}
            y1={startPosition.y}
            x2={hoverPosition.x}
            y2={hoverPosition.y}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />
        )}

        {/* Start position marker (green) */}
        {startPosition && (
          <g>
            <circle
              cx={startPosition.x}
              cy={startPosition.y}
              r="2"
              fill="#22C55E"
              stroke="white"
              strokeWidth="0.3"
            >
              <animate
                attributeName="r"
                values="1.8;2.2;1.8"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={startPosition.x}
              y={startPosition.y - 3}
              fill="white"
              fontSize="2"
              textAnchor="middle"
            >
              START
            </text>
          </g>
        )}

        {/* End position marker (red) */}
        {endPosition && (
          <g>
            <circle
              cx={endPosition.x}
              cy={endPosition.y}
              r="2"
              fill="#EF4444"
              stroke="white"
              strokeWidth="0.3"
            />
            <text
              x={endPosition.x}
              y={endPosition.y - 3}
              fill="white"
              fontSize="2"
              textAnchor="middle"
            >
              END
            </text>
          </g>
        )}

        {/* Hover indicator */}
        {hoverPosition && !startPosition && (
          <circle
            cx={hoverPosition.x}
            cy={hoverPosition.y}
            r="1.5"
            fill="rgba(34, 197, 94, 0.5)"
            stroke="white"
            strokeWidth="0.2"
          />
        )}
        {hoverPosition && startPosition && !endPosition && requiresEndPosition && (
          <circle
            cx={hoverPosition.x}
            cy={hoverPosition.y}
            r="1.5"
            fill="rgba(239, 68, 68, 0.5)"
            stroke="white"
            strokeWidth="0.2"
          />
        )}

        {/* Ball position indicator */}
        {ballPosition && (
          <g>
            {/* Outer glow effect */}
            <circle
              cx={ballPosition.x}
              cy={ballPosition.y}
              r="4"
              fill="rgba(255, 215, 0, 0.3)"
            >
              <animate
                attributeName="r"
                values="3.5;4.5;3.5"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0.5;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Football/soccer ball icon */}
            <circle
              cx={ballPosition.x}
              cy={ballPosition.y}
              r="2.5"
              fill="white"
              stroke="#333"
              strokeWidth="0.3"
            />
            {/* Pentagon pattern on ball */}
            <circle
              cx={ballPosition.x}
              cy={ballPosition.y}
              r="1"
              fill="#333"
            />
            <circle
              cx={ballPosition.x - 1.2}
              cy={ballPosition.y - 0.8}
              r="0.5"
              fill="#333"
            />
            <circle
              cx={ballPosition.x + 1.2}
              cy={ballPosition.y - 0.8}
              r="0.5"
              fill="#333"
            />
            <circle
              cx={ballPosition.x - 0.8}
              cy={ballPosition.y + 1.2}
              r="0.5"
              fill="#333"
            />
            <circle
              cx={ballPosition.x + 0.8}
              cy={ballPosition.y + 1.2}
              r="0.5"
              fill="#333"
            />
            
            {/* Jersey number badge */}
            <g>
              <rect
                x={ballPosition.x + 2.5}
                y={ballPosition.y - 4}
                width="6"
                height="4"
                rx="1"
                fill="#FFD700"
                stroke="#B8860B"
                strokeWidth="0.2"
              />
              <text
                x={ballPosition.x + 5.5}
                y={ballPosition.y - 1.5}
                fill="#333"
                fontSize="2.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                #{ballPosition.jerseyNumber}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
