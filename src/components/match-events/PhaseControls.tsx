import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Square, Target, Goal, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Phase, PhaseOutcome } from './types';

interface PhaseControlsProps {
  currentPhase: Phase | null;
  phaseCount: number;
  onStartPhase: () => void;
  onEndPhase: (outcome: PhaseOutcome) => void;
}

export function PhaseControls({
  currentPhase,
  phaseCount,
  onStartPhase,
  onEndPhase,
}: PhaseControlsProps) {
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);

  const handleEndPhaseClick = () => {
    setShowOutcomeDialog(true);
  };

  const handleOutcomeSelect = (outcome: PhaseOutcome) => {
    onEndPhase(outcome);
    setShowOutcomeDialog(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Attacking Phase
        </h3>
        {phaseCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {phaseCount} phases logged
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={currentPhase ? 'secondary' : 'default'}
          size="sm"
          onClick={onStartPhase}
          disabled={!!currentPhase}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-1" />
          {currentPhase ? 'Recording...' : 'Start Phase'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEndPhaseClick}
          disabled={!currentPhase}
          className="flex-1"
        >
          <Square className="h-4 w-4 mr-1" />
          End Phase
        </Button>
      </div>

      {currentPhase && (
        <div className="text-sm text-muted-foreground bg-accent/50 rounded px-3 py-2">
          <span className="font-medium">Phase #{currentPhase.phaseNumber}</span>
          <span className="mx-2">•</span>
          <span>{currentPhase.eventIds.length} events</span>
        </div>
      )}

      {/* Phase outcome dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Attacking Phase</DialogTitle>
            <DialogDescription>
              How did this attacking phase end?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => handleOutcomeSelect('goal')}
            >
              <Goal className="h-8 w-8 text-green-500" />
              <span>Goal</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-yellow-500/10 hover:border-yellow-500"
              onClick={() => handleOutcomeSelect('shot')}
            >
              <Target className="h-8 w-8 text-yellow-500" />
              <span>Shot</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-red-500/10 hover:border-red-500"
              onClick={() => handleOutcomeSelect('lost_possession')}
            >
              <XCircle className="h-8 w-8 text-red-500" />
              <span>Lost Possession</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
