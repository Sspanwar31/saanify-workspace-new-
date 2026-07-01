'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useClientStore } from '@/lib/client/store';
import ClientSidebar from '@/components/layout/ClientSidebar';
import {
  ShieldCheck, ArrowLeft, Loader2, X, Settings, Sparkles,
  Wrench, AlertOctagon, Megaphone, Gift, Calendar, BellRing
} from 'lucide-react';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import BroadcastRenderer from '@/components/festival/v2/BroadcastRenderer';
import AnimationFactory from '@/components/festival/v2/AnimationFactory';
import FestivalIntroController from '@/components/festival/intro/FestivalIntroController';

// =========================================================
// SUB-COMPONENTS
// =========================================================

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

// =========================================================
// PREMIUM GOLDEN PARTICLES — Floating Diwali Embers
// =========================================================
const PremiumGoldenParticles = memo(() => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const count = 50;
    const blurWeights = [0, 0, 0, 0, 1, 1, 2];

    const generated = Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 6 + 2;
      const isLargeSpark = size > 6;
      const isMediumEmber = size > 3.5 && !isLargeSpark;

      return {
        id: i,
        size,
        duration: Math.random() * 9 + 6,
        delay: -(Math.random() * 15),
        left: Math.random() * 100,
        blur: blurWeights[Math.floor(Math.random() * blurWeights.length)],
        drift: Math.random() * 55 + 15,
        glowMultiplier: isLargeSpark ? 3.5 : isMediumEmber ? 2.2 : 1.4,
        brightness: isLargeSpark ? 1.3 : isMediumEmber ? 1.05 : 0.85,
        highlightX: 30 + Math.random() * 15,
        highlightY: 30 + Math.random() * 15,
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes ember-rise {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 0.85;
          }
          18% {
            transform: translateY(-18vh) translateX(calc(var(--d) * -0.55px)) rotate(65deg);
            opacity: 1;
          }
          35% {
            transform: translateY(-35vh) translateX(calc(var(--d) * 0.4px)) rotate(130deg);
            opacity: 0.7;
          }
          52% {
            transform: translateY(-52vh) translateX(calc(var(--d) * -0.28px)) rotate(195deg);
            opacity: 1;
          }
          70% {
            transform: translateY(-70vh) translateX(calc(var(--d) * 0.18px)) rotate(260deg);
            opacity: 0.55;
          }
          88% {
            opacity: 0.25;
          }
          100% {
            transform: translateY(-112vh) translateX(calc(var(--d) * -0.08px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {particles.map(p => {
        const glowR = p.size * p.glowMultiplier;
        const glowR2 = glowR * 1.8;

        return (
          <div
            key={p.id}
            className="absolute rounded-full will-change-transform"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: '-4%',
              background: `radial-gradient(circle at ${p.highlightX}% ${p.highlightY}%, #fef9c3 0%, #fbbf24 28%, #d97706 65%, #78350f 100%)`,
              boxShadow: `
                0 0 ${glowR}px ${glowR * 0.35}px rgba(251, 191, 36, 0.55),
                0 0 ${glowR2}px ${glowR * 0.7}px rgba(217, 119, 6, 0.18)
              `,
              filter: `blur(${p.blur}px) brightness(${p.brightness})`,
              animation: `ember-rise ${p.duration}s ${p.delay}s linear infinite`,
              ['--d' as string]: p.drift,
            }}
          />
        );
      })}
    </div>
  );
});

PremiumGoldenParticles.displayName = 'PremiumGoldenParticles';


// =========================================================
// MAIN DASHBOARD LAYOUT
// =========================================================

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [sysSettings, setSysSettings] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Broadcast States
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  // ✅ STATE SPLIT: Intro aur Ambient — completely independent lifecycles
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [isAmbientActive, setIsAmbientActive] = useState(false);

  // ✅ INTRO LOCK — Prevents polling from re-triggering intro while
  //    sequence is playing or popup is showing.
  //    Ref = no re-renders, no dependency array pollution, synchronous check.
  const introLockRef = useRef(false);

  // ━━━ 1. REALTIME SYSTEM SETTINGS LISTENER ━━━
  useEffect(() => {
    const fetchInitialSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSysSettings(data);
      } catch (e) { /* silent */ }
    };
    fetchInitialSettings();

    const settingsChannel = supabase
      .channel('public:system_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' }, (payload) => {
        setSysSettings(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(settingsChannel); };
  }, []);

  // ━━━ 2. HANDOVER: Intro finishes → Ambient starts → Popup opens ━━━
  const handleIntroHandover = useCallback(() => {
    setTimeout(() => {
      setIsIntroActive(false);   // ✅ Intro layer UNMOUNTS
      setIsAmbientActive(true);  // ✅ Ambient layer MOUNTS
      setShowPopup(true);        // ✅ Greeting card khul-ta hai
      // NOTE: Lock stays TRUE — popup is still showing
    }, 300);
  }, []);

  // ━━━ 3. REALTIME BROADCAST LISTENER ━━━
  const fetchBroadcasts = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .in('broadcast_mode', ['MANUAL', 'SCHEDULED'])
      .or('target_audience.eq.BOTH,target_audience.eq.CLIENT')
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .eq('manual_stop', false)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      // Admin ne update kiya → replay trigger
      const wasUpdated = activeBroadcast && activeBroadcast.updated_at !== data.updated_at;

      if (wasUpdated) {
        sessionStorage.removeItem(`seen_broadcast_${data.id}`);
        setHasSeenPopup(false);
        introLockRef.current = false; // ✅ Unlock — allow replay
      }

      // Always keep broadcast data fresh (message changes etc.)
      setActiveBroadcast(data);

      // ✅ LOCK GUARD: If intro/popup is already playing, DON'T re-trigger
      //    wasUpdated already unlocked above, so forced replays still work
      if (introLockRef.current) return;

      const sessionSeen = sessionStorage.getItem(`seen_broadcast_${data.id}`);

      // ✅ show_frequency logic:
      // ONCE:   sessionStorage check + hasSeenPopup check
      // ALWAYS: sirf hasSeenPopup check (sessionStorage ignore)
      const frequency: string = data.show_frequency || 'ONCE';
      const shouldShow = frequency === 'ALWAYS'
        ? !hasSeenPopup
        : (!sessionSeen && !hasSeenPopup);

      if (shouldShow || wasUpdated) {
        introLockRef.current = true; // ✅ LOCK — polling ab skip karega
        if (data.hero_enabled) {
          setIsIntroActive(true);  // Full intro sequence start
        } else {
          setShowPopup(true);      // No hero — sirf popup
        }
      } else if (data.hero_enabled) {
        // ✅ Already seen — skip intro & popup, but start ambient particles
        setIsAmbientActive(true);
      }
    } else {
      if (activeBroadcast) {
        // ✅ Broadcast expired/stopped — STOP EVERYTHING
        setActiveBroadcast(null);
        setShowPopup(false);
        setIsIntroActive(false);
        setIsAmbientActive(false);
        introLockRef.current = false; // ✅ UNLOCK
      }
    }
  }, [hasSeenPopup, activeBroadcast]);

  const checkBroadcastExpiry = useCallback(() => {
    if (!activeBroadcast?.ends_at) return;
    if (Date.now() >= new Date(activeBroadcast.ends_at).getTime()) {
      setActiveBroadcast(null);
      setShowPopup(false);
      setIsIntroActive(false);
      setIsAmbientActive(false);
      introLockRef.current = false; // ✅ UNLOCK
    }
  }, [activeBroadcast]);

  useEffect(() => {
    fetchBroadcasts();
    const channel = supabase.channel('broadcast-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => fetchBroadcasts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBroadcasts]);

  useEffect(() => {
    const interval = setInterval(fetchBroadcasts, 5000);
    return () => clearInterval(interval);
  }, [fetchBroadcasts]);

  useEffect(() => {
    if (!activeBroadcast?.ends_at) return;
    const interval = setInterval(checkBroadcastExpiry, 5000);
    return () => clearInterval(interval);
  }, [activeBroadcast, checkBroadcastExpiry]);

  // ✅ Popup dismiss — ONLY close popup. DO NOT stop ambient particles.
  //    UNLOCK here so next refresh (ALWAYS mode) can trigger again.
  const handleDismissPopup = () => {
    setShowPopup(false);
    setHasSeenPopup(true);
    introLockRef.current = false; // ✅ UNLOCK
    if (activeBroadcast) {
      sessionStorage.setItem(`seen_broadcast_${activeBroadcast.id}`, 'true');
    }
  };

  // ✅ Banner X button — user ne manually dismiss kiya, stop everything
  const handleDismissBanner = useCallback(() => {
    setActiveBroadcast(null);
    setShowPopup(false);
    setIsIntroActive(false);
    setIsAmbientActive(false);
    introLockRef.current = false; // ✅ UNLOCK
  }, []);

  // ━━━ 4. AUTH + PROFILE SYNC ━━━
  useEffect(() => {
    const performAuthSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/login'); return; }

        const { data: profile } = await supabase.from('current_active_profile').select('*').maybeSingle();
        if (!profile || profile.status !== 'ACTIVE') { router.replace('/login'); return; }

        localStorage.setItem('current_user', JSON.stringify(profile));
        localStorage.setItem('active_client_id', profile.id);
        useClientStore.setState({ currentUser: profile, isLoggedIn: true });
        setUserProfile(profile);

        if (profile.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        const isAdminViewing = session.user.id !== profile.id;
        const localFlag = localStorage.getItem('is_admin_impersonating') === 'true';
        setIsImpersonating(isAdminViewing || localFlag);
        setIsChecking(false);
      } catch (err) {
        setIsChecking(false);
      }
    };
    performAuthSync();
  }, [router]);

  // ━━━ 5. REALTIME PERMISSION SYNC ━━━
  useEffect(() => {
    if (!userProfile) return;
    const ownerId = userProfile.role === 'treasurer' ? userProfile.client_id : userProfile.id;

    const channel: RealtimeChannel = supabase
      .channel(`client-perm-${ownerId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${ownerId}` }, (payload) => {
        const updated = payload.new as any;
        const currentStored = localStorage.getItem('current_user');
        if (currentStored) {
          const parsed = JSON.parse(currentStored);
          parsed.role_permissions = updated.role_permissions;
          localStorage.setItem('current_user', JSON.stringify(parsed));
        }
        setUserProfile((prev: any) => ({ ...prev, role_permissions: updated.role_permissions }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, userProfile?.client_id]);

  // ━━━ 6. PERMISSION GUARD ━━━
  useEffect(() => {
    if (!userProfile || userProfile.role !== 'treasurer') return;
    const perms: string[] = Array.isArray(userProfile?.role_permissions?.treasurer) ? userProfile.role_permissions.treasurer : [];
    const path = pathname.toLowerCase();
    const permissionMap: Record<string, string> = {
      'members': 'View Members', 'passbook': 'View Passbook', 'loans': 'View Loans',
      'expenses': 'Manage Expenses', 'reports': 'View Reports', 'maturity': 'View Dashboard',
      'admin-fund': 'Manage Admin Fund', 'user-management': 'User Management Access', 'settings': 'View Settings'
    };

    if (path !== '/dashboard') {
      const requiredPerm = Object.entries(permissionMap).find(([key]) => path.includes(key))?.[1];
      if (requiredPerm && !perms.includes(requiredPerm)) {
        toast.error("Access Restricted: Permission required");
        router.push('/dashboard');
      }
    }
  }, [pathname, userProfile, router]);

  // ━━━ 7. BACK TO ADMIN ━━━
  const handleBackToAdmin = useCallback(async () => {
    const toastId = toast.loading("Exiting view mode...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('admin_active_viewing').delete().eq('admin_id', user.id);
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

  if (isChecking) return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
    </div>
  );

  const isMaintenanceActive = sysSettings?.is_maintenance_mode;
  const shouldShowLockout = !isChecking && isMaintenanceActive && !isImpersonating;

  const themeColor = activeBroadcast?.theme_color || '#3b82f6';
  const isLightColor = ['#FBBF24', '#F59E0B', '#EAB308', 'GOLD', '#fbbf24', '#f59e0b', '#eab308'].includes(themeColor.toUpperCase());
  const textColorClass = isLightColor ? 'text-slate-950' : 'text-white';
  const badgeBgClass = isLightColor ? 'bg-black/10 border-black/10 text-slate-950' : 'bg-white/10 border-white/15 text-white';

  const renderBroadcastIcon = () => {
    const key = activeBroadcast?.festival_key?.toUpperCase() || '';
    switch (key) {
      case 'MAINTENANCE': return <Wrench className="w-5 h-5 animate-pulse shrink-0" />;
      case 'EMERGENCY': return <AlertOctagon className="w-5 h-5 animate-bounce shrink-0 text-red-100" />;
      case 'ANNOUNCEMENT': return <Megaphone className="w-5 h-5 shrink-0" />;
      case 'SPECIAL_OFFER': return <Gift className="w-5 h-5 animate-bounce shrink-0" />;
      case 'EVENT': return <Calendar className="w-5 h-5 shrink-0" />;
      default: return <Sparkles className="w-5 h-5 shrink-0 animate-[spin_4s_linear_infinite]" style={{ animationDuration: '4s' }} />;
    }
  };

  return (
    <>
      {shouldShowLockout && <MaintenanceScreen settings={sysSettings} />}

      {sysSettings?.is_maintenance_scheduled && !isMaintenanceActive && (
        <div className="bg-orange-600 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top duration-500 z-[1000] sticky top-0">
          <span>⚠️ SCHEDULED MAINTENANCE: {sysSettings.maintenance_title} ({new Date(sysSettings.maintenance_start).toLocaleString()} - {new Date(sysSettings.maintenance_end).toLocaleString()})</span>
        </div>
      )}

      {isImpersonating && (
        <div className="w-full bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 text-white px-4 md:px-6 py-2.5 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[1000]">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-purple-200 shrink-0" />
            <span className="font-semibold tracking-wide truncate">ADMIN VIEW: {userProfile?.society_name?.toUpperCase()}</span>
          </div>
          <button onClick={handleBackToAdmin} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ml-3">
            <ArrowLeft className="w-3 h-3" /> Exit View
          </button>
        </div>
      )}

      {/* Top Broadcast Banner — hidden during intro & popup */}
      {activeBroadcast && !showPopup && !isIntroActive && (
        <div
          className={`sticky top-0 z-[1001] w-full py-3.5 px-6 shadow-[0_10px_35px_rgba(0,0,0,0.2)] transition-all duration-500 border-b ${textColorClass}`}
          style={{
            background: `linear-gradient(90deg, ${themeColor}ee, ${themeColor}ff)`,
            backdropFilter: 'blur(12px)',
            borderColor: isLightColor ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm tracking-wide">
            <div className="flex items-center gap-4 flex-1 justify-center min-w-0">
              {renderBroadcastIcon()}
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${badgeBgClass}`}>Saanify Pariwar</span>
              <div className="flex items-center gap-2.5 min-w-0 truncate text-xs md:text-sm">
                <span className="font-black uppercase tracking-tight shrink-0 drop-shadow-sm">{activeBroadcast?.resolved_title || activeBroadcast?.title}</span>
                <span className={`opacity-30 shrink-0 select-none ${isLightColor ? 'text-slate-950' : 'text-white'}`}>|</span>
                <p className={`truncate font-semibold tracking-wide drop-shadow-sm ${isLightColor ? 'text-slate-900' : 'text-slate-100'}`}>{activeBroadcast?.resolved_message || activeBroadcast?.message?.split('|')?.[0]}</p>
              </div>
            </div>
            <button onClick={handleDismissBanner} className="p-1.5 hover:bg-black/10 rounded-full transition-colors duration-200 shrink-0 ml-3">
              <X className="w-5 h-5 opacity-85" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 1  ·  z-[9997]  ·  INTRO ANIMATIONS
          ═══════════════════════════════════════════════════════════════ */}
      {isIntroActive && activeBroadcast?.hero_enabled && (
        <div className="fixed inset-0 z-[9997] pointer-events-none">
          <FestivalIntroController isActive={isIntroActive} onHandover={handleIntroHandover}>
            {(phase) => (
              <AnimationFactory
                phase={phase}
                engine={activeBroadcast?.hero_config?.animation}
                preset={activeBroadcast?.festival_key}
              />
            )}
          </FestivalIntroController>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 2  ·  z-[9998]  ·  AMBIENT GOLDEN PARTICLES
          ═══════════════════════════════════════════════════════════════ */}
      {isAmbientActive && activeBroadcast && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <PremiumGoldenParticles />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 3  ·  z-[9999]  ·  GREETING POPUP
          ═══════════════════════════════════════════════════════════════ */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
            onClick={handleDismissPopup}
          />
          <div className="relative z-10 animate-in zoom-in-95 fade-in duration-500">
            <BroadcastRenderer broadcast={activeBroadcast} onClose={handleDismissPopup} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MAIN DASHBOARD
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        <div className="w-64 shrink-0 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ClientSidebar profile={userProfile} />
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-72 h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto">
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <ClientSidebar profile={userProfile} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative w-full">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
        </main>

        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
