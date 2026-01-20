import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['1-9'], description: 'Select recent player' },
  { keys: ['U'], description: 'Toggle Unsuccessful' },
  { keys: ['S'], description: 'Use suggested position' },
  { keys: ['Enter'], description: 'Save event' },
  { keys: ['Z'], description: 'Undo last event' },
  { keys: ['Esc'], description: 'Clear selection' },
  { keys: ['G'], description: 'Shot: Goal' },
  { keys: ['T'], description: 'Shot: On Target' },
  { keys: ['O'], description: 'Shot: Off Target' },
  { keys: ['B'], description: 'Shot: Blocked' },
];

export function KeyboardShortcuts() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Keyboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Shortcuts</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <h4 className="font-medium text-sm mb-2">Keyboard Shortcuts</h4>
        <div className="space-y-1.5">
          {SHORTCUTS.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
