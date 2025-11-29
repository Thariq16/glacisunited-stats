import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMatches } from "@/hooks/usePlayerStats";
import { useMatchComments, useAddMatchComment, useDeleteMatchComment } from "@/hooks/useMatchComments";
import { MessageSquare, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
} from "@/components/ui/alert-dialog";

function AdminCommentsContent() {
  const navigate = useNavigate();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  
  const { data: comments, isLoading: commentsLoading } = useMatchComments(selectedMatchId || undefined);
  const addComment = useAddMatchComment();
  const deleteComment = useDeleteMatchComment();

  const handleAddComment = async () => {
    if (!selectedMatchId) {
      toast.error("Please select a match");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      await addComment.mutateAsync({
        matchId: selectedMatchId,
        comment: newComment.trim(),
      });
      toast.success("Coach note added");
      setNewComment("");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ id: commentId, matchId: selectedMatchId });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const selectedMatch = matches?.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Manage Coach Notes</h1>
          </div>
          <p className="text-muted-foreground">Add notes and comments for matches that coaches can view</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl">
          {/* Add New Comment */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Note</CardTitle>
              <CardDescription>Select a match and add coach notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Match</Label>
                <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a match..." />
                  </SelectTrigger>
                  <SelectContent>
                    {matchesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      matches?.map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.home_team?.name} vs {match.away_team?.name} - {new Date(match.match_date).toLocaleDateString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter coach notes for this match..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleAddComment} 
                disabled={addComment.isPending || !selectedMatchId}
                className="w-full"
              >
                {addComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Existing Comments for Selected Match */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Notes</CardTitle>
              <CardDescription>
                {selectedMatch 
                  ? `Notes for ${selectedMatch.home_team?.name} vs ${selectedMatch.away_team?.name}`
                  : "Select a match to view notes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedMatchId ? (
                <p className="text-muted-foreground text-sm">Select a match to view and manage notes</p>
              ) : commentsLoading ? (
                <div className="space-y-2">
                  <div className="h-16 bg-muted animate-pulse rounded" />
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-3 relative group">
                      <p className="text-foreground text-sm whitespace-pre-wrap pr-8">{comment.comment}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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
                            <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No notes for this match yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminComments() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminCommentsContent />
    </ProtectedRoute>
  );
}
