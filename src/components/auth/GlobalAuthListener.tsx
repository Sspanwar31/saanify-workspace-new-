'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function GlobalAuthListener() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Sirf tab chalao jab user login ho
    if (!user?.id) return;

    // Realtime Listener for Client Status
    const channel = supabase
      .channel(`global_client_status:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${user.id}` // Meri row suno
        },
        async (payload: any) => {
          const newStatus = payload.new.status;
          
          if (newStatus === 'LOCKED' || newStatus === 'EXPIRED') {
            console.log(`🔒 Account ${newStatus}. Logging out...`);
            
            toast.error(`Your account has been ${newStatus}. Logging out...`);
            
            // Logout and Force Redirect
            await logout();
            router.replace('/login');
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, router, logout]);

  // Ye component kuch render nahi karta, bas chupchap kaam karta hai
  return null;
}
