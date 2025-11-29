import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  }[];
}

export function AllMatchComments() {
  const navigate = useNavigate();
  
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

  if (isLoading) {
    return (
      <div className="space-y-4">
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
          <h3 className="text-lg font-medium text-foreground mb-2">No Coach Notes Yet</h3>
          <p className="text-muted-foreground">Coach notes will appear here once they are added by administrators.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matchesWithComments.map((match) => (
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
              {match.comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded p-3">
                  <p className="text-sm text-foreground line-clamp-2">{comment.comment}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {match.comments.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{match.comments.length - 3} more notes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}