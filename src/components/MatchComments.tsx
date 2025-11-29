import { useMatchComments } from '@/hooks/useMatchComments';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCommentForm } from './MatchCommentForm';
import { MatchCommentItem } from './MatchCommentItem';

interface MatchCommentsProps {
  matchId: string;
}

export function MatchComments({ matchId }: MatchCommentsProps) {
  const { isAdmin, isCoach } = useAuth();
  const { data: comments, isLoading } = useMatchComments(matchId);

  // Only show to admins and coaches
  if (!isAdmin && !isCoach) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Coach Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {comments && comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <MatchCommentItem 
                    key={comment.id} 
                    comment={comment} 
                    matchId={matchId}
                  />
                ))}
              </div>
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