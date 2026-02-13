import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

type NoteFilter = 'all' | '1st_half' | '2nd_half' | 'overall';

interface MatchWithComments {
  matchId: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  comments: {
    id: string;
    comment: string;
    created_at: string;
    noteType: NoteFilter;
  }[];
}

function getNoteType(comment: string): NoteFilter {
  if (comment.startsWith('[1st Half')) return '1st_half';
  if (comment.startsWith('[2nd Half')) return '2nd_half';
  if (comment.startsWith('[Overall')) return 'overall';
  return 'all'; // Untagged comments
}

function getNoteTypeLabel(type: NoteFilter): string {
  switch (type) {
    case '1st_half': return '1st Half';
    case '2nd_half': return '2nd Half';
    case 'overall': return 'Overall';
    default: return 'All';
  }
}

function getNoteTypeBadgeVariant(type: NoteFilter): "default" | "secondary" | "outline" {
  switch (type) {
    case '1st_half': return 'default';
    case '2nd_half': return 'secondary';
    case 'overall': return 'outline';
    default: return 'outline';
  }
}

export function AllMatchComments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NoteFilter>('all');
  
  const { data: matchesWithComments, isLoading } = useQuery({
    queryKey: ['all-match-comments'],
    queryFn: async () => {
      // Get all comments
      const { data: comments, error: commentsError } = await supabase
        .from('match_comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;
      if (!comments || comments.length === 0) return [];

      // Get unique match IDs
      const matchIds = [...new Set(comments.map(c => c.match_id))];
      
      // Get match details
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .in('id', matchIds);
      
      if (matchesError) throw matchesError;

      // Group comments by match
      const result: MatchWithComments[] = (matches || []).map(match => ({
        matchId: match.id,
        matchDate: match.match_date,
        homeTeam: (match.home_team as any)?.name || 'Unknown',
        awayTeam: (match.away_team as any)?.name || 'Unknown',
        homeScore: match.home_score,
        awayScore: match.away_score,
        comments: comments
          .filter(c => c.match_id === match.id)
          .map(c => ({
            id: c.id,
            comment: c.comment,
            created_at: c.created_at,
            noteType: getNoteType(c.comment),
          })),
      }));

      // Sort by most recent comment
      return result.sort((a, b) => {
        const aLatest = a.comments[0]?.created_at || '';
        const bLatest = b.comments[0]?.created_at || '';
        return bLatest.localeCompare(aLatest);
      });
    },
  });

  // Filter comments based on selected filter
  const filteredMatches = matchesWithComments?.map(match => ({
    ...match,
    comments: filter === 'all' 
      ? match.comments 
      : match.comments.filter(c => c.noteType === filter),
  })).filter(match => match.comments.length > 0);

  // Count notes by type for badges
  const counts = matchesWithComments?.reduce((acc, match) => {
    match.comments.forEach(c => {
      if (c.noteType !== 'all') {
        acc[c.noteType] = (acc[c.noteType] || 0) + 1;
      }
      acc.all = (acc.all || 0) + 1;
    });
    return acc;
  }, {} as Record<NoteFilter, number>) || { all: 0, '1st_half': 0, '2nd_half': 0, 'overall': 0 };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!matchesWithComments || matchesWithComments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Analyst Notes Yet</h3>
          <p className="text-muted-foreground">Analyst notes will appear here once they are added by administrators.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter:</span>
            </div>
            <ToggleGroup 
              type="single" 
              value={filter} 
              onValueChange={(value) => value && setFilter(value as NoteFilter)}
              className="flex-wrap"
            >
              <ToggleGroupItem value="all" aria-label="Show all notes" className="gap-2">
                All
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                  {counts.all || 0}
                </Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="1st_half" aria-label="Show 1st half notes" className="gap-2">
                1st Half
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                  {counts['1st_half'] || 0}
                </Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="2nd_half" aria-label="Show 2nd half notes" className="gap-2">
                2nd Half
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                  {counts['2nd_half'] || 0}
                </Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="overall" aria-label="Show overall notes" className="gap-2">
                Overall
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                  {counts['overall'] || 0}
                </Badge>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Results */}
      {filteredMatches && filteredMatches.length > 0 ? (
        filteredMatches.map((match) => (
          <Card 
            key={match.matchId}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate(`/match/${match.matchId}`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}</span>
                <span className="text-sm text-muted-foreground font-normal flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(match.matchDate).toLocaleDateString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {match.comments.slice(0, 5).map((comment) => (
                  <div key={comment.id} className="bg-muted/50 rounded p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge 
                        variant={getNoteTypeBadgeVariant(comment.noteType)} 
                        className="text-xs shrink-0"
                      >
                        {getNoteTypeLabel(comment.noteType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{comment.comment}</p>
                  </div>
                ))}
                {match.comments.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{match.comments.length - 5} more notes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No {getNoteTypeLabel(filter).toLowerCase()} notes found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}