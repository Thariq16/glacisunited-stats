import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const supported = isPWA && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready as any;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = async () => {
    try {
      // Get VAPID public key from edge function
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error || !data?.publicKey) throw new Error('Failed to get VAPID key');

      const registration = await navigator.serviceWorker.ready as any;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      const subJson = subscription.toJSON();
      
      // Store subscription in database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        }, { onConflict: 'endpoint' });

      if (dbError) throw dbError;
      
      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.error('Push subscription failed:', e);
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready as any;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', endpoint);
      }
      
      setIsSubscribed(false);
      return true;
    } catch (e) {
      console.error('Push unsubscribe failed:', e);
      return false;
    }
  };

  return { isSubscribed, isSupported, subscribe, unsubscribe };
}
