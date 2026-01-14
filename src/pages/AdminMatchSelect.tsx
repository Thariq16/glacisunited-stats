import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';

function AdminMatchSelectContent() {
  const navigate = useNavigate();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches-for-event-logging'],
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
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Select Match</h1>
          <p className="text-muted-foreground mt-1">
            Choose a match to log detailed events with coordinates
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No matches found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Card
                key={match.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/admin/match-events/${match.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold">
                    {match.home_score} - {match.away_score}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(match.match_date), 'PPP')}
                  </div>
                  {match.competition && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {match.competition}
                    </div>
                  )}
                  {match.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {match.venue}
                    </div>
                  )}
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

export default function AdminMatchSelect() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminMatchSelectContent />
    </ProtectedRoute>
  );
}
