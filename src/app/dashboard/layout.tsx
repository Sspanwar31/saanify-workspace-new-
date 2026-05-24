'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { supabase } from '@/lib/supabase'; 
import { RealtimeChannel } from '@supabase/supabase-js'; 
import { useClientStore } from '@/lib/client/store'; // ✅ NEW IMPORT
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 🚀 1. OPTIMISTIC STATE CHANGED TO NULL
  const [userProfile, setUserProfile] = useState<any>(null);

  // ✅ LOADING STATE LOGIC
  const [isChecking, setIsChecking] = useState(!userProfile); 
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const initialized = useRef(false); 

  // 🚀 2. SINGLE AUTH EFFECT (Run Once on Mount)
  useEffect(() => {
    const performAuthSync = async () => {
      if (initialized.current) return;

      try {
        console.log("🔍 [LAYOUT DEBUG 1] performAuthSync started");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.replace('/login');
          return;
        }

        // 🚀 ZUSTAND RESET (Memory clear)
        useClientStore.getState().resetStore();
        console.log("🧹 Zustand Store Cleared");

        // 🚀 SEEDHA VIEW SE DATA LO
        const { data: profile } = await supabase
          .from('current_active_profile')
          .select('*')
          .maybeSingle();

        if (!profile) {
          console.error("❌ [LAYOUT DEBUG] Profile not found in current_active_profile");
          router.push('/login');
          return;
        }

        // 🚀 STORE UPDATE
        useClientStore.setState({ 
          currentUser: profile, 
          isLoggedIn: true 
        });

        setUserProfile(profile);
        
       // 🚀 ADMIN VIEWING CHECK
const {
  data: { user },
} = await supabase.auth.getUser();

const activeClientId =
  profile.role === 'treasurer'
    ? profile.client_id
    : profile.id;

const { data: viewing } = await supabase
  .from('admin_active_viewing')
  .select('client_id')
  .eq('admin_id', user?.id)
  .eq('client_id', activeClientId)
  .maybeSingle();

setIsImpersonating(!!viewing);

        console.log("✅ [LAYOUT DEBUG] User Logged In:", profile.society_name);

        // Theme Update
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Lock Check
        if (profile.status === 'LOCKED' || profile.status === 'EXPIRED') {
           router.push('/login');
           return;
        }

      } catch (err) {
        console.error("Auth Sync Critical Error:", err);
        router.push('/login');
      } finally {
        setIsChecking(false);
        initialized.current = true; 
      }
    };

    performAuthSync();
  }, [router]); 

  // ✅ STEP 2: REALTIME PERMISSION SYNC
  useEffect(() => {
    if (!userProfile) return;

    const ownerId =
      userProfile.role === 'treasurer'
        ? userProfile.client_id
        : userProfile.id;

    const channel: RealtimeChannel = supabase
      .channel(`client-permission-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${ownerId}`
        },
        async (payload) => {
          console.log('🔥 Permission Updated Realtime');
          const updatedData: any = payload.new;

          // ✅ FIX 1 APPLIED: Removed localStorage.setItem()
          // Impersonation architecture me localStorage caching allowed nahi hai
          setUserProfile((prev: any) => ({
            ...prev,
            role_permissions: updatedData.role_permissions
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, userProfile?.client_id]); 
  
  // 🚀 3. SILENT PERMISSION GUARD
  useEffect(() => {
    if (userProfile?.role === 'treasurer') {
      const perms = Array.isArray(
        userProfile?.role_permissions?.treasurer
      ) 
        ? userProfile.role_permissions.treasurer 
        : [];
      const path = pathname.toLowerCase();

      const isAllowed = 
        path === '/dashboard' ||
        (path.includes('members') && perms.includes('View Members')) ||
        (path.includes('passbook') && perms.includes('View Passbook')) ||
        (path.includes('loans') && perms.includes('View Loans')) ||
        (path.includes('expenses') && perms.includes('Manage Expenses')) ||
        (path.includes('reports') && perms.includes('View Reports')) ||
        (path.includes('maturity') && perms.includes('View Dashboard')) ||
        (path.includes('admin-fund') && perms.includes('Manage Admin Fund')) ||
        (path.includes('user-management') && perms.includes('User Management Access')) ||
        (path.includes('settings') && perms.includes('View Settings'));

      if (path !== '/dashboard' && !isAllowed) {
        toast.error("Access Restricted: Permission required");
        router.push('/dashboard');
        return;
      }
    }
    setIsMobileMenuOpen(false); 
  }, [pathname, userProfile, router]);

  // ✅ FIX 2 & 3 APPLIED: Cleaned handleBackToAdmin
  // Removed risky localStorage loops and unnecessary cleanups
  const handleBackToAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('admin_active_viewing')
          .delete()
          .eq('admin_id', user.id);
      }

      window.location.href = '/admin/clients';

    } catch (err) {
      window.location.href = '/admin/clients';
    }
  };

  // 🚀 UI RENDER
  if (isChecking && !userProfile) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      {/* ✅ BANNER */}
      {isImpersonating && (
        <div className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-6 py-2.5 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[1000]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            <span className="font-semibold tracking-wide">
              ADMIN VIEWING: {userProfile?.society_name?.toUpperCase()}
            </span>
          </div>
          <button 
            onClick={handleBackToAdmin} 
            className="bg-white text-purple-800 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Super Admin
          </button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800">
           <ClientSidebar profile={userProfile} /> 
        </div>
        
        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[50] md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
             <div className="w-72 h-full bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
               <ClientSidebar profile={userProfile} />
             </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          {children}
        </main>
        
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
