import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteMatchComment, useCommentReplies, useAddCommentReply } from '@/hooks/useMatchComments';
import { Button } from '@/components/ui/button';
import { MatchCommentForm } from './MatchCommentForm';
import { Pencil, Trash2, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
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
  const { isAdmin, isCoach } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const deleteComment = useDeleteMatchComment();
  const { data: replies } = useCommentReplies(comment.id);
  const addReply = useAddCommentReply();

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync({ id: comment.id, matchId });
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await addReply.mutateAsync({
        matchId,
        parentId: comment.id,
        comment: replyText.trim(),
      });
      setReplyText('');
      setShowReplyForm(false);
      toast.success('Reply added');
    } catch (error) {
      toast.error('Failed to add reply');
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
    <div className="space-y-2">
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
          
          <div className="flex gap-1">
            {/* Reply button for coaches */}
            {isCoach && !isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-7 px-2 gap-1 text-xs"
              >
                <MessageCircle className="h-3 w-3" />
                Reply
              </Button>
            )}
            
            {isAdmin && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replies section */}
      {replies && replies.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-primary/20 pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-primary/5 rounded-lg p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{reply.comment}</p>
              <span className="text-xs text-muted-foreground mt-1 block">
                Coach reply • {new Date(reply.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reply form for coaches */}
      {showReplyForm && (
        <div className="ml-6 border-l-2 border-primary/20 pl-4">
          <div className="flex gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="min-h-[60px] text-sm"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || addReply.isPending}
                className="h-8"
              >
                <Send className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}