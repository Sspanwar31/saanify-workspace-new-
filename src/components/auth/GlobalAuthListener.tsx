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
    // (Ye already chal raha hai, isse waise hi rehne dein)
    const targetId = user.role === 'treasurer' ? user.client_id : user.id;

    if (targetId) {
      const clientChannel = supabase
        .channel(`global_client_watch:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${targetId}` },
          async (payload: any) => {
            const newStatus = payload.new.status;
            if (newStatus === 'LOCKED' || newStatus === 'EXPIRED') {
              toast.error("Organization account suspended. Logging out...");
              await logout();
              router.replace('/login');
            }
          }
        )
        .subscribe();
        
      // Cleanup for client listener
      return () => { supabase.removeChannel(clientChannel); };
    }

  }, [user, router, logout]);


  // --- LOGIC 2: AGAR MAIN MEMBER / TREASURER HU (New Logic) ---
  useEffect(() => {
    if (!user?.id || user.role === 'client' || user.role === 'ADMIN') return;

    // Is member ki ID nikalo (auth_user_id se link hoti hai members table me)
    // Note: Hum user.id (Auth ID) use kar rahe hain status check karne ke liye
    
    const memberChannel = supabase
      .channel(`global_member_watch:${user.id}`)
      .on(
        'postgres_changes',
        { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'members', 
            filter: `auth_user_id=eq.${user.id}` // 🔥 Listen My Row in Members Table
        },
        async (payload: any) => {
          const newStatus = payload.new.status; // 'active' or 'blocked'
          
          if (newStatus === 'blocked' || newStatus === 'inactive') {
            console.log("🔒 Member/Treasurer Blocked by Client. Logging out...");
            toast.error("Your account has been blocked by the admin.");
            
            await logout();
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
