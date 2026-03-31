import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Users, UserPlus, Check, Loader2, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import { useSquadSelectionQueries, useSquadSelectionMutations, Player, SquadPlayer } from '../hooks';

interface Team {
  id: string;
  name: string;
  slug: string;
}

function AdminSquadSelectionContent() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use extracted hooks
  const {
    match,
    homePlayers,
    awayPlayers,
    matchLoading,
    homePlayersLoading,
    awayPlayersLoading,
  } = useSquadSelectionQueries(matchId);

  const {
    createPlayerMutation,
    createTeamMutation,
    saveSquadMutation,
    saveAndProceed,
  } = useSquadSelectionMutations(matchId);

  const [homeSquad, setHomeSquad] = useState<SquadPlayer[]>([]);
  const [awaySquad, setAwaySquad] = useState<SquadPlayer[]>([]);
  const [newPlayerDialogOpen, setNewPlayerDialogOpen] = useState(false);
  const [newTeamDialogOpen, setNewTeamDialogOpen] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home');

  const [newPlayerForm, setNewPlayerForm] = useState({
    name: '',
    jerseyNumber: '',
    role: '',
    teamId: '',
  });

  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    slug: '',
  });

  const togglePlayerInSquad = (player: Player, teamType: 'home' | 'away') => {
    const squad = teamType === 'home' ? homeSquad : awaySquad;
    const setSquad = teamType === 'home' ? setHomeSquad : setAwaySquad;

    const existingIndex = squad.findIndex(p => p.id === player.id);

    if (existingIndex >= 0) {
      // Remove from squad
      setSquad(prev => prev.filter(p => p.id !== player.id));
    } else {
      // Add to squad as substitute by default
      const startingCount = squad.filter(p => p.status === 'starting').length;
      const status = startingCount < 11 ? 'starting' : 'substitute';
      setSquad(prev => [...prev, { ...player, status }]);
    }
  };

  const togglePlayerStatus = (playerId: string, teamType: 'home' | 'away') => {
    const setSquad = teamType === 'home' ? setHomeSquad : setAwaySquad;

    setSquad(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, status: p.status === 'starting' ? 'substitute' : 'starting' };
      }
      return p;
    }));
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerForm.name || !newPlayerForm.jerseyNumber || !newPlayerForm.teamId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newPlayer = await createPlayerMutation.mutateAsync({
        name: newPlayerForm.name,
        jersey_number: parseInt(newPlayerForm.jerseyNumber),
        role: newPlayerForm.role || null,
        team_id: newPlayerForm.teamId,
      });

      toast.success('Player created successfully');
      setNewPlayerDialogOpen(false);
      setNewPlayerForm({ name: '', jerseyNumber: '', role: '', teamId: '' });

      // Auto-add to squad
      const squadPlayer: SquadPlayer = { ...newPlayer, status: 'substitute' };
      if (newPlayer.team_id === match?.home_team_id) {
        setHomeSquad(prev => [...prev, squadPlayer]);
      } else {
        setAwaySquad(prev => [...prev, squadPlayer]);
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateTeam = () => {
    if (!newTeamForm.name) {
      toast.error('Please enter a team name');
      return;
    }

    createTeamMutation.mutate({
      name: newTeamForm.name,
      slug: newTeamForm.slug || newTeamForm.name.toLowerCase().replace(/\s+/g, '-'),
    }, {
      onSuccess: () => {
        setNewTeamDialogOpen(false);
        setNewTeamForm({ name: '', slug: '' });
      }
    });
  };

  const handleProceed = async () => {
    const homeStarting = homeSquad.filter(p => p.status === 'starting').length;
    const awayStarting = awaySquad.filter(p => p.status === 'starting').length;

    if (homeStarting !== 11) {
      toast.error(`Home team needs exactly 11 starting players (currently ${homeStarting})`);
      return;
    }

    if (awayStarting !== 11) {
      toast.error(`Away team needs exactly 11 starting players (currently ${awayStarting})`);
      return;
    }

    try {
      await saveAndProceed(homeSquad, awaySquad);
    } catch {
      // Error handled by hook
    }
  };

  if (matchLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1">
          <p>Match not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const homeStartingCount = homeSquad.filter(p => p.status === 'starting').length;
  const awayStartingCount = awaySquad.filter(p => p.status === 'starting').length;

  const renderPlayerList = (players: Player[] | undefined, squad: SquadPlayer[], teamType: 'home' | 'away', team: Team | null) => {
    const isLoading = teamType === 'home' ? homePlayersLoading : awayPlayersLoading;

    if (isLoading) {
      return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (!players || players.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No players found for this team</p>
          <Button
            variant="outline"
            onClick={() => {
              setNewPlayerForm(prev => ({ ...prev, teamId: team?.id || '' }));
              setNewPlayerDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Player
          </Button>
        </div>
      );
    }

    // Sort players: Starting XI first, then Substitutes, then Unselected
    const sortedPlayers = [...players].sort((a, b) => {
      const aInSquad = squad.find(p => p.id === a.id);
      const bInSquad = squad.find(p => p.id === b.id);

      // Priority: starting (0) > substitute (1) > unselected (2)
      const getPriority = (player: Player) => {
        const inSquad = squad.find(p => p.id === player.id);
        if (!inSquad) return 2;
        return inSquad.status === 'starting' ? 0 : 1;
      };

      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, sort by jersey number
      return a.jersey_number - b.jersey_number;
    });

    const startingPlayers = sortedPlayers.filter(p => squad.find(s => s.id === p.id)?.status === 'starting');
    const substitutePlayers = sortedPlayers.filter(p => squad.find(s => s.id === p.id)?.status === 'substitute');
    const unselectedPlayers = sortedPlayers.filter(p => !squad.find(s => s.id === p.id));

    const renderPlayerItem = (player: Player) => {
      const inSquad = squad.find(p => p.id === player.id);

      return (
        <div
          key={player.id}
          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${inSquad ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
            }`}
          onClick={() => togglePlayerInSquad(player, teamType)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
              <Shirt className="h-4 w-4 mr-1" />
              {player.jersey_number}
            </div>
            <div>
              <p className="font-medium">{player.name}</p>
              {player.role && <p className="text-xs text-muted-foreground">{player.role}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inSquad && (
              <>
                <Badge
                  variant={inSquad.status === 'starting' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayerStatus(player.id, teamType);
                  }}
                >
                  {inSquad.status === 'starting' ? 'Starting XI' : 'Substitute'}
                </Badge>
                <Check className="h-5 w-5 text-primary" />
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {startingPlayers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">Starting XI ({startingPlayers.length}/11)</p>
            {startingPlayers.map(renderPlayerItem)}
          </div>
        )}
        {substitutePlayers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">Substitutes ({substitutePlayers.length})</p>
            {substitutePlayers.map(renderPlayerItem)}
          </div>
        )}
        {unselectedPlayers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">Available Players ({unselectedPlayers.length})</p>
            {unselectedPlayers.map(renderPlayerItem)}
          </div>
        )}
      </div>
    );
  };

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

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Select Match Day Squad</h1>
          <p className="text-muted-foreground">
            {match.home_team?.name} vs {match.away_team?.name} • {new Date(match.match_date).toLocaleDateString()}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Home Team */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {match.home_team?.name} (Home)
                  </CardTitle>
                  <CardDescription>
                    Starting: {homeStartingCount}/11 • Subs: {homeSquad.filter(p => p.status === 'substitute').length}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewPlayerForm(prev => ({ ...prev, teamId: match.home_team_id }));
                    setNewPlayerDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Player
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {renderPlayerList(homePlayers, homeSquad, 'home', match.home_team)}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Away Team */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {match.away_team?.name} (Away)
                  </CardTitle>
                  <CardDescription>
                    Starting: {awayStartingCount}/11 • Subs: {awaySquad.filter(p => p.status === 'substitute').length}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewTeamDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Team
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPlayerForm(prev => ({ ...prev, teamId: match.away_team_id }));
                      setNewPlayerDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Player
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {renderPlayerList(awayPlayers, awaySquad, 'away', match.away_team)}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            onClick={handleProceed}
            disabled={homeStartingCount !== 11 || awayStartingCount !== 11 || saveSquadMutation.isPending}
          >
            {saveSquadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Proceed to Event Logging'
            )}
          </Button>
        </div>

        {/* New Player Dialog */}
        <Dialog open={newPlayerDialogOpen} onOpenChange={setNewPlayerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>
                Create a new player for the team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Player Name *</Label>
                <Input
                  id="playerName"
                  value={newPlayerForm.name}
                  onChange={(e) => setNewPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jerseyNumber">Jersey Number *</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  value={newPlayerForm.jerseyNumber}
                  onChange={(e) => setNewPlayerForm(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                  placeholder="e.g., 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Position (optional)</Label>
                <Input
                  id="role"
                  value={newPlayerForm.role}
                  onChange={(e) => setNewPlayerForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Midfielder"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewPlayerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlayer} disabled={createPlayerMutation.isPending}>
                {createPlayerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Player'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

export default function AdminSquadSelection() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminSquadSelectionContent />
    </ProtectedRoute>
  );
}
