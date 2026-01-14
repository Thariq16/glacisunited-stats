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
import { ArrowLeft, Calendar, MapPin, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function AdminNewMatchContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    matchDate: new Date().toISOString().split('T')[0],
    venue: '',
    competition: '',
  });

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
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Match created successfully');
      navigate(`/admin/match-events/${data.id}`);
    },
    onError: (error) => {
      console.error('Error creating match:', error);
      toast.error('Failed to create match');
    },
  });

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
                    <Label htmlFor="awayTeam">Away Team *</Label>
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

                {/* Preview */}
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
                    'Create Match & Start Logging Events'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
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
