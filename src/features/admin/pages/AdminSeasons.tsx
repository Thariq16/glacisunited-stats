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
import { useSeasons, useCreateSeason, useUpdateSeasonStatus, useDeleteSeason } from '@/hooks/useSeasons';
import { Calendar, CheckCircle, Plus, Trash2, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

function AdminSeasonsContent() {
  const { data: seasons, isLoading } = useSeasons();
  const createSeason = useCreateSeason();
  const updateStatus = useUpdateSeasonStatus();
  const deleteSeason = useDeleteSeason();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await createSeason.mutateAsync({ name, start_date: startDate, end_date: endDate });
      toast.success(`Season "${name}" created`);
      setName('');
      setStartDate('');
      setEndDate('');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create season');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Season marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update season');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete season "${name}"? Matches will be unlinked but not deleted.`)) return;
    try {
      await deleteSeason.mutateAsync(id);
      toast.success('Season deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete season');
    }
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
            <p className="text-muted-foreground">Create and manage football seasons (Aug–Mar)</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Season
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 max-w-lg">
            <CardHeader>
              <CardTitle>Create Season</CardTitle>
              <CardDescription>Define the season name and date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="season-name">Season Name</Label>
                <Input
                  id="season-name"
                  placeholder="e.g. 2025/26"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={createSeason.isPending}>
                  {createSeason.isPending ? 'Creating...' : 'Create Season'}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
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
              <Card key={season.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="flex items-center justify-between py-6">
                  <div className="flex items-center gap-4">
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
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
