'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // ✅ OPTIMISTIC STATE: Turant data nikalne ka try karein
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const impersonationUser = localStorage.getItem('impersonation_user');
      const normalUser = localStorage.getItem('current_user');
      const saved = impersonationUser || normalUser;
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // ✅ FIX: Initial 'isChecking' ko False rakhenge
  // Agar LS mein data hai, to Loader nahi dikhega. Tab dikhega jab data hai hi nahi.
  const [isChecking, setIsChecking] = useState(false); 
  const [isAuthorized, setIsAuthorized] = useState(!!userProfile);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const hasInitialized = useRef(false); 

  // 🚀 1. SMOOTH AUTH LOGIC
  useEffect(() => {
    const syncAuth = async () => {
      // ✅ AGAR PEHLE SE DATA HAI TO LOADER NAHI DIKHAYEGA
      // Sirf tab dikhayein agar haal hi mein data clear hua ho aur koi user na ho
      if (!userProfile) {
        setIsChecking(true);
      } else {
        // Agar user pda hai to background mein silent refresh
        setIsChecking(false); 
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Agar session hi nahi hai to logout bhej do
        if (!session) {
          router.push('/login');
          return;
        }

        // Impersonation Check
        const isAdminImpersonating =
          localStorage.getItem('is_admin_impersonating') === 'true' ||
          pathname.includes('impersonate=true');
          
        setIsImpersonating(isAdminImpersonating);

        // Fetch Profile
        // ✅ Hum yahan API call kar rahe hain, par frontend turant purana data (userProfile) use kar raha hai
        // Isse "Flicker" nahi hoga.
        const { data: profile } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const activeSocietyId = profile.role === 'treasurer' ? profile.client_id : profile.id;
          const updatedUser = { ...profile, resolved_client_id: activeSocietyId };
          
          // Storage Update
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          if(isAdminImpersonating) {
             localStorage.setItem('impersonation_user', JSON.stringify(updatedUser));
          }

          // ✅ STATE UPDATE
          setUserProfile(updatedUser);
          setIsAuthorized(true);

          // Theme Update
          if (profile.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          if (profile.status === 'LOCKED' || profile.status === 'EXPIRED') router.push('/login');
        }
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        // ✅ Jab bhi kaam ho, checking off karein
        setIsChecking(false);
        hasInitialized.current = true;
      }
    };

    if (!hasInitialized.current) syncAuth();
  }, [router, pathname]); // pathname remove kar sakte hain agar necessary na ho

  // 🚀 2. PERMISSION GUARD
  useEffect(() => {
    if (userProfile?.role === 'treasurer') {
      const perms = userProfile.role_permissions?.treasurer || [];
      const path = pathname.toLowerCase();
      
      const isAllowed = 
        path === '/dashboard' ||
        (path.includes('members') && perms.includes('View Members')) ||
        (path.includes('passbook') && perms.includes('View Passbook')) ||
        (path.includes('loans') && perms.includes('View Loans')) ||
        (path.includes('expenses') && perms.includes('Manage Expenses')) ||
        (path.includes('reports') && perms.includes('View Reports')) ||
        (path.includes('maturity') && perms.includes('View Dashboard'));

      if (path !== '/dashboard' && !isAllowed) {
        toast.error("Access Restricted: Permission required");
        router.push('/dashboard');
      }
    }
    setIsMobileMenuOpen(false);
  }, [pathname, userProfile, router]);

  // ✅ UPDATED BACK BUTTON LOGIC
  const handleBackToAdmin = async () => {
    const toastId = toast.loading("Restoring Admin Session...");
    try {
      localStorage.removeItem('is_admin_impersonating');
      
      const adminSessionStr = localStorage.getItem('master_admin_session');
      
      if (adminSessionStr) {
        const adminSession = JSON.parse(adminSessionStr);
        
        const { error } = await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token
        });

        if (error) throw error;

        toast.success("Admin Session Restored", { id: toastId });
        window.location.href = '/admin/clients';
      } else {
        window.location.href = '/admin/login';
      }
    } catch (err) {
      window.location.href = '/admin/login';
    }
  };

  // ✅ OPTIMIZED LOADING CHECK
  // Ab Sirf tab Loader Dikhega agar haal hi mein koi user nahi hai (Fresh Load)
  if (isChecking && !userProfile) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      {isImpersonating && (
        <div className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-6 py-2.5 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[999]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            <span className="font-semibold tracking-wide">ADMIN VIEW</span>
          </div>
          <button 
            onClick={handleBackToAdmin} 
            className="bg-white text-purple-800 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800">
           <ClientSidebar profile={userProfile} /> 
        </div>
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          {(isAuthorized || userProfile) && children}
        </main>
        
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
