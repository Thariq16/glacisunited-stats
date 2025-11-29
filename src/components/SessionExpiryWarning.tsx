import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes before expiry

export function SessionExpiryWarning() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [warningShown, setWarningShown] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setWarningShown(false);
      toast({
        title: "Session Extended",
        description: "You've been kept logged in.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Session Refresh Failed",
        description: "Please log in again.",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!session || !user) {
      setWarningShown(false);
      return;
    }

    const checkExpiry = () => {
      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const expiryTime = expiresAt * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= WARNING_BEFORE_EXPIRY_MS && timeUntilExpiry > 0 && !warningShown) {
        setWarningShown(true);
        
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        
        toast({
          title: "Session Expiring Soon",
          description: (
            <div className="flex flex-col gap-2">
              <span>Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.</span>
              <Button 
                size="sm" 
                onClick={refreshSession}
                className="w-fit"
              >
                Stay Logged In
              </Button>
            </div>
          ),
          duration: timeUntilExpiry,
        });
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);

    return () => clearInterval(interval);
  }, [session, user, warningShown, toast, refreshSession]);

  return null;
}
