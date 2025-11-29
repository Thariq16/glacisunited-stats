import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAddMatchComment, useUpdateMatchComment } from '@/hooks/useMatchComments';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MatchCommentFormProps {
  matchId: string;
  existingComment?: {
    id: string;
    comment: string;
  };
  onCancel?: () => void;
}

export function MatchCommentForm({ matchId, existingComment, onCancel }: MatchCommentFormProps) {
  const [comment, setComment] = useState(existingComment?.comment || '');
  const addComment = useAddMatchComment();
  const updateComment = useUpdateMatchComment();
  
  const isEditing = !!existingComment;
  const isPending = addComment.isPending || updateComment.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      if (isEditing) {
        await updateComment.mutateAsync({
          id: existingComment.id,
          comment: comment.trim(),
          matchId,
        });
        toast.success('Note updated');
        onCancel?.();
      } else {
        await addComment.mutateAsync({
          matchId,
          comment: comment.trim(),
        });
        toast.success('Note added');
        setComment('');
      }
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note about this match..."
        rows={3}
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update' : 'Add Note'}
        </Button>
        {isEditing && onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}