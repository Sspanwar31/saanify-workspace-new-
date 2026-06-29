'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import BroadcastRenderer from '@/components/festival/v2/BroadcastRenderer';
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

  const [festivalIntro, setFestivalIntro] = useState(false);

  // ━━━ 1. REALTIME SYSTEM SETTINGS LISTENER ━━━
  useEffect(() => {
    const fetchInitialSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        setSysSettings(data);
      } catch (e) {
        // Silent fail for settings
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
    const { data, error } = await supabase
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
      // ✅ FIX: Agar same broadcast ID hai, toh state update mat karo (Warna animation restart hoga)
      if (activeBroadcast?.id === data.id) return;

      setActiveBroadcast(data);
      const sessionSeen = sessionStorage.getItem(`seen_broadcast_${data.id}`);
      
      if (!sessionSeen && !hasSeenPopup) {
        if (data.hero_enabled) {
          setFestivalIntro(true);
          setTimeout(() => {
            setFestivalIntro(false);
            setShowPopup(true);
          }, 5000);
        } else {
          setShowPopup(true);
        }
      } else {
        setShowPopup(false);
      }
    } else {
      // ✅ FIX: Sirf tab null karo jab pehle koi active tha
      if (activeBroadcast) {
        setActiveBroadcast(null);
        setShowPopup(false);
        setFestivalIntro(false);
      }
    }
  }, [hasSeenPopup, activeBroadcast?.id]);

  const checkBroadcastExpiry = useCallback(() => {
    if (!activeBroadcast?.ends_at) return;

    const now = Date.now();
    const endTime = new Date(activeBroadcast.ends_at).getTime();

    if (now >= endTime) {
      setActiveBroadcast(null);
      setShowPopup(false);
      setFestivalIntro(false);
    }
  }, [activeBroadcast]);

  useEffect(() => {
    fetchBroadcasts();

    const channel = supabase.channel('broadcast-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'broadcasts' }, 
        () => {
          fetchBroadcasts();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBroadcasts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBroadcasts();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchBroadcasts]);

  useEffect(() => {
    if (!activeBroadcast?.ends_at) return;

    const interval = setInterval(() => {
      checkBroadcastExpiry();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBroadcast, checkBroadcastExpiry]);

  const handleDismissPopup = () => {
    setShowPopup(false);
    setHasSeenPopup(true);
    if (activeBroadcast) {
      sessionStorage.setItem(`seen_broadcast_${activeBroadcast.id}`, 'true');
    }
  };

  // ━━━ 3. AUTH + PROFILE SYNC ━━━
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
        
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

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

  const themeColor = activeBroadcast?.theme_color || '#3b82f6';
  const isLightColor = ['#FBBF24', '#F59E0B', '#EAB308', 'GOLD', '#fbbf24', '#f59e0b', '#eab308'].includes(themeColor.toUpperCase());
  const textColorClass = isLightColor ? 'text-slate-950' : 'text-white';
  const badgeBgClass = isLightColor ? 'bg-black/10 border-black/10 text-slate-950' : 'bg-white/10 border-white/15 text-white';

  const renderBroadcastIcon = () => {
    const key = activeBroadcast?.festival_key?.toUpperCase() || '';
    switch (key) {
      case 'MAINTENANCE':
        return <Wrench className="w-5 h-5 animate-pulse shrink-0" />;
      case 'EMERGENCY':
        return <AlertOctagon className="w-5 h-5 animate-bounce shrink-0 text-red-100" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 shrink-0" />;
      case 'SPECIAL_OFFER':
        return <Gift className="w-5 h-5 animate-bounce shrink-0" />;
      case 'EVENT':
        return <Calendar className="w-5 h-5 shrink-0" />;
      default:
        return (
          <Sparkles 
            className="w-5 h-5 shrink-0 animate-[spin_4s_linear_infinite]" 
            style={{ animationDuration: '4s' }} 
          />
        );
    }
  };

  return (
    <>
      {shouldShowLockout && <MaintenanceScreen settings={sysSettings} />}

      {sysSettings?.is_maintenance_scheduled && !isMaintenanceActive && (
        <div className="bg-orange-600 text-white py-2 text-center text-xs font-bold animate-in slide-in-from-top duration-500 z-[1000] sticky top-0">
          <span>
            ⚠️ SCHEDULED MAINTENANCE: {sysSettings.maintenance_title} ({new Date(sysSettings.maintenance_start).toLocaleString()} - {new Date(sysSettings.maintenance_end).toLocaleString()})
          </span>
        </div>
      )}

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

      {activeBroadcast &&
        !showPopup &&
        !festivalIntro && (
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

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${badgeBgClass}`}>
                Saanify Pariwar
              </span>

              <div className="flex items-center gap-2.5 min-w-0 truncate text-xs md:text-sm">
                <span className="font-black uppercase tracking-tight shrink-0 drop-shadow-sm">
                  {activeBroadcast?.resolved_title || activeBroadcast?.title}
                </span>
                
                <span className={`opacity-30 shrink-0 select-none ${isLightColor ? 'text-slate-950' : 'text-white'}`}>|</span>
                
                <p className={`truncate font-semibold tracking-wide drop-shadow-sm ${isLightColor ? 'text-slate-900' : 'text-slate-100'}`}>
                  {activeBroadcast?.resolved_message || activeBroadcast?.message?.split('|')?.[0]}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveBroadcast(null)} 
              className="p-1.5 hover:bg-black/10 rounded-full transition-colors duration-200 shrink-0 ml-3"
            >
              <X className="w-5 h-5 opacity-85" />
            </button>
          </div>
        </div>
      )}

      {activeBroadcast?.hero_enabled && (
        <AnimationFactory
          phase="INTRO"
          engine={activeBroadcast?.hero_config?.animation}
          preset={activeBroadcast?.festival_key}
        />
      )}

      <Dialog
        open={showPopup && !festivalIntro}
        onOpenChange={setShowPopup}
      >
        <DialogContent className="max-w-xl p-0 border-none bg-transparent shadow-none overflow-visible">
           <BroadcastRenderer
             broadcast={activeBroadcast}
             onClose={handleDismissPopup}
           />
        </DialogContent>
      </Dialog>

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        
        <div className="w-64 shrink-0 hidden md:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ClientSidebar profile={userProfile} />
        </div>

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

        <main className="flex-1 overflow-y-auto relative w-full">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
