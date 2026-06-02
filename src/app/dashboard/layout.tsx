'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useClientStore } from '@/lib/client/store';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2, X, Settings } from 'lucide-react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

// ✅ Block Screen Component
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // ━━━ STATES ━━━
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>(null); // ✅ Added System Settings State
  const [isChecking, setIsChecking] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ━━━ FETCH SYSTEM SETTINGS ━━━
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSysSettings(data);
      } catch (e) {
        console.error("Failed to fetch system settings", e);
      }
    };
    fetchSettings();
  }, []);

  // ━━━ AUTH + PROFILE SYNC ━━━
  useEffect(() => {
    const performAuthSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/login'); return; }

        const { data: profile, error: pError } = await supabase
          .from('current_active_profile')
          .select('*')
          .maybeSingle();

        console.log("🎯 [DEBUG] Profile Data:", profile?.society_name);

        if (pError) console.error("❌ View Error:", pError);

        if (!profile) {
          console.error("🚫 REDIRECT: Profile is NULL");
          router.replace('/login');
          return;
        }

        if (profile.status !== 'ACTIVE') {
           console.error("🚫 REDIRECT: Account Status is:", profile.status);
           router.replace('/login');
           return;
        }

        // 🚀 ASLI FIX: LocalStorage aur Store ko update karein
        // Iske bina 'useReportLogic' hook ko naya client nahi dikhega
        localStorage.setItem('current_user', JSON.stringify(profile)); // 👈 Zaruri line
        localStorage.setItem('active_client_id', profile.id);

        useClientStore.setState({ currentUser: profile, isLoggedIn: true });
        setUserProfile(profile);
        
        // 🚀 THEME FIX: Instant Theme Apply
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Banner logic: Agar session ID aur profile ID alag hai toh Admin dekh raha hai
        setIsImpersonating(session.user.id !== profile.id);

        console.log("🎉 SUCCESS: Dashboard loaded for", profile.society_name);
        setIsChecking(false);

      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    };

    performAuthSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ━━━ REALTIME PERMISSION SYNC ━━━
  useEffect(() => {
    if (!userProfile) return;

    const ownerId = userProfile.role === 'treasurer' ? userProfile.client_id : userProfile.id;

    const channel: RealtimeChannel = supabase
      .channel(`client-perm-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${ownerId}`
        },
        (payload) => {
          console.log('🔥 Permission Realtime Update');
          const updated = payload.new as any;
          
          // 🚀 LocalStorage bhi update karein realtime mein
          const currentStored = localStorage.getItem('current_user');
          if (currentStored) {
            const parsed = JSON.parse(currentStored);
            parsed.role_permissions = updated.role_permissions;
            localStorage.setItem('current_user', JSON.stringify(parsed));
          }

          setUserProfile((prev: any) => ({
            ...prev,
            role_permissions: updated.role_permissions
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, userProfile?.client_id]);

  // ━━━ PERMISSION GUARD (Treasurer) ━━━
  useEffect(() => {
    if (!userProfile || userProfile.role !== 'treasurer') return;

    const perms: string[] = Array.isArray(userProfile?.role_permissions?.treasurer)
      ? userProfile.role_permissions.treasurer
      : [];

    const path = pathname.toLowerCase();

    const permissionMap: Record<string, string> = {
      'members': 'View Members',
      'passbook': 'View Passbook',
      'loans': 'View Loans',
      'expenses': 'Manage Expenses',
      'reports': 'View Reports',
      'maturity': 'View Dashboard',
      'admin-fund': 'Manage Admin Fund',
      'user-management': 'User Management Access',
      'settings': 'View Settings'
    };

    if (path !== '/dashboard') {
      const requiredPerm = Object.entries(permissionMap).find(([key]) => path.includes(key))?.[1];

      if (requiredPerm && !perms.includes(requiredPerm)) {
        toast.error("Access Restricted: Permission required");
        router.push('/dashboard');
      }
    }
  }, [pathname, userProfile, router]);

  // ━━━ BACK TO ADMIN ━━━
  const handleBackToAdmin = useCallback(async () => {
    const toastId = toast.loading("Exiting view mode...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. DB Cleanup
        await supabase.from('admin_active_viewing').delete().eq('admin_id', user.id);
      }

      // 2. Global Cleanup
      document.documentElement.classList.remove('dark');
      
      // 🚀 Sabse zaruri: In 3 keys ko hatayein
      localStorage.removeItem('is_admin_viewing');
      localStorage.removeItem('viewing_client_id');
      localStorage.removeItem('is_admin_impersonating');
      
      // 3. Clear Zustand Keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('saanify-storage-')) localStorage.removeItem(key);
      });

      toast.success("Welcome back Admin", { id: toastId });
      
      // 4. Force Reload to Admin List
      window.location.href = '/admin/clients';

    } catch (err) {
      window.location.href = '/admin/clients';
    }
  }, []);

  // ━━━ CLOSE MOBILE MENU ON ROUTE CHANGE ━━━
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ━━━ LOADING SCREEN ━━━
  if (isChecking) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950 gap-4">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading your workspace...</p>
      </div>
    );
  }

  // ━━━ MAIN LAYOUT ━━━
  return (
    <>
      {/* 1. Full Lockout Check */}
      {sysSettings?.is_maintenance_mode && <MaintenanceScreen settings={sysSettings} />}

      {/* 2. Upcoming Notice Banner */}
      {sysSettings?.is_maintenance_scheduled && !sysSettings?.is_maintenance_mode && (
        <div className="bg-orange-600 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top duration-500 z-[1000] sticky top-0">
          <span>
            ⚠️ SCHEDULED MAINTENANCE: Our systems will be down from {new Date(sysSettings.maintenance_start).toLocaleString()} to {new Date(sysSettings.maintenance_end).toLocaleString()}
          </span>
        </div>
      )}

      {/* ━━ IMPERSONATION BANNER ━━ */}
      {isImpersonating && (
        <div className="w-full bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 text-white px-4 md:px-6 py-2.5 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[1000]">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-purple-200 shrink-0" />
            <span className="font-semibold tracking-wide truncate">
              ADMIN VIEW: {userProfile?.society_name?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={handleBackToAdmin}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ml-3"
          >
            <ArrowLeft className="w-3 h-3" /> Exit View
          </button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        {/* ━━ DESKTOP SIDEBAR ━━ */}
        <div className="w-64 shrink-0 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ClientSidebar profile={userProfile} />
        </div>

        {/* ━━ MOBILE SIDEBAR OVERLAY ━━ */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Sidebar Panel */}
            <div className="relative w-72 h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <ClientSidebar profile={userProfile} />
            </div>
          </div>
        )}

        {/* ━━ MAIN CONTENT ━━ */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* ━━ MOBILE BOTTOM NAV ━━ */}
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
