import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { toast } from 'sonner';

const DISMISS_KEY = 'push-prompt-dismissed';
const DISMISS_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 days

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, subscribe } = usePushSubscription();
  const [dismissed, setDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    return dismissedAt ? Date.now() - parseInt(dismissedAt) < DISMISS_DURATION : false;
  });

  if (!isSupported || isSubscribed || dismissed) return null;

  const handleSubscribe = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Notification permission denied');
      return;
    }
    const success = await subscribe();
    if (success) {
      toast.success('You\'ll be notified when matches are completed!');
    } else {
      toast.error('Failed to enable notifications');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-primary/30 rounded-xl p-4 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-primary/10 rounded-lg p-2.5">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Match Notifications
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get notified when matches are completed with live scores
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleSubscribe} className="h-8 text-xs gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Enable
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs text-muted-foreground">
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
