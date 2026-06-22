'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useClientStore } from '@/lib/client/store';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2, X, Settings, Sparkles } from 'lucide-react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ✅ STEP 3: Renamed import to BroadcastRenderer
import BroadcastRenderer from '@/components/festival/v2/BroadcastRenderer';

// ✅ NEW: Import Animation Factory for Background Effects
import AnimationFactory from '@/components/festival/v2/AnimationFactory';

// =========================================================
// SUB-COMPONENTS
// =========================================================

// --- Maintenance Screen ---
const MaintenanceScreen = ({ settings }: any) => (
  <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
      <Settings className="w-12 h-12 text-red-500 animate-spin" />
    </div>
    <h1 className="text-4xl font-black mb-4">{settings?.maintenance_title || 'Under Maintenance'}</h1>
    <p className="max-w-md text-slate-400 text-lg mb-8">{settings?.maintenance_msg}</p>
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
      <p className="text-sm text-slate-500 uppercase font-bold mb-2">Service Resumes At</p>
      <p className="text-2xl font-mono text-green-400">
        {settings?.maintenance_end ? new Date(settings.maintenance_end).toLocaleString() : 'Soon'}
      </p>
    </div>
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>(null); 
  const [isChecking, setIsChecking] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  // ━━━ 1. REALTIME SYSTEM SETTINGS LISTENER ━━━
  useEffect(() => {
    const fetchInitialSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSysSettings(data);
      } catch (e) {
        console.error("Failed to fetch system settings", e);
      }
    };
    fetchInitialSettings();

    const settingsChannel = supabase
      .channel('public:system_settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'system_settings',
          filter: 'id=eq.1'
        },
        (payload) => {
          console.log('🚀 REALTIME: System Settings Updated', payload.new);
          setSysSettings(payload.new); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  // ━━━ 2. REALTIME BROADCAST LISTENER ━━━
  const fetchBroadcasts = useCallback(async () => {
    // Client Dashboard me existing query: Isko mat chhedo.
    const now = new Date().toISOString();
    const { data } = await supabase.from('broadcasts').select('*')
      .eq('is_active', true)
      .or('target_audience.eq.BOTH,target_audience.eq.CLIENT')
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('priority', { ascending: false }).order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    
    if (data) {
      setActiveBroadcast(data);
      const sessionSeen = sessionStorage.getItem(`seen_broadcast_${data.id}`);
      if (!sessionSeen && !hasSeenPopup) {
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    } else {
      setActiveBroadcast(null);
      setShowPopup(false);
    }
  }, [hasSeenPopup]);

  useEffect(() => {
    fetchBroadcasts();

    // Realtime listener
    const channel = supabase.channel('broadcast-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
        fetchBroadcasts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBroadcasts]);

  const handleDismissPopup = () => {
    setShowPopup(false);
    setHasSeenPopup(true);
    if (activeBroadcast) {
      sessionStorage.setItem(`seen_broadcast_${activeBroadcast.id}`, 'true');
    }
  };

  // ━━━ 3. AUTH + PROFILE SYNC (Using Restored Logic) ━━━
  useEffect(() => {
    const performAuthSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/login'); return; }

        const { data: profile } = await supabase.from('current_active_profile').select('*').maybeSingle();
        
        if (!profile || profile.status !== 'ACTIVE') {
          router.replace('/login');
          return;
        }

        localStorage.setItem('current_user', JSON.stringify(profile)); 
        localStorage.setItem('active_client_id', profile.id);

        useClientStore.setState({ currentUser: profile, isLoggedIn: true });
        setUserProfile(profile);
        
        // Theme Sync
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // 🔥 RESTORED: Admin View logic from old code (Block 1)
        const isAdminViewing = session.user.id !== profile.id;
        const localFlag = localStorage.getItem('is_admin_impersonating') === 'true';
        setIsImpersonating(isAdminViewing || localFlag);

        setIsChecking(false);
      } catch (err) {
        console.error(err);
        setIsChecking(false);
      }
    };
    performAuthSync();
  }, [router]);

  // ━━━ 4. REALTIME PERMISSION SYNC ━━━
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
          const updated = payload.new as any;
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

  // ━━━ 5. PERMISSION GUARD (Treasurer) ━━━
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

  // ━━━ 6. BACK TO ADMIN ━━━
  const handleBackToAdmin = useCallback(async () => {
    const toastId = toast.loading("Exiting view mode...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_active_viewing').delete().eq('admin_id', user.id);
      }

      document.documentElement.classList.remove('dark');
      localStorage.removeItem('is_admin_viewing');
      localStorage.removeItem('viewing_client_id');
      localStorage.removeItem('is_admin_impersonating');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('saanify-storage-')) localStorage.removeItem(key);
      });

      toast.success("Welcome back Admin", { id: toastId });
      window.location.href = '/admin/clients';

    } catch (err) {
      window.location.href = '/admin/clients';
    }
  }, []);

  // ━━━ LOADING SCREEN ━━━
  if (isChecking) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>;

  const isMaintenanceActive = sysSettings?.is_maintenance_mode;
  const shouldShowLockout = !isChecking && isMaintenanceActive && !isImpersonating;
  const bannerColorClass = activeBroadcast?.theme_color === 'GOLD' 
    ? 'bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700 text-slate-900' 
    : 'bg-gradient-to-r from-blue-800 via-indigo-600 to-blue-800 text-white';

  return (
    <>
      {/* FULL LOCKOUT */}
      {shouldShowLockout && <MaintenanceScreen settings={sysSettings} />}

      {/* SCHEDULED MAINTENANCE BANNER */}
      {sysSettings?.is_maintenance_scheduled && !isMaintenanceActive && (
        <div className="bg-orange-600 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top duration-500 z-[1000] sticky top-0">
          <span>
            ⚠️ SCHEDULED MAINTENANCE: {sysSettings.maintenance_title} ({new Date(sysSettings.maintenance_start).toLocaleString()} - {new Date(sysSettings.maintenance_end).toLocaleString()})
          </span>
        </div>
      )}

      {/* IMPERSONATION BANNER */}
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

      {/* ACTIVE BROADCAST BANNER */}
      {activeBroadcast && !showPopup && (
        <div className={"sticky top-0 z-[1001] w-full py-3 px-6 shadow-2xl " + bannerColorClass}>
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm font-black italic">
            <div className="flex items-center gap-4 flex-1 justify-center">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="bg-black/10 px-2 py-0.5 rounded text-[10px] font-black uppercase italic">Saanify Pariwar:</span>
              <p>{activeBroadcast?.message?.split('|')?.[0]}</p>
            </div>
            <button onClick={() => setActiveBroadcast(null)} className="p-1 hover:bg-black/5 rounded-full"><X className="w-5 h-5 opacity-70" /></button>
          </div>
        </div>
      )}

      {/* ✅ NEW: FULL SCREEN ANIMATIONS BEHIND POPUP */}
      {activeBroadcast && (
        <AnimationFactory
          engine={activeBroadcast?.hero_config?.animation}
          preset={activeBroadcast?.festival_key}
        />
      )}

      {/* HERO POPUP MODAL */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none overflow-visible">
           <BroadcastRenderer
             broadcast={activeBroadcast}
             onClose={handleDismissPopup}
           />
        </DialogContent>
      </Dialog>

      {/* DASHBOARD LAYOUT STRUCTURE */}
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        
        {/* DESKTOP SIDEBAR */}
        <div className="w-64 shrink-0 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ClientSidebar profile={userProfile} />
        </div>

        {/* MOBILE SIDEBAR OVERLAY */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
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

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative w-full">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
