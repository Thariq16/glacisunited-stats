import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchFilter } from '@/hooks/usePlayerStats';

interface MatchFilterTabsProps {
  value: MatchFilter;
  onValueChange: (value: MatchFilter) => void;
}

export function MatchFilterTabs({ value, onValueChange }: MatchFilterTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as MatchFilter)} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="last1">Last Match</TabsTrigger>
        <TabsTrigger value="last3">Last 3 Matches</TabsTrigger>
        <TabsTrigger value="all">Season</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
