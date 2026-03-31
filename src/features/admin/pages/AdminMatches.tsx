import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Calendar, ArrowLeft, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  home_score: number;
  away_score: number;
  competition: string | null;
  venue: string | null;
  status: string;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
}

function AdminMatchesContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [deleteMatch, setDeleteMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState({
    home_score: 0,
    away_score: 0,
    venue: '',
    competition: '',
    match_date: '',
  });

  // Fetch all matches
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
        .order('match_date', { ascending: false });
      if (error) throw error;
      return data as Match[];
    },
  });

  // Separate ongoing and other matches
  const ongoingMatches = matches.filter(m => m.status === 'in_progress');
  const otherMatches = matches.filter(m => m.status !== 'in_progress');

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (matchId: string) => {
      // Delete related data first
      await supabase.from('match_events').delete().eq('match_id', matchId);
      await supabase.from('player_match_stats').delete().eq('match_id', matchId);
      await supabase.from('match_comments').delete().eq('match_id', matchId);
      // Delete the match
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      toast.success('Match deleted successfully');
      setDeleteMatch(null);
    },
    onError: (error) => {
      toast.error('Failed to delete match: ' + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & typeof editForm) => {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: updates.home_score,
          away_score: updates.away_score,
          venue: updates.venue || null,
          competition: updates.competition || null,
          match_date: updates.match_date,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      toast.success('Match updated successfully');
      setEditMatch(null);
    },
    onError: (error) => {
      toast.error('Failed to update match: ' + error.message);
    },
  });

  // Mark match as complete
  const completeMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      toast.success('Match marked as completed');
    },
    onError: (error) => {
      toast.error('Failed to update match: ' + error.message);
    },
  });

  const handleEditOpen = (match: Match) => {
    setEditMatch(match);
    setEditForm({
      home_score: match.home_score,
      away_score: match.away_score,
      venue: match.venue || '',
      competition: match.competition || '',
      match_date: match.match_date,
    });
  };

  const handleUpdateSubmit = () => {
    if (!editMatch) return;
    updateMutation.mutate({ id: editMatch.id, ...editForm });
  };

  const handleContinueCapture = (matchId: string) => {
    navigate(`/admin/match-events/${matchId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="default" className="bg-amber-500">In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  const renderMatchTable = (matchList: Match[], showContinue = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Home Team</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Away Team</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Competition</TableHead>
          <TableHead className="w-32">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matchList.map((match) => (
          <TableRow key={match.id}>
            <TableCell className="font-mono text-sm">
              {format(new Date(match.match_date), 'dd MMM yyyy')}
            </TableCell>
            <TableCell className="font-medium">
              {match.home_team?.name || 'Unknown'}
            </TableCell>
            <TableCell className="font-bold text-center">
              {match.home_score} - {match.away_score}
            </TableCell>
            <TableCell className="font-medium">
              {match.away_team?.name || 'Unknown'}
            </TableCell>
            <TableCell>{getStatusBadge(match.status)}</TableCell>
            <TableCell className="text-muted-foreground">
              {match.competition || '-'}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {showContinue && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8"
                    onClick={() => handleContinueCapture(match.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Continue
                  </Button>
                )}
                {match.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => completeMutation.mutate(match.id)}
                    title="Mark as completed"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/admin/match-events/${match.id}`)}
                  title="Edit match events"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteMatch(match)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Manage Matches
              </h1>
              <p className="text-muted-foreground text-sm">View, edit, and delete matches</p>
            </div>
          </div>
          <Button onClick={() => navigate('/admin/new-match')}>
            <Plus className="h-4 w-4 mr-2" />
            New Match
          </Button>
        </div>

        {/* Ongoing Matches Section */}
        {ongoingMatches.length > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Play className="h-5 w-5" />
                Ongoing Matches ({ongoingMatches.length})
              </CardTitle>
              <CardDescription>
                Matches currently being captured. Click "Continue" to resume data capture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderMatchTable(ongoingMatches, true)}
            </CardContent>
          </Card>
        )}

        {/* All Other Matches */}
        <Card>
          <CardHeader>
            <CardTitle>All Matches ({otherMatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading matches...</p>
            ) : otherMatches.length === 0 ? (
              <p className="text-muted-foreground">No matches found. Create a new match to get started.</p>
            ) : (
              renderMatchTable(otherMatches)
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Edit Dialog */}
      <Dialog open={!!editMatch} onOpenChange={() => setEditMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
            <DialogDescription>
              {editMatch?.home_team?.name} vs {editMatch?.away_team?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Score</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.home_score}
                  onChange={(e) => setEditForm(f => ({ ...f, home_score: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Away Score</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.away_score}
                  onChange={(e) => setEditForm(f => ({ ...f, away_score: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Match Date</Label>
              <Input
                type="date"
                value={editForm.match_date}
                onChange={(e) => setEditForm(f => ({ ...f, match_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Competition</Label>
              <Input
                value={editForm.competition}
                onChange={(e) => setEditForm(f => ({ ...f, competition: e.target.value }))}
                placeholder="e.g. League, Cup"
              />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={editForm.venue}
                onChange={(e) => setEditForm(f => ({ ...f, venue: e.target.value }))}
                placeholder="e.g. Home Stadium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMatch(null)}>Cancel</Button>
            <Button onClick={handleUpdateSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMatch} onOpenChange={() => setDeleteMatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the match between{' '}
              <strong>{deleteMatch?.home_team?.name}</strong> and{' '}
              <strong>{deleteMatch?.away_team?.name}</strong>, including all related statistics, events, and comments.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMatch && deleteMutation.mutate(deleteMatch.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Match'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminMatches() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminMatchesContent />
    </ProtectedRoute>
  );
}
