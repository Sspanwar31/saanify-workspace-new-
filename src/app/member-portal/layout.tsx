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
      } else {
        // Get Member ID for notifications
        const { data: member } = await supabase.from('members').select('id').eq('auth_user_id', session.user.id).single();
        if(member) setMemberId(member.id);
        setAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  // ✅ GLOBAL NOTIFICATION LISTENER
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
          // Show Toast on ANY page
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
      {/* Toast Container */}
      <Toaster position="top-center" />

      {/* Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
         <MemberSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
