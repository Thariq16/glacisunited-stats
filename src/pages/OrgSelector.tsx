import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';

export default function OrgSelector() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch all orgs (publicly readable via RLS for members, but we show all for navigation)
  const { data: allOrgs, isLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: async () => {
      // For public stats viewer, just list all orgs
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // If user is logged in, fetch their memberships to auto-redirect
  const { data: userOrgs } = useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations:organization_id(slug)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Auto-redirect if user belongs to exactly one org
  useEffect(() => {
    if (userOrgs && userOrgs.length === 1) {
      const orgSlug = (userOrgs[0] as any).organizations?.slug;
      if (orgSlug) {
        navigate(`/org/${orgSlug}`, { replace: true });
      }
    }
  }, [userOrgs, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Select a Club</h1>
          <p className="text-muted-foreground">Choose a club to view their stats</p>
        </div>
        
        <div className="space-y-3">
          {allOrgs?.map(org => (
            <Card
              key={org.id}
              className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
              onClick={() => navigate(`/org/${org.slug}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">
                      {org.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{org.name}</p>
                  <p className="text-sm text-muted-foreground">/{org.slug}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {allOrgs?.length === 0 && (
            <p className="text-center text-muted-foreground">No organizations found</p>
          )}
        </div>
      </div>
    </div>
  );
}
