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

    // --- LOGIC 1: AGAR MAIN CLIENT (OWNER) HU ---
    const targetId = user.role === 'treasurer' ? user.client_id : user.id;

    if (targetId) {
      const clientChannel = supabase
        .channel(`global_client_watch:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${targetId}` },
          async (payload: any) => {
            const newStatus = (payload.new.status || '').toUpperCase(); // Force Uppercase check
            
            // Checks for: LOCKED, EXPIRED, BLOCKED (Any case)
            if (['LOCKED', 'EXPIRED', 'BLOCKED'].includes(newStatus)) {
              toast.error("Organization account suspended. Logging out...");
              await logout();
              router.replace('/login');
            }
          }
        )
        .subscribe();
        
      return () => { supabase.removeChannel(clientChannel); };
    }

  }, [user, router, logout]);


  // --- LOGIC 2: AGAR MAIN TREASURER HU (Watch My Own Status) ---
  useEffect(() => {
    if (!user?.id || user.role !== 'treasurer') return;

    const selfChannel = supabase
      .channel(`global_self_watch:${user.id}`)
      .on(
        'postgres_changes',
        { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'clients', // Treasurer is in clients table
            filter: `id=eq.${user.id}` 
        },
        async (payload: any) => {
          const newStatus = (payload.new.status || '').toUpperCase(); // Force Uppercase check
          
          if (['BLOCKED', 'LOCKED', 'INACTIVE'].includes(newStatus)) {
            console.log("🔒 Account Blocked. Logging out...");
            toast.error("Your account has been blocked by admin.");
            
            await logout();
            router.replace('/login');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(selfChannel);
    };
  }, [user, router, logout]);

  return null;
}
