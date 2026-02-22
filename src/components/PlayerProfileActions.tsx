import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';

interface PlayerProfile {
  id: string;
  name: string;
  jersey_number: number;
  role: string | null;
  hidden: boolean | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  contract_end_date: string | null;
  transfer_status: string | null;
  on_loan: boolean | null;
  injury_status: string | null;
  photo_url: string | null;
  bio: string | null;
}

interface PlayerProfileActionsProps {
  playerName: string;
  teamSlug: string;
}

export function PlayerProfileActions({ playerName, teamSlug }: PlayerProfileActionsProps) {
  const { isAdmin, isCoach } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playerData, setPlayerData] = useState<PlayerProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<PlayerProfile>>({});

  if (!isAdmin && !isCoach) return null;

  const fetchPlayer = async () => {
    const { data: team } = await supabase
      .from('teams').select('id').eq('slug', teamSlug).single();
    if (!team) return;

    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', team.id)
      .eq('name', playerName)
      .or('hidden.is.null,hidden.eq.false')
      .maybeSingle();

    if (data) {
      setPlayerData(data as PlayerProfile);
      setForm(data as PlayerProfile);
    }
  };

  const handleEditOpen = async () => {
    await fetchPlayer();
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!playerData) return;
    setLoading(true);

    const { error } = await supabase
      .from('players')
      .update({
        name: form.name,
        jersey_number: form.jersey_number,
        role: form.role || null,
        hidden: form.hidden || false,
        height_cm: form.height_cm || null,
        weight_kg: form.weight_kg || null,
        preferred_foot: form.preferred_foot || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality || null,
        contract_end_date: form.contract_end_date || null,
        transfer_status: form.transfer_status || 'active',
        on_loan: form.on_loan || false,
        injury_status: form.injury_status || null,
        photo_url: form.photo_url || null,
        bio: form.bio || null,
      })
      .eq('id', playerData.id);

    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Player updated successfully' });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
      queryClient.invalidateQueries({ queryKey: ['team-with-players'] });
      // If name changed, navigate to new URL
      if (form.name && form.name !== playerName) {
        navigate(`/team/${teamSlug}/player/${encodeURIComponent(form.name)}`, { replace: true });
      }
    }
  };

  const handleSoftDelete = async () => {
    if (!playerData) return;
    setLoading(true);

    const { error } = await supabase
      .from('players')
      .update({ hidden: true })
      .eq('id', playerData.id);

    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${playerData.name} has been removed` });
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
      navigate(`/team/${teamSlug}`, { replace: true });
    }
  };

  const handleDeleteOpen = async () => {
    await fetchPlayer();
    setIsDeleteOpen(true);
  };

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleEditOpen}>
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={handleDeleteOpen}>
          <Trash2 className="h-4 w-4 mr-1" /> Remove
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player Profile</DialogTitle>
            <DialogDescription>Update player information and optional details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Required fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name || ''} onChange={e => updateField('name', e.target.value)} />
              </div>
              <div>
                <Label>Jersey # *</Label>
                <Input type="number" value={form.jersey_number ?? ''} onChange={e => updateField('jersey_number', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div>
              <Label>Position/Role</Label>
              <Input value={form.role || ''} onChange={e => updateField('role', e.target.value)} placeholder="e.g., GK, CB, CM, FW" />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Physical Attributes</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Height (cm)</Label>
                  <Input type="number" value={form.height_cm ?? ''} onChange={e => updateField('height_cm', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={form.weight_kg ?? ''} onChange={e => updateField('weight_kg', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
                <div>
                  <Label>Preferred Foot</Label>
                  <Select value={form.preferred_foot || ''} onValueChange={v => updateField('preferred_foot', v || null)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Personal</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth || ''} onChange={e => updateField('date_of_birth', e.target.value || null)} />
                </div>
                <div>
                  <Label>Nationality</Label>
                  <Input value={form.nationality || ''} onChange={e => updateField('nationality', e.target.value)} placeholder="e.g., Gibraltarian" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Contract & Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contract End</Label>
                  <Input type="date" value={form.contract_end_date || ''} onChange={e => updateField('contract_end_date', e.target.value || null)} />
                </div>
                <div>
                  <Label>Transfer Status</Label>
                  <Select value={form.transfer_status || 'active'} onValueChange={v => updateField('transfer_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="transfer_listed">Transfer Listed</SelectItem>
                      <SelectItem value="loan_out">Loan Out</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.on_loan || false} onCheckedChange={v => updateField('on_loan', v)} />
                  <Label>On Loan</Label>
                </div>
                <div>
                  <Label>Injury Status</Label>
                  <Input value={form.injury_status || ''} onChange={e => updateField('injury_status', e.target.value)} placeholder="e.g., Fit, Hamstring" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Media & Bio</h4>
              <div>
                <Label>Photo URL</Label>
                <Input value={form.photo_url || ''} onChange={e => updateField('photo_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="mt-3">
                <Label>Bio / Notes</Label>
                <Textarea value={form.bio || ''} onChange={e => updateField('bio', e.target.value)} placeholder="Player notes..." rows={3} />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t pt-4">
              <Switch checked={form.hidden || false} onCheckedChange={v => updateField('hidden', v)} />
              <Label className="text-sm">Hide this player</Label>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{playerData?.name}</strong>?
              The player data will be preserved but hidden from all views.
              You can restore them later from the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
