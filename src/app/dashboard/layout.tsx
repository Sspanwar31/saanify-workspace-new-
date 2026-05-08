'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Step 4: Removed useSearchParams
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Step 5: Removed searchParams line
  
  // 🚀 Optimization: Initialize from LocalStorage to avoid initial flicker
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isAuthorized, setIsAuthorized] = useState(!!userProfile);
  const [isChecking, setIsChecking] = useState(!userProfile); 
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const hasInitialized = useRef(false); 

  // 🚀 1. INITIAL AUTH & BACKGROUND SYNC
  useEffect(() => {
    const syncAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Step 1: REMOVED OLD IMPERSONATION LOGIC BLOCK

        // Step 2: ADD NEW IMPERSONATION CLIENT LOGIC
        // ✅ Impersonation Client ID
        const impersonationClientId =
          localStorage.getItem('impersonation_client_id');

        // ✅ If impersonating use target client
        // otherwise use logged-in user id
        const targetClientId =
          impersonationClientId || session.user.id;

        // ✅ Admin impersonation state
        if (impersonationClientId) {
          setIsImpersonating(true);
          localStorage.setItem('is_admin_impersonating', 'true');
        } else {
          setIsImpersonating(false);
        }

        // ✅ Load target client profile
        const { data: profile } = await supabase
          .from('clients')
          .select('*')
          .eq('id', targetClientId)
          .maybeSingle();

        if (profile) {
          const activeSocietyId = profile.role === 'treasurer' ? profile.client_id : profile.id;
          const updatedUser = { ...profile, resolved_client_id: activeSocietyId };
          
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          setUserProfile(updatedUser);
          setIsAuthorized(true);

          // Theme Logic
          if (profile.theme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          
          if (profile.status === 'LOCKED' || profile.status === 'EXPIRED') router.push('/login');
        }
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setIsChecking(false);
        hasInitialized.current = true;
      }
    };

    if (!hasInitialized.current) syncAuth();
  }, [router]); 

  // 🚀 2. INSTANT PERMISSION GUARD (No Loading Spinner)
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

  // Step 3: FIX BACK BUTTON
  const handleBackToAdmin = () => {
    // ✅ Remove impersonation state
    localStorage.removeItem('impersonation_client_id');
    localStorage.removeItem('is_admin_impersonating');

    // ✅ Back to admin
    window.location.href = '/admin/clients';
  };

  // Asli Fast UI Logic
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
          <button onClick={handleBackToAdmin} className="bg-white text-purple-800 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-50 transition-all flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        {/* Sidebar remains stable on navigation */}
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800">
           {/* 🚀 Sidebar ko profile pass karein taaki wo flicker na kare */}
           <ClientSidebar profile={userProfile} /> 
        </div>
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          {/* 🚀 Sirf aur sirf Authorized hone par content dikhayein */}
          {(isAuthorized || userProfile) && children}
        </main>
        
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
