import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, ArrowRight, ArrowLeft, Upload, Check, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const { refreshOrg } = useOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Org details
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 2: Team details
  const [teamName, setTeamName] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleOrgNameChange = (value: string) => {
    setOrgName(value);
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(value));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Logo must be under 2MB', variant: 'destructive' });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !orgSlug.trim() || !user) return;
    setIsLoading(true);

    try {
      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${orgSlug}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('org-logos')
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('org-logos')
          .getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      // Create organization (use client-generated ID to avoid SELECT-on-insert RLS issue)
      const orgId = crypto.randomUUID();
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: orgName.trim(),
          slug: orgSlug.trim(),
          owner_id: user.id,
          logo_url: logoUrl,
        });

      if (orgError) {
        if (orgError.message.includes('duplicate')) {
          toast({ title: 'Slug taken', description: 'That URL slug is already in use. Try another.', variant: 'destructive' });
        } else {
          throw orgError;
        }
        return;
      }

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      if (memberError) throw memberError;

      toast({ title: 'Club created!', description: `${orgName} is ready to go` });
      setStep(2);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setIsLoading(true);

    try {
      // Get the org we just created
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single();

      if (!orgs) throw new Error('Organization not found');

      const teamSlug = generateSlug(teamName);

      const { error } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          slug: teamSlug,
          organization_id: orgs.id,
        });

      if (error) throw error;

      await refreshOrg();
      toast({ title: 'Team added!', description: 'Your club is all set up' });
      setStep(3);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s < step
                    ? 'bg-primary text-primary-foreground'
                    : s === step
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Create Club */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create Your Club</CardTitle>
              <CardDescription>
                Set up your football club to start tracking stats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Club Name</Label>
                <Input
                  id="org-name"
                  placeholder="e.g. Glacis United FC"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">app.com/</span>
                  <Input
                    id="org-slug"
                    placeholder="glacis-united-fc"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(generateSlug(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Club Logo (optional)</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain rounded-lg"
                      />
                      <span className="text-sm text-muted-foreground">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload logo (max 2MB)
                      </span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCreateOrg}
                disabled={!orgName.trim() || !orgSlug.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Creating...' : 'Create Club'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Add First Team */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Add Your First Team</CardTitle>
              <CardDescription>
                Create a team to start adding players and tracking matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="e.g. First Team, U-21s, Women's Team"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Adding...' : 'Add Team'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: All Done */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <Check className="h-7 w-7 text-accent" />
              </div>
              <CardTitle className="text-2xl">You're All Set!</CardTitle>
              <CardDescription>
                Your club <strong>{orgName}</strong> is ready. Start adding players and tracking matches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleFinish}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
