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
    // (Existing Logic - No Change)
    if (user.role === 'client' || user.role === 'client_admin' || user.role === 'treasurer') {
        const targetId = user.role === 'treasurer' ? user.client_id : user.id;
        
        const clientChannel = supabase
        .channel(`global_client_watch:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${targetId}` },
          async (payload: any) => {
            const newStatus = (payload.new.status || '').toUpperCase();
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

  // --- LOGIC 2: AGAR MAIN TREASURER HU (Watch My Self) ---
  // (Existing Logic - No Change)
  useEffect(() => {
    if (!user?.id || user.role !== 'treasurer') return;

    const selfChannel = supabase
      .channel(`global_treasurer_watch:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${user.id}` },
        async (payload: any) => {
          const newStatus = (payload.new.status || '').toUpperCase();
          if (['BLOCKED', 'LOCKED', 'INACTIVE'].includes(newStatus)) {
            toast.error("Your account has been blocked by admin.");
            await logout();
            router.replace('/login');
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(selfChannel); };
  }, [user, router, logout]);

  // --- 🔥 LOGIC 3: AGAR MAIN MEMBER HU (NEW ADDITION) ---
  useEffect(() => {
    // Member ki pehchan: Role 'member' hoga
    if (!user?.id || user.role !== 'member') return;

    // Note: Humein 'members' table ko sunna hai jahan auth_user_id meri ho
    const memberChannel = supabase
      .channel(`global_member_watch:${user.id}`)
      .on(
        'postgres_changes',
        { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'members', 
            filter: `auth_user_id=eq.${user.id}` // 🔥 Listen ONLY My Row
        },
        async (payload: any) => {
          const newStatus = (payload.new.status || '').toLowerCase(); // Use lowercase for members
          
          if (newStatus === 'blocked' || newStatus === 'inactive') {
            console.log("🔒 Member Blocked. Logging out...");
            toast.error("Your account has been blocked by the admin.");
            
            await logout(); // Force Logout
            router.replace('/login');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memberChannel);
    };
  }, [user, router, logout]);

  return null;
}
