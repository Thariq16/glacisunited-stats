import { Button } from '@/components/ui/button';
import { DoorOpen, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PenaltyAreaSuggestionProps {
  isVisible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  playerName: string;
  jerseyNumber: number;
}

export function PenaltyAreaSuggestion({
  isVisible,
  onAccept,
  onDismiss,
  playerName,
  jerseyNumber,
}: PenaltyAreaSuggestionProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-500 text-black rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="bg-amber-600 rounded-full p-2">
          <DoorOpen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Penalty Area Entry Detected</p>
          <p className="text-xs mt-1 opacity-90">
            #{jerseyNumber} {playerName} entered the penalty area. Log entry event?
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-black hover:bg-gray-100"
              onClick={onAccept}
            >
              Yes, Log It
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-black hover:bg-amber-600"
              onClick={onDismiss}
            >
              Dismiss ({countdown}s)
            </Button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-black/60 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
