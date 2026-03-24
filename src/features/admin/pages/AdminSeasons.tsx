import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useSeasons, useCreateSeason, useUpdateSeason, useUpdateSeasonStatus,
  useDeleteSeason, useSeasonMatches, useUnassignedMatches, useAssignMatchToSeason,
  Season,
} from '@/hooks/useSeasons';
import { Calendar, CheckCircle, Edit2, Plus, Trash2, Trophy, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

function SeasonForm({ initial, onSubmit, onCancel, isPending, submitLabel }: {
  initial?: { name: string; start_date: string; end_date: string };
  onSubmit: (data: { name: string; start_date: string; end_date: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [startDate, setStartDate] = useState(initial?.start_date || '');
  const [endDate, setEndDate] = useState(initial?.end_date || '');

  const handleSubmit = () => {
    if (!name || !startDate || !endDate) { toast.error('Please fill in all fields'); return; }
    onSubmit({ name, start_date: startDate, end_date: endDate });
  };

  return (
    <Card className="mb-8 max-w-lg">
      <CardHeader>
        <CardTitle>{initial ? 'Edit Season' : 'Create Season'}</CardTitle>
        <CardDescription>Define the season name and date range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="season-name">Season Name</Label>
          <Input id="season-name" placeholder="e.g. 2025/26" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : submitLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SeasonMatchManager({ season }: { season: Season }) {
  const { data: seasonMatches, isLoading: loadingAssigned } = useSeasonMatches(season.id);
  const { data: unassignedMatches, isLoading: loadingUnassigned } = useUnassignedMatches();
  const assignMatch = useAssignMatchToSeason();

  const handleAssign = async (matchId: string) => {
    try {
      await assignMatch.mutateAsync({ matchId, seasonId: season.id });
      toast.success('Match added to season');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRemove = async (matchId: string) => {
    try {
      await assignMatch.mutateAsync({ matchId, seasonId: null });
      toast.success('Match removed from season');
    } catch (err: any) { toast.error(err.message); }
  };

  const formatMatch = (m: any) => {
    const home = m.home_team?.name || 'Home';
    const away = m.away_team?.name || 'Away';
    const date = format(new Date(m.match_date), 'MMM d, yyyy');
    return { label: `${home} vs ${away}`, detail: `${date} • ${m.home_score}-${m.away_score}` };
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">Matches in {season.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assigned matches */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Assigned ({seasonMatches?.length || 0})
          </h4>
          {loadingAssigned ? (
            <Skeleton className="h-12 w-full" />
          ) : !seasonMatches || seasonMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {seasonMatches.map(m => {
                const { label, detail } = formatMatch(m);
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{detail}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id)} disabled={assignMatch.isPending}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unassigned matches */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Unassigned Matches ({unassignedMatches?.length || 0})
          </h4>
          {loadingUnassigned ? (
            <Skeleton className="h-12 w-full" />
          ) : !unassignedMatches || unassignedMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">All matches are assigned to a season.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unassignedMatches.map(m => {
                const { label, detail } = formatMatch(m);
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{detail}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAssign(m.id)} disabled={assignMatch.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminSeasonsContent() {
  const { data: seasons, isLoading } = useSeasons();
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const updateStatus = useUpdateSeasonStatus();
  const deleteSeason = useDeleteSeason();

  const [showForm, setShowForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);

  const handleCreate = async (data: { name: string; start_date: string; end_date: string }) => {
    try {
      await createSeason.mutateAsync(data);
      toast.success(`Season "${data.name}" created`);
      setShowForm(false);
    } catch (err: any) { toast.error(err.message || 'Failed to create season'); }
  };

  const handleUpdate = async (data: { name: string; start_date: string; end_date: string }) => {
    if (!editingSeason) return;
    try {
      await updateSeason.mutateAsync({ id: editingSeason.id, ...data });
      toast.success(`Season updated`);
      setEditingSeason(null);
    } catch (err: any) { toast.error(err.message || 'Failed to update season'); }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Season marked as ${newStatus}`);
    } catch (err: any) { toast.error(err.message || 'Failed to update season'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete season "${name}"? Matches will be unlinked but not deleted.`)) return;
    try {
      await deleteSeason.mutateAsync(id);
      toast.success('Season deleted');
    } catch (err: any) { toast.error(err.message || 'Failed to delete season'); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Seasons</h1>
            </div>
            <p className="text-muted-foreground">Create and manage football seasons, assign matches</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingSeason(null); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Season
          </Button>
        </div>

        {showForm && (
          <SeasonForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isPending={createSeason.isPending}
            submitLabel="Create Season"
          />
        )}

        {editingSeason && (
          <SeasonForm
            initial={{ name: editingSeason.name, start_date: editingSeason.start_date, end_date: editingSeason.end_date }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingSeason(null)}
            isPending={updateSeason.isPending}
            submitLabel="Save Changes"
          />
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !seasons || seasons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No seasons created yet. Click "New Season" to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {seasons.map(season => (
              <div key={season.id}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-6">
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => setExpandedSeasonId(expandedSeasonId === season.id ? null : season.id)}
                    >
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{season.name}</h3>
                          <Badge variant={season.status === 'active' ? 'default' : 'secondary'}>
                            {season.status === 'active' ? 'Active' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(season.start_date), 'MMM d, yyyy')} — {format(new Date(season.end_date), 'MMM d, yyyy')}
                          <span className="ml-2 text-xs">Click to manage matches</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingSeason(season); setShowForm(false); }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(season.id, season.status)}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {season.status === 'active' ? 'Mark Complete' : 'Reactivate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(season.id, season.name)}
                        disabled={deleteSeason.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {expandedSeasonId === season.id && (
                  <SeasonMatchManager season={season} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function AdminSeasons() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminSeasonsContent />
    </ProtectedRoute>
  );
}
