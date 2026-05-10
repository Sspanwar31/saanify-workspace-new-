'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; 
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // ✅ Added for checking URL params
  
  // 🚀 1. OPTIMISTIC STATE (Instant Load)
  // Turant data uthao LocalStorage se taaki page khaali na dikhe
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('impersonation_user') || localStorage.getItem('current_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // ✅ LOADING STATE LOGIC:
  // Agar LS mein data hai to 'isChecking' false rahega (Turant UI).
  // Agar LS mein data nahi hai to 'true' (Loader dikhega).
  const [isChecking, setIsChecking] = useState(!userProfile); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const initialized = useRef(false); // ✅ Ensure effect runs only ONCE

  // 🚀 2. SINGLE AUTH EFFECT (Run Once on Mount)
  useEffect(() => {
    const performAuthSync = async () => {
      // Agar pehle se run ho chuka hai to rok do
      if (initialized.current) return;

      try {
        // 🚀 1. SABSE ZAROORI: Seedha Supabase Auth se Current User lo
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session) {
          console.error("No active session found");
          router.push('/login');
          return;
        }

        // ✅ Impersonation Check (URL + LocalStorage)
        const isImp = 
          localStorage.getItem('is_admin_impersonating') === 'true' || 
          searchParams.get('impersonate') === 'true';
        
        setIsImpersonating(isImp);

        // --- ✅ NEW CODE REPLACEMENT START ---
        
        // STEP 1: current login user load karo
        const { data: profile } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
          router.push('/login');
          return;
        }

        // STEP 2: Treasurer hai to OWNER permissions load karo
        let mergedProfile = profile;

        if (profile.role === 'treasurer' && profile.client_id) {

          const { data: ownerProfile } = await supabase
            .from('clients')
            .select('role_permissions')
            .eq('id', profile.client_id)
            .maybeSingle();

          mergedProfile = {
            ...profile,
            // ✅ OWNER permissions inject karo
            role_permissions: ownerProfile?.role_permissions || {}
          };
        }

        // STEP 3
        const activeSocietyId =
          mergedProfile.role === 'treasurer'
            ? mergedProfile.client_id
            : mergedProfile.id;

        const updatedUser = {
          ...mergedProfile,
          resolved_client_id: activeSocietyId
        };

        // Storage Update
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        
        // Impersonation wale case mein localstorage update
        if (isImp) {
          localStorage.setItem('impersonation_user', JSON.stringify(updatedUser));
        }

        // ✅ State Update (Background mein)
        setUserProfile(updatedUser);
        setIsAuthorized(true);

        // --- ✅ NEW CODE REPLACEMENT END ---

        // Theme Update
        if (profile.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        if (profile.status === 'LOCKED' || profile.status === 'EXPIRED') router.push('/login');
      } catch (err) {
        console.error("Auth Sync Error:", err);
      } finally {
        // ✅ Kaam khatam, checking off karein
        setIsChecking(false);
        initialized.current = true; // Mark as done
      }
    };

    performAuthSync();
  }, [router]); // Agar strict mode mein loop kare to [router] rakhein, warna [] bhi chalega

  // 🚀 3. SILENT PERMISSION GUARD (Runs on Nav)
  // Ye sirf permission check karega, data fetch nahi karega. Isse smoothness aayegi.
  useEffect(() => {
    if (userProfile?.role === 'treasurer') {
      // Database se aane wali permissions: ["View Dashboard", "View Members", ...]
      const permissions = userProfile.role_permissions?.treasurer || [];
      const path = pathname.toLowerCase();

      // 🚀 ASLI SYNC: Exact strings from your DB dump
      const isAllowed = 
        path === '/dashboard' ||
        (path.includes('members') && permissions.includes('View Members')) ||
        (path.includes('passbook') && permissions.includes('View Passbook')) ||
        (path.includes('loans') && permissions.includes('View Loans')) ||
        (path.includes('expenses') && permissions.includes('Manage Expenses')) ||
        (path.includes('reports') && permissions.includes('View Reports')) ||
        (path.includes('maturity') && permissions.includes('View Dashboard')) ||
        (path.includes('admin-fund') && permissions.includes('Manage Admin Fund')) ||
        (path.includes('user-management') && permissions.includes('User Management Access')) ||
        (path.includes('settings') && permissions.includes('View Settings'));

      if (path !== '/dashboard' && !isAllowed) {
        toast.error("Access Restricted: Permission required");
        router.push('/dashboard');
        return;
      }
    }
    setIsMobileMenuOpen(false);
  }, [pathname, userProfile, router]);

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

  // 🚀 UI RENDER
  // Agar Profile pda hai turant content dikhega.
  // Agar nahi hai to Loader dikhega.
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
        
        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[50] md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
             <div className="w-72 h-full bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
               <ClientSidebar profile={userProfile} />
             </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          {/* children hamesha render honge agar userProfile hai */}
          {isAuthorized && children}
        </main>
        
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
