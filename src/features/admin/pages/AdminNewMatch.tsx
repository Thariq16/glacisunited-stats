import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, MapPin, Trophy, Loader2, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

function AdminNewMatchContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    matchDate: new Date().toISOString().split('T')[0],
    venue: '',
    competition: '',
    homeAttacksLeft: true, // Home team attacks left goal in first half
  });

  const [newTeamDialogOpen, setNewTeamDialogOpen] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({ name: '', slug: '' });

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return newTeam;
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
      setNewTeamDialogOpen(false);
      setNewTeamForm({ name: '', slug: '' });
      // Auto-select the new team as away team
      setFormData(prev => ({ ...prev, awayTeamId: newTeam.id }));
    },
    onError: (error) => {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    },
  });

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          home_team_id: formData.homeTeamId,
          away_team_id: formData.awayTeamId,
          match_date: formData.matchDate,
          venue: formData.venue || null,
          competition: formData.competition || null,
          home_score: 0,
          away_score: 0,
          home_attacks_left: formData.homeAttacksLeft,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Match created successfully');
      navigate(`/admin/squad-selection/${data.id}`);
    },
    onError: (error) => {
      console.error('Error creating match:', error);
      toast.error('Failed to create match');
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamForm.name) {
      toast.error('Please enter a team name');
      return;
    }
    
    createTeamMutation.mutate({
      name: newTeamForm.name,
      slug: newTeamForm.slug || newTeamForm.name.toLowerCase().replace(/\s+/g, '-'),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.homeTeamId || !formData.awayTeamId) {
      toast.error('Please select both home and away teams');
      return;
    }
    
    if (formData.homeTeamId === formData.awayTeamId) {
      toast.error('Home and away teams must be different');
      return;
    }
    
    createMatchMutation.mutate();
  };

  const homeTeam = teams?.find(t => t.id === formData.homeTeamId);
  const awayTeam = teams?.find(t => t.id === formData.awayTeamId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Match</CardTitle>
              <CardDescription>
                Set up a new match to start logging events with the pitch diagram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Teams */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="homeTeam">Home Team *</Label>
                    <Select
                      value={formData.homeTeamId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, homeTeamId: value }))}
                      disabled={teamsLoading}
                    >
                      <SelectTrigger id="homeTeam">
                        <SelectValue placeholder="Select home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map((team) => (
                          <SelectItem 
                            key={team.id} 
                            value={team.id}
                            disabled={team.id === formData.awayTeamId}
                          >
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="awayTeam">Away Team *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto py-0 px-1 text-xs"
                        onClick={() => setNewTeamDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        New Team
                      </Button>
                    </div>
                    <Select
                      value={formData.awayTeamId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, awayTeamId: value }))}
                      disabled={teamsLoading}
                    >
                      <SelectTrigger id="awayTeam">
                        <SelectValue placeholder="Select away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map((team) => (
                          <SelectItem 
                            key={team.id} 
                            value={team.id}
                            disabled={team.id === formData.homeTeamId}
                          >
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Match Date */}
                <div className="space-y-2">
                  <Label htmlFor="matchDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Match Date *
                  </Label>
                  <Input
                    id="matchDate"
                    type="date"
                    value={formData.matchDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, matchDate: e.target.value }))}
                    required
                  />
                </div>

                {/* Venue */}
                <div className="space-y-2">
                  <Label htmlFor="venue" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Venue (optional)
                  </Label>
                  <Input
                    id="venue"
                    type="text"
                    placeholder="e.g., Victoria Stadium"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  />
                </div>

                {/* Competition */}
                <div className="space-y-2">
                  <Label htmlFor="competition" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Competition (optional)
                  </Label>
                  <Input
                    id="competition"
                    type="text"
                    placeholder="e.g., Gibraltar Premier League"
                    value={formData.competition}
                    onChange={(e) => setFormData(prev => ({ ...prev, competition: e.target.value }))}
                  />
                </div>

                {/* Attack Direction */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    First Half Attack Direction
                  </Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {homeTeam?.name || 'Home Team'} attacks{' '}
                          <span className="font-bold text-primary">
                            {formData.homeAttacksLeft ? 'Left → Right' : 'Right → Left'}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {awayTeam?.name || 'Away Team'} attacks{' '}
                          {formData.homeAttacksLeft ? 'Right → Left' : 'Left → Right'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">← L</span>
                        <Switch
                          checked={formData.homeAttacksLeft}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, homeAttacksLeft: checked }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">R →</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      This will swap automatically in the second half
                    </p>
                  </div>
                </div>
                {homeTeam && awayTeam && (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Match Preview</p>
                    <p className="text-lg font-semibold">
                      {homeTeam.name} vs {awayTeam.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(formData.matchDate).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={createMatchMutation.isPending || !formData.homeTeamId || !formData.awayTeamId}
                >
                  {createMatchMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Match...
                    </>
                  ) : (
                    'Create Match & Select Squad'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* New Team Dialog */}
        <Dialog open={newTeamDialogOpen} onOpenChange={setNewTeamDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Add a new opposition team to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={newTeamForm.name}
                  onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., FC Barcelona"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSlug">URL Slug (optional)</Label>
                <Input
                  id="teamSlug"
                  value={newTeamForm.slug}
                  onChange={(e) => setNewTeamForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., fc-barcelona"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate from team name
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                {createTeamMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Team'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminNewMatch() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminNewMatchContent />
    </ProtectedRoute>
  );
}
