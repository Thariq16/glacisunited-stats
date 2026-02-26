import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCoach?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireCoach = false }: ProtectedRouteProps) {
  const { user, isAdmin, isCoach, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (requireAdmin && !isAdmin) {
        navigate('/dashboard');
      } else if (requireCoach && !isAdmin && !isCoach) {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, isCoach, loading, requireAdmin, requireCoach, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requireCoach && !isAdmin && !isCoach) {
    return null;
  }

  return <>{children}</>;
}