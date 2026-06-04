'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useClientStore } from '@/lib/client/store';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2, X, Settings, Sparkles, Flame, Palette, Zap, Moon, Snowflake, Flower2, Sparkles as SparklesIcon, Megaphone, Globe } from 'lucide-react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ✅ Helpers
const getPriorityColor = (priority: string) => {
  switch(priority){
    case 1: // LOW
    case 'LOW':
      return 'from-green-600 to-green-800';
    case 2: // MEDIUM
    case 'MEDIUM':
      return 'from-blue-600 to-indigo-800';
    case 3: // HIGH
    case 'HIGH':
      return 'from-orange-600 to-red-700';
    case 4: // CRITICAL
    case 'CRITICAL':
      return 'from-red-700 to-red-900';
    default:
      return 'from-blue-600 to-indigo-800';
  }
};

const getThemeColor = (theme: string) => {
   switch(theme){
      case 'RED':
         return 'bg-red-600';
      case 'GREEN':
         return 'bg-green-600';
      case 'BLUE':
         return 'bg-blue-600';
      case 'PURPLE':
         return 'bg-purple-600';
      case 'ORANGE':
         return 'bg-orange-600';
      case 'GOLD':
         return 'bg-yellow-500 text-yellow-950'; 
      default:
         return 'bg-blue-600';
   }
};

const festivalImages = {
   DIWALI:'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&q=80', 
   HOLI:'https://images.unsplash.com/photo-1610197919218-6c2182360491?w=800&q=80', 
   CHRISTMAS:'https://images.unsplash.com/photo-1512096701486-c0c4473e998c?w=800&q=80', 
   EID_AL_FITR:'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=800&q=80', 
   NEW_YEAR:'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80' 
};

// ✅ Fullscreen Broadcast Component
const FullscreenBroadcast = ({broadcast}: any) => (
  <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-700">
      <div className="text-center text-white max-w-3xl px-6 space-y-6">
          {broadcast.image_url && (
            <div className="w-full h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
               <img src={broadcast.image_url} className="w-full h-full object-cover" alt="Event" />
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 drop-shadow-sm">
             {broadcast.title}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
             {broadcast.message}
          </p>
          {broadcast.cta_text && broadcast.cta_link && (
            <Button 
              onClick={() => window.open(broadcast.cta_link, '_blank')}
              className="bg-white text-black hover:bg-slate-200 text-lg px-8 py-6 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105"
            >
              {broadcast.cta_text}
            </Button>
          )}
      </div>
  </div>
);

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
  
  // Broadcast States
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  // ━━━ 4. Add Festival Theme Helper ━━━
  const getFestivalTheme = () => {
    if (!activeBroadcast) return null;

    switch (activeBroadcast.festival_key) {
      case 'HOLI':
        return {
          bg: 'from-pink-500 via-yellow-400 to-blue-500',
          icon: '🎨',
          particles: ['🎨', '🎉', '✨', '🌈']
        };

      case 'DIWALI':
        return {
          bg: 'from-orange-500 via-yellow-400 to-amber-600',
          icon: '🪔',
          particles: ['🪔', '✨', '💫', '🌟']
        };

      case 'CHRISTMAS':
        return {
          bg: 'from-green-600 via-red-500 to-green-700',
          icon: '🎄',
          particles: ['🎄', '❄️', '🎁', '✨']
        };

      default:
        return {
          bg: 'from-blue-600 to-indigo-700',
          icon: '📢',
          particles: ['✨', '🎉']
        };
    }
  };

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

  // ━━━ 2. REALTIME BROADCAST LISTENER (UPDATED LOGIC WITH DEBUG) ━━━
  const fetchBroadcasts = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('is_active', true)
      .or('target_audience.eq.BOTH,target_audience.eq.CLIENT')
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('priority', { ascending: false }) 
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      console.log("🔥 ACTIVE BROADCAST FOUND", data);

      setActiveBroadcast(data);

      const sessionSeen = sessionStorage.getItem(
        `seen_broadcast_${data.id}`
      );

      console.log("SESSION SEEN =", sessionSeen);

      if (!sessionSeen && !hasSeenPopup) {
        console.log("🔥 OPENING POPUP");
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    } else {
      setActiveBroadcast(null);
      setShowPopup(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
    const channel = supabase.channel('broadcast-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
        console.log("📢 Broadcast Update Detected");
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

  const isMaintenanceActive = sysSettings?.is_maintenance_mode;
  const shouldShowLockout = !isChecking && isMaintenanceActive && !isImpersonating;

  // ━━━ 1. Render Animations (Better Diya Placement) ━━━
  const RenderAnimations = () => {
    if (!showPopup || !activeBroadcast) return null;

    if (activeBroadcast.animation_type === 'DIYA') {
      return (
        <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
          {/* Top Right Corner */}
          <div className="absolute top-4 right-4 text-6xl diya-glow">🪔</div>
          
          {/* Top Left (Sidebar se door - w-64 is approx 256px) */}
          <div className="absolute top-4 left-[280px] text-6xl diya-glow">🪔</div>
          
          {/* Bottom Corner (Logout se door) */}
          <div className="absolute bottom-10 right-10 text-5xl diya-glow opacity-60">🪔</div>
        </div>
      );
    }
    // HOLI SPLASH (Preserving existing Holi logic)
    if (activeBroadcast.animation_type === 'HOLI') {
      return (
        <div className="fixed inset-0 pointer-events-none z-[10000]">
          <div className="holi-splash bg-pink-500 top-1/4 left-1/4 w-64 h-64 opacity-40 blur-3xl" />
          <div className="holi-splash bg-yellow-400 bottom-1/4 right-1/4 w-80 h-80 opacity-40 blur-3xl" />
        </div>
      );
    }
    return null;
  };

  return (
    <>
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

      {/* ━━ NEW BROADCAST UI SECTION ━━ */}
      <RenderAnimations />

      {/* 🚀 MODERN BRANDED BANNER (Dismissal ke baad) */}
      {activeBroadcast && !showPopup && (
        <div className="sticky top-0 z-[1001] py-3 px-6 bg-gradient-to-r from-blue-800 via-indigo-900 to-blue-800 text-white shadow-2xl border-b border-white/10 animate-in slide-in-from-top duration-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 p-1.5 rounded-lg animate-pulse">
                <Sparkles className="w-4 h-4 text-blue-900" />
              </div>
              <p className="text-xs md:text-sm font-bold tracking-wide">
                <span className="text-yellow-400 uppercase mr-2 tracking-tighter">Saanify Pariwar:</span>
                {/* ✅ Safety Check Applied */}
                {activeBroadcast?.message?.includes('|') ? activeBroadcast.message.split('|')[0] : activeBroadcast?.message}
              </p>
            </div>
            <button onClick={() => setActiveBroadcast(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        </div>
      )}

      {/* 🚀 MODERN HERO POPUP (Center Modal) */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none overflow-visible">
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.5)] border border-white/20 transition-all">
            
            {/* HERO IMAGE WITH OVERLAY */}
            <div className="h-72 w-full relative group">
              {/* ✅ Safety Check for Image */}
              <img 
                src={activeBroadcast?.image_url || festivalImages[activeBroadcast?.festival_key] || '/placeholder-festival.jpg'} 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                alt="Festival"
              />
              {/* Dark gradient for text pop */}
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent"></div>
            </div>

            <div className="p-12 text-center -mt-20 relative z-10 space-y-6">
              <div className="bg-blue-600 w-24 h-24 mx-auto rounded-[2rem] shadow-2xl flex items-center justify-center -rotate-12 transform hover:rotate-0 transition-all duration-700">
                <Globe className="w-12 h-12 text-white" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
                  {/* ✅ Safety Check for Title */}
                  {activeBroadcast?.title || 'Notification'}
                </h2>
                {/* Bilingual Message Support */}
                <div className="space-y-1">
                  <p className="text-md text-slate-500 font-bold leading-relaxed px-4">
                    {activeBroadcast?.message?.split('|')?.[0]}
                  </p>
                  <p className="text-xs text-blue-500 font-medium opacity-70">
                    {activeBroadcast?.message?.split('|')?.[1]}
                  </p>
                </div>
              </div>
              
              <Button onClick={handleDismissPopup} className="w-full h-16 bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 text-white rounded-3xl text-xl font-black shadow-[0_15px_40px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                CELEBRATE NOW 🚀
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Layout Structure... */}
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        {/* ━━ DESKTOP SIDEBAR ━━ */}
        <div className="w-64 shrink-0 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ClientSidebar profile={userProfile} />
        </div>

        {/* ━━ MOBILE SIDEBAR OVERLAY ━━ */}
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
