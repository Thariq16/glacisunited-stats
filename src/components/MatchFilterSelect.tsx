import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllMatches } from '@/hooks/usePlayerStats';
import { useSeasons } from '@/hooks/useSeasons';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface MatchFilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  teamSlug?: string;
  seasonId?: string;
  onSeasonChange?: (seasonId: string) => void;
  showSeasonFilter?: boolean;
}

export function MatchFilterSelect({ value, onValueChange, teamSlug, seasonId, onSeasonChange, showSeasonFilter = false }: MatchFilterSelectProps) {
  const { data: matches, isLoading } = useAllMatches();
  const { data: seasons } = useSeasons();
  
  // Filter matches by team and season
  let filteredMatches = teamSlug && matches
    ? matches.filter(m => 
        m.home_team?.slug === teamSlug || m.away_team?.slug === teamSlug
      )
    : matches;

  if (seasonId && seasonId !== 'all' && filteredMatches) {
    const season = seasons?.find(s => s.id === seasonId);
    if (season) {
      filteredMatches = filteredMatches.filter(m => {
        const matchDate = new Date(m.match_date);
        return matchDate >= new Date(season.start_date) && matchDate <= new Date(season.end_date);
      });
    }
  }

  const getDisplayValue = () => {
    if (value === 'all') return 'All Matches (Season)';
    if (value === 'last1') return 'Last Match';
    if (value === 'last3') return 'Last 3 Matches';
    
    const match = matches?.find(m => m.id === value);
    if (match) {
      const homeTeam = match.home_team?.name || 'Home';
      const awayTeam = match.away_team?.name || 'Away';
      const date = format(new Date(match.match_date), 'MMM d, yyyy');
      return `${homeTeam} vs ${awayTeam} (${date})`;
    }
    return 'Select filter';
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {showSeasonFilter && seasons && seasons.length > 0 && (
        <Select value={seasonId || 'all'} onValueChange={onSeasonChange}>
          <SelectTrigger className="w-full max-w-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Seasons" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            {seasons.map(season => (
              <SelectItem key={season.id} value={season.id}>
                {season.name} {season.status === 'completed' ? '✓' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full max-w-md">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <SelectValue>{getDisplayValue()}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Matches (Season)</SelectItem>
          <SelectItem value="last1">Last Match</SelectItem>
          <SelectItem value="last3">Last 3 Matches</SelectItem>
          
          {filteredMatches && filteredMatches.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                Individual Matches
              </div>
              {filteredMatches.map((match) => {
                const homeTeam = match.home_team?.name || 'Home';
                const awayTeam = match.away_team?.name || 'Away';
                const date = format(new Date(match.match_date), 'MMM d, yyyy');
                const score = `${match.home_score}-${match.away_score}`;
                
                return (
                  <SelectItem key={match.id} value={match.id}>
                    <div className="flex flex-col">
                      <span>{homeTeam} vs {awayTeam}</span>
                      <span className="text-xs text-muted-foreground">{date} • {score}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </>
          )}
          
          {isLoading && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Loading matches...
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
