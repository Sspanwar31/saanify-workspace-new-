'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useClientStore } from '@/lib/client/store';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2, X, Settings, Sparkles, Flame, Palette, Zap, Moon, Snowflake, Flower2, Sparkles as SparklesIcon, Megaphone } from 'lucide-react';
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

  // 1. Decoration Icons/Animations Logic
  const RenderFestivalDecor = () => {
    if (!showPopup || !activeBroadcast) return null;

    // DIYA ANIMATION (Diwali)
    if (activeBroadcast.animation_type === 'DIYA') {
      return (
        <div className="fixed inset-0 pointer-events-none z-[10000]">
          <div className="absolute bottom-10 left-10 text-6xl diya-glow">🪔</div>
          <div className="absolute bottom-10 right-10 text-6xl diya-glow">🪔</div>
          <div className="absolute top-20 left-1/4 text-4xl diya-glow opacity-50">🪔</div>
        </div>
      );
    }

    // HOLI SPLASH
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
      <RenderFestivalDecor />

      {/* HYBRID BANNER: Popup band hone ke baad dikhega */}
      {activeBroadcast && !showPopup && (
        <div className={`sticky top-0 z-[1001] py-2 px-6 text-center text-xs font-bold transition-all animate-in slide-in-from-top duration-700 
          ${activeBroadcast.theme_color === 'GOLD' ? 'bg-gradient-to-r from-yellow-600 to-amber-800 text-white' : 'bg-blue-600 text-white'}`}>
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              {activeBroadcast.message}
            </span>
            {activeBroadcast.cta_link && (
              <a href={activeBroadcast.cta_link} target="_blank" className="bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                {activeBroadcast.cta_text || 'View More'}
              </a>
            )}
            <button onClick={() => setActiveBroadcast(null)}><X className="w-4 h-4 opacity-50" /></button>
          </div>
        </div>
      )}

      {/* MODERN HERO MODAL (POPUP) - UPDATED LOGIC */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none overflow-visible">
          
          {activeBroadcast?.type === 'FESTIVAL' ? (
            // --- FESTIVAL UI: Hero Image + High Animations ---
            <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_35px_100px_rgba(0,0,0,0.4)] border border-white/20 animate-in zoom-in-95 duration-500">
              {/* Hero Image */}
              <div className="h-64 w-full relative">
                {/* Fallback to default placeholder if no specific image */}
                <img 
                  src={activeBroadcast?.image_url || festivalImages[activeBroadcast?.festival_key] || '/placeholder-festival.jpg'} 
                  className="w-full h-full object-cover" 
                  alt="Festival" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900"></div>
              </div>

              <div className="p-10 text-center -mt-16 relative z-10 space-y-6">
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                   {activeBroadcast?.title}
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                   {activeBroadcast?.message}
                </p>
                
                <Button 
                  onClick={handleDismissPopup} 
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl text-xl font-bold shadow-lg transition-all transform hover:scale-105"
                >
                  Celebrate Now 🎊
                </Button>
              </div>
            </div>
          ) : (
            // --- PROFESSIONAL UPDATE/ANNOUNCEMENT UI: Glassmorphism + Confetti ---
            <div className="p-10 text-center space-y-6 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/20 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Confetti/Sparkles Animation */}
              <div className="absolute top-2 left-4 text-yellow-500 animate-bounce text-xl">✨</div>
              <div className="absolute top-6 right-6 text-pink-500 animate-pulse text-xl">🎉</div>
              <div className="absolute bottom-10 left-10 text-blue-400 animate-spin-slow text-lg opacity-50">💫</div>

              {/* Dynamic Icon */}
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl relative z-10
                ${activeBroadcast?.priority > 2 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}>
                 <Megaphone className="w-10 h-10 text-white"/>
              </div>

              <div className="space-y-2 relative z-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase">
                  {activeBroadcast?.title}
                </h2>
                {/* Bilingual Message Support (safely handling split) */}
                {activeBroadcast?.message.includes('|') ? (
                   <>
                     <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {activeBroadcast.message.split('|')[1]} {/* English part */}
                     </p>
                     <p className="text-md text-slate-500 font-medium">
                        {activeBroadcast.message.split('|')[0]} {/* Hindi part */}
                     </p>
                   </>
                ) : (
                   <p className="text-md text-slate-500 font-medium">
                     {activeBroadcast.message}
                   </p>
                )}
              </div>

              {/* Button Style changes based on Priority */}
              <Button onClick={handleDismissPopup} className={`w-full h-14 rounded-2xl text-lg font-black relative z-10
                ${activeBroadcast?.priority > 2 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {activeBroadcast?.cta_text || 'Got it 👍'}
              </Button>
            </div>
          )}
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
