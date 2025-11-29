import { useState } from 'react';
import { useMatchComments } from '@/hooks/useMatchComments';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCommentForm } from './MatchCommentForm';
import { MatchCommentItem } from './MatchCommentItem';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';

type NoteFilter = 'all' | '1st_half' | '2nd_half' | 'overall';

interface MatchCommentsProps {
  matchId: string;
}

function getNoteType(comment: string): NoteFilter {
  if (comment.startsWith('[1st Half')) return '1st_half';
  if (comment.startsWith('[2nd Half')) return '2nd_half';
  if (comment.startsWith('[Overall')) return 'overall';
  return 'all';
}

function getNoteTypeLabel(type: NoteFilter): string {
  switch (type) {
    case '1st_half': return '1st Half';
    case '2nd_half': return '2nd Half';
    case 'overall': return 'Overall';
    default: return 'All';
  }
}

export function MatchComments({ matchId }: MatchCommentsProps) {
  const { isAdmin, isCoach } = useAuth();
  const { data: comments, isLoading } = useMatchComments(matchId);
  const [filter, setFilter] = useState<NoteFilter>('all');

  // Only show to admins and coaches
  if (!isAdmin && !isCoach) {
    return null;
  }

  // Add note types to comments and filter
  const commentsWithTypes = comments?.map(c => ({
    ...c,
    noteType: getNoteType(c.comment),
  }));

  const filteredComments = filter === 'all' 
    ? commentsWithTypes 
    : commentsWithTypes?.filter(c => c.noteType === filter);

  // Count notes by type
  const counts = commentsWithTypes?.reduce((acc, c) => {
    acc[c.noteType] = (acc[c.noteType] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<NoteFilter, number>) || { all: 0, '1st_half': 0, '2nd_half': 0, 'overall': 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Analyst Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {/* Filter Controls */}
            {comments && comments.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pb-2 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>Filter:</span>
                </div>
                <ToggleGroup 
                  type="single" 
                  value={filter} 
                  onValueChange={(value) => value && setFilter(value as NoteFilter)}
                  className="flex-wrap"
                  size="sm"
                >
                  <ToggleGroupItem value="all" aria-label="Show all notes" className="gap-1 h-8 px-2 text-xs">
                    All
                    <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                      {counts.all || 0}
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1st_half" aria-label="Show 1st half notes" className="gap-1 h-8 px-2 text-xs">
                    1st Half
                    <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                      {counts['1st_half'] || 0}
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="2nd_half" aria-label="Show 2nd half notes" className="gap-1 h-8 px-2 text-xs">
                    2nd Half
                    <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                      {counts['2nd_half'] || 0}
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="overall" aria-label="Show overall notes" className="gap-1 h-8 px-2 text-xs">
                    Overall
                    <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                      {counts['overall'] || 0}
                    </Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {filteredComments && filteredComments.length > 0 ? (
              <div className="space-y-3">
                {filteredComments.map((comment) => (
                  <MatchCommentItem 
                    key={comment.id} 
                    comment={comment} 
                    matchId={matchId}
                  />
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <p className="text-muted-foreground text-sm">
                No {getNoteTypeLabel(filter).toLowerCase()} notes found.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No notes yet.{isAdmin && ' Add the first note below.'}
              </p>
            )}
            
            {/* Only admins can add comments */}
            {isAdmin && (
              <div className="pt-4 border-t">
                <MatchCommentForm matchId={matchId} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}