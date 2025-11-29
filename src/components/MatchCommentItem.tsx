import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteMatchComment } from '@/hooks/useMatchComments';
import { Button } from '@/components/ui/button';
import { MatchCommentForm } from './MatchCommentForm';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MatchCommentItemProps {
  comment: {
    id: string;
    comment: string;
    created_at: string;
    updated_at: string;
  };
  matchId: string;
}

export function MatchCommentItem({ comment, matchId }: MatchCommentItemProps) {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const deleteComment = useDeleteMatchComment();

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync({ id: comment.id, matchId });
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  if (isEditing) {
    return (
      <MatchCommentForm
        matchId={matchId}
        existingComment={{ id: comment.id, comment: comment.comment }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-foreground whitespace-pre-wrap">{comment.comment}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {new Date(comment.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {comment.updated_at !== comment.created_at && ' (edited)'}
        </span>
        
        {isAdmin && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}