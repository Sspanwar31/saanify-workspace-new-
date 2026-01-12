'use client';

import MemberSidebar from '@/components/member/MemberSidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Bell } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch Member Profile & Role
      const { data: member } = await supabase
        .from('members')
        .select('id, role') // ✅ Role bhi fetch kiya
        .eq('auth_user_id', session.user.id)
        .single();

      if (member) {
        // 🛑 SECURITY CHECK: Agar Treasurer hai, to yahan mat aane do
        if (member.role === 'treasurer') {
            toast.info("Redirecting to Treasurer Dashboard...");
            router.push('/dashboard'); // Sahi jagah bhejo
            return;
        }

        // Agar Member hai, to allow karo
        setMemberId(member.id);
        setAuthorized(true);
      } else {
        // Agar profile nahi mili, wapas login
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // Global Notification Listener (Same as before)
  useEffect(() => {
    if (!memberId) return;

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `member_id=eq.${memberId}`
        },
        (payload) => {
          toast(payload.new.title, {
            description: payload.new.message,
            icon: <Bell className="w-5 h-5 text-blue-500" />,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  if (!authorized) {
    return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster position="top-center" />
      <div className="hidden md:block w-64 flex-shrink-0">
         <MemberSidebar />
      </div>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
