import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Edit, ArrowLeft, EyeOff, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

function AdminPlayersContent() {
  const [selectedTeam, setSelectedTeam] = useState('glacis-united-fc');
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', jersey_number: '', role: '', hidden: false });
  const [showHidden, setShowHidden] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', jersey_number: '', role: '', team_id: '' });
  
  const { data: players, refetch } = usePlayerStats(selectedTeam, 'all', showHidden);
  const { data: teams } = useTeams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEditClick = async (player: any) => {
    // Fetch player ID from database
    const { data: teams } = await supabase.from('teams').select('id').eq('slug', selectedTeam).single();
    if (!teams) return;

    const { data: playerData } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teams.id)
      .eq('name', player.playerName)
      .single();

    if (playerData) {
      setEditingPlayer(playerData);
      setEditForm({
        name: playerData.name,
        jersey_number: playerData.jersey_number.toString(),
        role: playerData.role || '',
        hidden: playerData.hidden || false,
      });
    }
  };

  const handleSave = async () => {
    if (!editingPlayer) return;

    const { error } = await supabase
      .from('players')
      .update({
        name: editForm.name,
        jersey_number: parseInt(editForm.jersey_number),
        role: editForm.role,
        hidden: editForm.hidden,
      })
      .eq('id', editingPlayer.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Player updated successfully',
      });
      setEditingPlayer(null);
      refetch();
    }
  };

  const handleCreatePlayer = async () => {
    if (!createForm.name.trim() || !createForm.jersey_number || !createForm.team_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('players')
      .insert({
        name: createForm.name.trim(),
        jersey_number: parseInt(createForm.jersey_number),
        role: createForm.role.trim() || null,
        team_id: createForm.team_id,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Player created successfully',
      });
      setIsCreateOpen(false);
      setCreateForm({ name: '', jersey_number: '', role: '', team_id: '' });
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Manage Players</h1>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Player
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <Label>Filter by Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.slug}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 pt-6">
              <Switch
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={setShowHidden}
              />
              <Label htmlFor="show-hidden" className="text-sm">
                Show hidden players
              </Label>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players && [...players]
            .sort((a, b) => parseInt(a.jerseyNumber) - parseInt(b.jerseyNumber))
            .map(player => (
            <Card key={`${player.jerseyNumber}-${player.playerName}`} className={player.hidden ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    #{player.jerseyNumber} {player.playerName}
                    {player.hidden && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </Badge>
                    )}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleEditClick(player)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{player.role || 'No position'}</p>
                <p className="text-sm mt-2">Goals: {player.goals}</p>
                <p className="text-sm">Passes: {player.passCount}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Player Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Jersey Number</Label>
              <Input
                type="number"
                value={editForm.jersey_number}
                onChange={(e) => setEditForm({ ...editForm, jersey_number: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Position/Role</Label>
              <Input
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                placeholder="e.g., GK, CB, FW"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="player-hidden"
                checked={editForm.hidden}
                onCheckedChange={(checked) => setEditForm({ ...editForm, hidden: checked })}
              />
              <Label htmlFor="player-hidden" className="text-sm">
                Hide this player (duplicate profile)
              </Label>
            </div>
            
            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Player Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Player</DialogTitle>
            <DialogDescription>Add a new player to any team</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Team *</Label>
              <Select value={createForm.team_id} onValueChange={(value) => setCreateForm({ ...createForm, team_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Player Name *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            
            <div>
              <Label>Jersey Number *</Label>
              <Input
                type="number"
                value={createForm.jersey_number}
                onChange={(e) => setCreateForm({ ...createForm, jersey_number: e.target.value })}
                placeholder="e.g., 10"
              />
            </div>
            
            <div>
              <Label>Position/Role</Label>
              <Input
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                placeholder="e.g., GK, CB, CM, FW"
              />
            </div>
            
            <Button onClick={handleCreatePlayer} className="w-full">
              Create Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

export default function AdminPlayers() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminPlayersContent />
    </ProtectedRoute>
  );
}
