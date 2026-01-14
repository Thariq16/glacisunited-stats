import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Keyboard, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const SHORTCUTS = [
  { keys: ['1-9'], description: 'Select recent player' },
  { keys: ['U'], description: 'Toggle Unsuccessful' },
  { keys: ['S'], description: 'Use suggested start pos' },
  { keys: ['Enter'], description: 'Save event' },
  { keys: ['Z'], description: 'Undo last event' },
  { keys: ['Escape'], description: 'Clear selection' },
  { keys: ['P'], description: 'Toggle phase' },
  { keys: ['G'], description: 'Shot: Goal' },
  { keys: ['T'], description: 'Shot: On Target' },
  { keys: ['O'], description: 'Shot: Off Target' },
  { keys: ['B'], description: 'Shot: Blocked' },
];

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="bg-accent/50 rounded-lg p-3 space-y-1">
          {SHORTCUTS.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-1.5 py-0.5 bg-background rounded border text-[10px] font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
