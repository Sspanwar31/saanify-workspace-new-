'use client';

import MemberSidebar from '@/components/member/MemberSidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Bell, Settings, AlertTriangle } from 'lucide-react'; // ✅ Settings aur AlertTriangle icons add kiye
import { Toaster, toast } from 'sonner';

// 1. Maintenance Screen Component (Same design as client)
const MaintenanceScreen = ({ settings }: any) => (
  <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
      <Settings className="w-12 h-12 text-red-500 animate-spin" />
    </div>
    <h1 className="text-4xl font-black mb-4">{settings.maintenance_title}</h1>
    <p className="max-w-md text-slate-400 text-lg mb-8">{settings.maintenance_msg}</p>
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
      <p className="text-sm text-slate-500 uppercase font-bold mb-2">Service Resumes At</p>
      <p className="text-2xl font-mono text-green-400">{new Date(settings.maintenance_end).toLocaleString()}</p>
    </div>
  </div>
);

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  
  // 🔥 NEW STATE: System Settings
  const [sysSettings, setSysSettings] = useState<any>(null);

  // ━━━ 1. FETCH SYSTEM SETTINGS & REALTIME LISTENER (NEW) ━━━
  useEffect(() => {
    // Initial Fetch
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSysSettings(data);
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();

    // Realtime Listener for System Settings (Table: system_settings)
    const settingsChannel = supabase
      .channel('member-system-settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' },
        (payload) => {
          console.log('🚀 MEMBER PANEL: Maintenance Update Received', payload.new);
          setSysSettings(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(settingsChannel); };
  }, []);

  // ━━━ 2. AUTH CHECK & SECURITY (EXISTING LOGIC) ━━━
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch Member Profile & Role & Status
      const { data: member } = await supabase
        .from('members')
        .select('id, role, status') 
        .eq('auth_user_id', session.user.id)
        .single();

      if (member) {
        // 🛑 SECURITY CHECK 1: Agar blocked hai to bhaga do
        if ((member.status || 'active').toLowerCase() !== 'active') {
            toast.error("Your account has been blocked.");
            await supabase.auth.signOut();
            router.push('/login');
            return;
        }

        // 🛑 SECURITY CHECK 2: Agar Treasurer hai, to yahan mat aane do
        if (member.role === 'treasurer') {
            toast.info("Redirecting to Treasurer Dashboard...");
            router.push('/dashboard'); 
            return;
        }

        setMemberId(member.id);
        setAuthorized(true);
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // ━━━ 3. REALTIME STATUS & NOTIFICATION LISTENER (EXISTING LOGIC) ━━━
  useEffect(() => {
    if (!memberId) return;

    // Listen for Status Change (Live Block)
    const statusChannel = supabase.channel(`member_status_guard:${memberId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${memberId}` },
        async (payload) => {
            if ((payload.new.status || 'active').toLowerCase() !== 'active') {
                toast.error("Account Blocked by Admin. Logging out...");
                await supabase.auth.signOut();
                router.replace('/login');
            }
        }).subscribe();

    // Listen for Notifications
    const notifChannel = supabase.channel('global-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `member_id=eq.${memberId}` },
        (payload) => { 
          toast(payload.new.title, { 
            description: payload.new.message, 
            icon: <Bell className="w-5 h-5 text-blue-500" /> 
          }); 
        }
      ).subscribe();

    return () => { 
      supabase.removeChannel(statusChannel); 
      supabase.removeChannel(notifChannel); 
    };
  }, [memberId, router]);

  if (!authorized) {
    return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  // ━━━ 4. RENDER LOGIC ━━━
  return (
    <>
      {/* FULL LOCKOUT SCREEN: Agar Maintenance Mode ON hai */}
      {sysSettings?.is_maintenance_mode && <MaintenanceScreen settings={sysSettings} />}

      {/* TOP BANNER: Agar Scheduled hai lekin mode OFF hai */}
      {sysSettings?.is_maintenance_scheduled && !sysSettings?.is_maintenance_mode && (
        <div className="bg-orange-600 text-white py-2 text-center text-xs font-bold z-[1000] sticky top-0 flex items-center justify-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          <span>
            MAINTENANCE NOTICE: {sysSettings.maintenance_title} (Expected: {new Date(sysSettings.maintenance_end).toLocaleString()})
          </span>
        </div>
      )}

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
    </>
  );
}
