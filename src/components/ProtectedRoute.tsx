import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrgPath } from '@/hooks/useOrgPath';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCoach?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireCoach = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isOrgAdmin, isOrgMember, orgRole, loading: orgLoading } = useOrganization();
  const orgPath = useOrgPath();
  const navigate = useNavigate();

  const loading = authLoading || orgLoading;
  const isCoachRole = orgRole === 'coach' || orgRole === 'analyst';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(orgPath('auth'));
      } else if (requireAdmin && !isOrgAdmin) {
        navigate(orgPath(''));
      } else if (requireCoach && !isOrgAdmin && !isCoachRole) {
        navigate(orgPath(''));
      }
    }
  }, [user, isOrgAdmin, isCoachRole, loading, requireAdmin, requireCoach, navigate, orgPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && !isOrgAdmin) return null;
  if (requireCoach && !isOrgAdmin && !isCoachRole) return null;

  return <>{children}</>;
}
