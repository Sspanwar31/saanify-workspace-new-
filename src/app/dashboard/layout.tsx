'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 🚀 1. INITIAL AUTH: Ye sirf page load par ek baar chalega
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Impersonation Check
        const hasUrlFlag = searchParams.get('impersonate') === 'true';
        const hasStorageFlag = localStorage.getItem('is_admin_impersonating') === 'true';
        if (hasUrlFlag || hasStorageFlag) {
          setIsImpersonating(true);
          localStorage.setItem('is_admin_impersonating', 'true');
        }

        // Profile Fetch (Real-time sync)
        const { data: profile } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
            router.push('/login');
            return;
        }

        // Resolve Society ID
        const activeSocietyId = profile.role === 'treasurer' ? profile.client_id : profile.id;
        const updatedUser = { ...profile, resolved_client_id: activeSocietyId };
        
        // Single Source of Truth
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        setUserProfile(updatedUser);
        setIsAuthorized(true);

        // Theme & Status Check
        if (profile.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        if (profile.status === 'LOCKED' || profile.status === 'EXPIRED') {
          router.push('/login');
        }

      } catch (err) {
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    initializeAuth();
    // 🚀 Dependency array se [pathname] hata diya gaya hai taaki loading loop na bane
  }, [router, searchParams]);

  // 🚀 2. REAL-TIME PERMISSION GUARD: Ye har navigation par chalega bina loading ke
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
        (path.includes('maturity') && perms.includes('View Dashboard')); // 🎯 Match with your DB

      if (path !== '/dashboard' && !isAllowed) {
        toast.error("Access Denied: Missing Permission");
        router.push('/dashboard');
      }
    }
    setIsMobileMenuOpen(false);
  }, [pathname, userProfile, router]);

  const handleBackToAdmin = () => {
    localStorage.removeItem('is_admin_impersonating');
    window.location.href = '/admin/clients'; 
  };

  if (isChecking) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      <p className="text-sm text-slate-500 animate-pulse">Entering Secure Workspace...</p>
    </div>
  );

  if (!isAuthorized) return null;

  return (
    <>
      {isImpersonating && (
        <div className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-6 py-2.5 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[999]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            <span className="font-semibold tracking-wide">ADMIN VIEW: Active Session</span>
          </div>
          <button onClick={handleBackToAdmin} className="bg-white text-purple-800 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-50 transition-all flex items-center gap-2 shadow-sm">
            <ArrowLeft className="w-3 h-3" /> Exit & Back to Admin
          </button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800">
           {/* Sidebar ko profile pass karein taaki wo instant load ho */}
           <ClientSidebar profile={userProfile} /> 
        </div>
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-72 h-full bg-white dark:bg-slate-900 animate-in slide-in-from-left">
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
