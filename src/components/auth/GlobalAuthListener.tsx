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
    if (!user?.id) return;

    // 1. Determine Target ID to Watch
    // Agar main Client hu -> Watch My ID
    // Agar main Treasurer hu -> Watch My Boss's ID (client_id)
    const targetId = user.role === 'treasurer' ? user.client_id : user.id;

    if (!targetId) return;

    // 2. Realtime Listener
    const channel = supabase
      .channel(`global_status_watch:${user.id}`) // Unique Channel Name
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${targetId}` // 🔥 Watch Boss or Self
        },
        async (payload: any) => {
          const newStatus = payload.new.status;
          
          if (newStatus === 'LOCKED' || newStatus === 'EXPIRED') {
            console.log(`🔒 Parent Account ${newStatus}. Logging out staff/user...`);
            
            toast.error(
              user.role === 'treasurer' 
                ? `Organization account has been ${newStatus}. Logging out...`
                : `Your account has been ${newStatus}. Logging out...`
            );
            
            await logout();
            router.replace('/login');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, router, logout]);

  return null;
}
