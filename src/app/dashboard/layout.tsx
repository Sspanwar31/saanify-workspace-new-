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

// =========================================================
// MASTER CONFIG: Supporting All 30+ Festivals & 7 Types
// =========================================================
const MASTER_CONFIG: any = {
  // --- GOLDEN STYLE ---
  DIWALI: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '🪔' },
  DUSSEHRA: { style: 'GOLDEN', defaultAnim: 'SPARKLES', icon: '🏹' },
  MAHASHIVRATRI: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '🕉️' },
  RAM_NAVAMI: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '🚩' },
  GURU_PURNIMA: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '🙏' },
  CHHATH_PUJA: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '☀️' },
  KARWA_CHAUTH: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '🌙' },
  HANUMAN_JAYANTI: { style: 'GOLDEN', defaultAnim: 'DIYA', icon: '🔱' },
  MAKAR_SANKRANTI: { style: 'GOLDEN', defaultAnim: 'SPARKLES', icon: '🪁' },
  
  // --- VIBRANT STYLE ---
  HOLI: { style: 'VIBRANT', defaultAnim: 'HOLI', icon: '🎨' },
  NAVRATRI: { style: 'VIBRANT', defaultAnim: 'FLOWERS', icon: '💃' },
  GANESH_CHATURTHI: { style: 'VIBRANT', defaultAnim: 'FLOWERS', icon: '🐘' },
  JANMASHTAMI: { style: 'VIBRANT', defaultAnim: 'FLOWERS', icon: '🏺' },
  RAKSHA_BANDHAN: { style: 'VIBRANT', defaultAnim: 'CONFETTI', icon: '🎁' },
  LOHRI: { style: 'VIBRANT', defaultAnim: 'SPARKLES', icon: '🔥' },
  ONAM: { style: 'VIBRANT', defaultAnim: 'FLOWERS', icon: '🌸' },
  PONGAL: { style: 'VIBRANT', defaultAnim: 'FLOWERS', icon: '🌾' },
  BAISAKHI: { style: 'VIBRANT', defaultAnim: 'FLOWERS', icon: '🥁' },

  // --- WINTER / PEACEFUL ---
  CHRISTMAS: { style: 'WINTER', defaultAnim: 'SNOW', icon: '🎄' },
  NEW_YEAR: { style: 'WINTER', defaultAnim: 'FIREWORKS', icon: '🎆' },
  EID_AL_FITR: { style: 'PEACEFUL', defaultAnim: 'MOON', icon: '🌙' },
  EID_AL_ADHA: { style: 'PEACEFUL', defaultAnim: 'MOON', icon: '🕌' },

  // --- NATIONAL STYLE ---
  REPUBLIC_DAY: { style: 'NATIONAL', defaultAnim: 'CONFETTI', icon: '🇮🇳' },
  INDEPENDENCE_DAY: { style: 'NATIONAL', defaultAnim: 'CONFETTI', icon: '🇮🇳' },

  // --- BROADCAST TYPES (Corporate) ---
  ANNOUNCEMENT: { style: 'CORPORATE', defaultAnim: 'SPARKLES', icon: '📢' },
  UPDATE: { style: 'CORPORATE', defaultAnim: 'SPARKLES', icon: '🚀' },
  OFFER: { style: 'CORPORATE', defaultAnim: 'CONFETTI', icon: '💰' },
  MAINTENANCE: { style: 'CORPORATE', defaultAnim: 'NONE', icon: '⚙️' },
  EMERGENCY: { style: 'ALERT', defaultAnim: 'NONE', icon: '⚠️' },
  EVENT: { style: 'CORPORATE', defaultAnim: 'CONFETTI', icon: '🗓️' }
};

// --- Helper: Get Style for Type/Key ---
const getConfig = (b: any) => {
  const key = (b?.festival_key || b?.type || 'UPDATE').toUpperCase();
  return MASTER_CONFIG[key] || MASTER_CONFIG.UPDATE;
};

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

// --- GreetingRenderer (Updated with 5-part Logic) ---
const GreetingRenderer = ({ activeBroadcast, handleDismissPopup }: any) => {
  if (!activeBroadcast) return null;
  
  const config = MASTER_CONFIG[activeBroadcast.festival_key || activeBroadcast.type] || MASTER_CONFIG.UPDATE;
  const currentAnim = activeBroadcast.animation_type || config.defaultAnim;
  const msgParts = activeBroadcast.message?.split('|') || [activeBroadcast.message, ""];

  // 🚀 Logic for Dynamic Backgrounds & Particle Layers
  let layoutTheme = {
    container: "bg-[#0f172a] text-white", // Default
    title: "holi-title-animated",
    particles: null as any
  };

  if (config.style === 'GOLDEN') {
    layoutTheme.container = "bg-[radial-gradient(circle_at_top,#1e2d7a_0%,#090d1f_50%,#03040b_100%)] border-amber-400/30";
    layoutTheme.title = "festival-title-gold";
    layoutTheme.particles = [...Array(6)].map((_, i) => (
      <div key={i} className="gold-particle w-2 h-2" style={{ left: (15*i+5) + "%", bottom: "-20px", animationDuration: (6+i) + "s" }}></div>
    ));
  } 
  else if (config.style === 'VIBRANT') {
    layoutTheme.container = "bg-white text-slate-900";
    layoutTheme.title = "holi-title-animated";
    layoutTheme.particles = (
      <>
        <div className="color-splash bg-pink-500 w-40 h-40 top-10 left-10" style={{"--tx":"-40px", "--ty":"-40px"} as any}></div>
        <div className="color-splash bg-green-400 w-48 h-48 bottom-10 right-10" style={{"--tx":"40px", "--ty":"40px", "animationDelay":"1s"} as any}></div>
        <div className="color-splash bg-blue-400 w-32 h-32 top-1/2 right-1/4" style={{"--tx":"30px", "--ty":"-20px", "animationDelay":".5s"} as any}></div>
      </>
    );
  }
  else if (config.style === 'WINTER') {
    layoutTheme.container = "bg-[#b71c1c]";
    layoutTheme.title = "text-white drop-shadow-2xl";
    layoutTheme.particles = [...Array(15)].map((_, i) => (
      <div key={i} className="snow-particle w-1.5 h-1.5" style={{ left: (Math.random()*100) + "%", top: "-10px", animationDelay: (Math.random()*5) + "s" }}></div>
    ));
  }
  else if (config.style === 'NATIONAL') {
    layoutTheme.container = "bg-gradient-to-b from-[#ff9933] via-white to-[#138808] text-slate-900";
    layoutTheme.title = "text-slate-900 font-black";
    layoutTheme.particles = null;
  }

  return (
    <div className={`relative w-[340px] sm:w-[420px] min-h-[580px] rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)] flex flex-col items-center p-8 border ${layoutTheme.container} mx-auto`}>
      
      {/* 1. DYNAMIC PARTICLE LAYER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {layoutTheme.particles}
      </div>

      <div className={`relative z-10 uppercase tracking-[10px] font-black text-[10px] mb-8 ${config.style === 'GOLDEN' ? 'text-amber-400/50' : 'text-slate-400'}`}>SAANIFY</div>

      {/* 2. DYNAMIC HERO SECTION (Diya or Icon) */}
      <div className="relative z-10 mt-4">
         {currentAnim === 'DIYA' ? (
           <div className="relative scale-125 flex flex-col items-center">
              <div className="diya-flame w-14 h-18 bg-gradient-to-t from-orange-500 via-yellow-400 to-white rounded-full blur-[1px]" style={{boxShadow: '0 0 40px orange'}}></div>
              <div className="mt-[-10px] w-24 h-12 rounded-b-full bg-gradient-to-b from-amber-700 to-amber-950"></div>
           </div>
         ) : (
           <div className="bg-white/20 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl border border-white/30 rotate-6 transform hover:rotate-0 transition-all duration-700">
              <span className="text-7xl drop-shadow-2xl">{config.icon}</span>
           </div>
         )}
      </div>

      {/* 3. CONTENT LAYER */}
      <div className="relative z-10 text-center mt-12 w-full px-4">
        <h1 className={`${layoutTheme.title} text-5xl font-black leading-tight uppercase italic`}>
          {activeBroadcast.title}
        </h1>
        <p className={`mt-6 text-sm leading-relaxed font-bold px-2 ${config.style === 'GOLDEN' || config.style === 'WINTER' ? 'text-slate-200' : 'text-slate-700'}`}>
          {msgParts[0]}
        </p>
      </div>

      {/* 4. DYNAMIC BUTTON */}
      <Button onClick={handleDismissPopup} className={`relative z-10 mt-auto w-full h-16 rounded-3xl font-black text-xl text-white shadow-2xl transition-all hover:scale-105
        ${config.style === 'GOLDEN' ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500' : 
          config.style === 'WINTER' ? 'bg-white text-red-600' : 'bg-blue-600'}`}>
        {activeBroadcast.cta_text || 'CONTINUE 🚀'}
      </Button>

      <div className="relative z-10 mt-4 text-[9px] uppercase tracking-[4px] font-bold opacity-40">
         Premium Saanify Greeting
      </div>
    </div>
  );
};

// --- RenderAnimations (Screen wide effects) ---
const RenderAnimations = ({ showPopup, activeBroadcast }: any) => {
  if (!showPopup || !activeBroadcast) return null;

  if (activeBroadcast.animation_type === 'DIYA' || getConfig(activeBroadcast).defaultAnim === 'DIYA') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
        <div className="absolute top-4 right-10 text-6xl diya-glow">🪔</div>
        <div className="absolute top-4 left-[300px] text-6xl diya-glow hidden md:block">🪔</div>
        {[...Array(5)].map((_, i) => (
            <div key={i} className="gold-particle" style={{ left: `${20*i}%`, bottom: '0', animationDuration: `${7+i}s` }}></div>
        ))}
      </div>
    );
  }
  return null;
};

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
    const channel = supabase.channel('broadcast-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => fetchBroadcasts())
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

      {/* ANIMATIONS & POPUP */}
      <RenderAnimations showPopup={showPopup} activeBroadcast={activeBroadcast} />

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

      {/* HERO POPUP MODAL */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none overflow-visible">
           <GreetingRenderer activeBroadcast={activeBroadcast} handleDismissPopup={handleDismissPopup} />
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
