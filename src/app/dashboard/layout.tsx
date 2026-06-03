'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useClientStore } from '@/lib/client/store';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2, X, Settings, Globe, Sparkles, Flame, Palette } from 'lucide-react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [sysSettings, setSysSettings] = useState<any>(null); 
  const [isChecking, setIsChecking] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ NEW: Broadcast States
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false); // Session check

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

  // ━━━ 2. REALTIME BROADCAST LISTENER (UPDATED LOGIC) ━━━
  const fetchBroadcasts = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('is_active', true)
      .or('target_audience.eq.BOTH,target_audience.eq.CLIENT') // 🎯 Targeted for Clients
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setActiveBroadcast(data);
      // Popup logic: Sirf ek baar dikhao per session taaki user pareshan na ho
      const sessionSeen = sessionStorage.getItem(`seen_broadcast_${data.id}`);
      if (!sessionSeen && !hasSeenPopup) {
        setShowPopup(true);
      }
    } else {
      setActiveBroadcast(null);
      setShowPopup(false);
    }
  }, [hasSeenPopup]);

  useEffect(() => {
    fetchBroadcasts();
    const channel = supabase.channel('broadcast-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
        console.log("📢 Broadcast Update Detected");
        fetchBroadcasts(); // Update UI instantly on toggle
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBroadcasts]);

  // Close Popup logic: Popup band hote hi wo Banner mein transition ho jaye
  const handleDismissPopup = () => {
    setShowPopup(false);
    setHasSeenPopup(true);
    if (activeBroadcast) {
      sessionStorage.setItem(`seen_broadcast_${activeBroadcast.id}`, 'true');
    }
  };

  // ━━━ 2. VIRTUAL ANIMATIONS (DIYA, HOLI, CONFETTI) ━━━
  const RenderAnimations = () => {
    if (!showPopup || !activeBroadcast?.animation_type) return null;

    if (activeBroadcast.animation_type === 'DIYA') {
      return (
        <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="diya-glow absolute" style={{ 
              bottom: `${Math.random() * 20}%`, 
              left: `${Math.random() * 90}%`,
              fontSize: '40px' 
            }}>🪔</div>
          ))}
        </div>
      );
    }

    if (activeBroadcast.animation_type === 'HOLI') {
      const colors = ['#FF1493', '#32CD32', '#FFD700', '#FF4500', '#1E90FF'];
      return (
        <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="holi-splash" style={{ 
              top: `${Math.random() * 80}%`, 
              left: `${Math.random() * 80}%`, 
              width: '150px', height: '150px',
              background: colors[Math.floor(Math.random() * colors.length)],
              animationDelay: `${i * 0.3}s`
            }} />
          ))}
        </div>
      );
    }

    return null; // For CONFETTI use existing Toast or CSS Confetti
  };

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

        localStorage.setItem('current_user', JSON.stringify(profile)); 
        localStorage.setItem('active_client_id', profile.id);

        useClientStore.setState({ currentUser: profile, isLoggedIn: true });
        setUserProfile(profile);
        
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

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

  // ━━━ 2. MAINTENANCE LOGIC WITH ADMIN BYPASS ━━━
  const isMaintenanceActive = sysSettings?.is_maintenance_mode;
  const shouldShowLockout = !isChecking && isMaintenanceActive && !isImpersonating;

  return (
    <>
      {/* 1. Virtual Animations Layer */}
      <RenderAnimations />

      {/* 2. Full Lockout Check */}
      {shouldShowLockout && <MaintenanceScreen settings={sysSettings} />}

      {/* 3. Upcoming Notice Banner */}
      {sysSettings?.is_maintenance_scheduled && !isMaintenanceActive && (
        <div className="bg-orange-600 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top duration-500 z-[1000] sticky top-0">
          <span>
            ⚠️ SCHEDULED MAINTENANCE: {sysSettings.maintenance_title} ({new Date(sysSettings.maintenance_start).toLocaleString()} - {new Date(sysSettings.maintenance_end).toLocaleString()})
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

      {/* 4. HYBRID DISPLAY: TOP BANNER (Popup dismissal ke baad bhi rahega) */}
      {activeBroadcast && !showPopup && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-2.5 px-6 text-center text-xs font-bold z-[1001] sticky top-0 flex items-center justify-between shadow-lg border-b border-white/10">
          <div className="flex items-center gap-3 mx-auto">
             <div className="animate-bounce bg-white/20 p-1 rounded-full"><Sparkles className="w-3 h-3"/></div>
             <span className="uppercase tracking-widest opacity-70">[{activeBroadcast.type}]</span>
             <span>{activeBroadcast.message}</span>
          </div>
          <button onClick={() => setActiveBroadcast(null)} className="hover:bg-white/10 rounded-full p-1"><X className="w-4 h-4"/></button>
        </div>
      )}

      {/* 5. MODERN GREETING POPUP */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="sm:max-w-xl border-none p-0 bg-transparent shadow-none overflow-visible">
          <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500">
             
             {/* Dynamic Image with Fallback */}
             <div className="relative h-64 w-full">
                <img 
                  src={activeBroadcast?.image_url || 'https://images.unsplash.com/photo-1514525253361-bee8a187c92a'} 
                  className="w-full h-full object-cover" 
                  alt="Greeting"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent"></div>
             </div>

             <div className="p-10 text-center -mt-12 relative z-10 space-y-6">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-center mx-auto -rotate-12 transform hover:rotate-0 transition-all duration-500">
                   {activeBroadcast?.animation_type === 'DIYA' ? <Flame className="w-10 h-10 text-white" /> : 
                    activeBroadcast?.animation_type === 'HOLI' ? <Palette className="w-10 h-10 text-white" /> :
                    <Globe className="w-10 h-10 text-white" />}
                </div>

                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeBroadcast?.title}</h2>
                   <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{activeBroadcast?.message}</p>
                </div>

                <Button onClick={handleDismissPopup} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl text-xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                   Explore More <X className="ml-2 w-5 h-5 opacity-50" />
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

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
