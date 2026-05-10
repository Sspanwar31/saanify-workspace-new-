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
  const searchParams = useSearchParams();
  
  // 🚀 1. INSTANT DATA LOAD (No Spinner if data exists)
  const [userProfile, setUserProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('impersonation_user') || localStorage.getItem('current_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isChecking, setIsChecking] = useState(!userProfile); 
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const initialized = useRef(false);

  // 🚀 2. AUTH SYNC (Background Only)
  useEffect(() => {
    const syncAuth = async () => {
      if (initialized.current) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const isImp = localStorage.getItem('is_admin_impersonating') === 'true' || searchParams.get('impersonate') === 'true';
        setIsImpersonating(isImp);

        // Silent Fetch (UI block nahi hoga)
        const { data: profile } = await supabase.from('clients').select('*').eq('id', session.user.id).maybeSingle();

        if (profile) {
          const societyId = profile.role === 'treasurer' ? profile.client_id : profile.id;
          const updatedUser = { ...profile, resolved_client_id: societyId };
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          setUserProfile(updatedUser);
        }
      } catch (err) {
        console.error("Layout Sync Error");
      } finally {
        setIsChecking(false);
        initialized.current = true;
      }
    };
    syncAuth();
  }, [router]); 

  // 🚀 3. PERMISSION GUARD (Bina Loading ke)
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
        toast.error("Access Restricted");
        router.push('/dashboard');
      }
    }
    setIsMobileMenuOpen(false);
  }, [pathname, userProfile]);

  if (isChecking && !userProfile) {
    return <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>;
  }

  return (
    <>
      {isImpersonating && (
        <div className="w-full bg-purple-700 text-white px-4 py-2 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[999]">
          <span>🔐 Admin Mode</span>
          <button onClick={() => window.location.href='/admin/clients'} className="bg-white text-purple-800 px-3 py-1 rounded text-xs font-bold">Back to Admin</button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800">
           <ClientSidebar profile={userProfile} /> 
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
