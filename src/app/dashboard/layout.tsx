'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ ADDED BACK: Impersonation State
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  const [client, setClient] = useState<any>(null);

  // --- Auto Backup Function ---
  const performAutoBackup = async (clientId: string) => {
    try {
      const [members, loans, passbook, expenses] = await Promise.all([
        supabase.from('members').select('*').eq('client_id', clientId),
        supabase.from('loans').select('*').eq('client_id', clientId),
        supabase.from('passbook_entries').select('*').eq('client_id', clientId),
        supabase.from('expenses_ledger').select('*').eq('client_id', clientId),
      ]);
      const backupData = {
        timestamp: new Date().toISOString(),
        clientId,
        members: members.data || [],
        loans: loans.data || [],
        passbook: passbook.data || [],
        expenses: expenses.data || [],
      };
      await supabase.storage
        .from('client_backups')
        .upload(`${clientId}/latest_backup.json`, JSON.stringify(backupData), { upsert: true });
    } catch (err) { console.error("Backup Failed:", err); }
  };

  useEffect(() => {
    // ✅ ADDED BACK: Check Impersonation Logic
    const checkImpersonation = () => {
      // 1. Check if URL has the flag or LocalStorage has it
      const params = new URLSearchParams(window.location.search);
      const hasUrlFlag = params.get('impersonate') === 'true';
      const hasStorageFlag = localStorage.getItem('is_admin_impersonating') === 'true';

      if (hasUrlFlag || hasStorageFlag) {
        setIsImpersonating(true);
        localStorage.setItem('is_admin_impersonating', 'true'); // Persist it
      }
    };

    const initializeAuth = async () => {
      try {
        setIsChecking(true);

        // 🟢 6. SAFE VERSION: Final Session Verification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.push('/login');
          return;
        }

        // 🟢 7. ADDED LOG DEBUG
        console.log("AUTH USER:", session.user.id);
        
        const { data: userProfile, error: profileErr } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileErr) {
            console.error("Profile fetch error:", profileErr);
            setIsChecking(false);
            return;
        }

        if (!userProfile) {
            console.warn("Profile not found in DB");
            router.push('/login');
            return;
        }

        // 🟢 7. SAFE VERSION: RESOLVE TARGET SOCIETY (Owner Data)
        const mainOwnerId =
          userProfile.role === 'treasurer' && userProfile.client_id
            ? userProfile.client_id
            : userProfile.id;

        const storageData = {
            ...userProfile,
            resolved_client_id: mainOwnerId 
        };
        
        const { data: mainClient } = await supabase
          .from('clients')
          .select('*')
          .eq('id', mainOwnerId)
          .single();

        if (mainClient) {
          setClient(mainClient);

          // --- Permission Check (Treasurer ke liye) ---
          if (userProfile.role === 'treasurer') {
            const permissions = userProfile.role_permissions?.treasurer || [];
            const path = pathname.toLowerCase();
            const isAllowed = 
              path === '/dashboard' ||
              (path.includes('members') && permissions.includes('View Members')) ||
              (path.includes('passbook') && permissions.includes('View Passbook')) ||
              (path.includes('loans') && permissions.includes('View Loans')) ||
              (path.includes('expenses') && permissions.includes('Manage Expenses')) ||
              (path.includes('reports') && permissions.includes('View Reports')) ||
              (path.includes('maturity') && permissions.includes('View Dashboard'));

            if (path !== '/dashboard' && !isAllowed) {
              toast.error("Access Denied: Missing Permissions");
              router.push('/dashboard');
              return;
            }
          }

          // --- Theme & Lock Check (Based on Society Owner) ---
          if (mainClient.theme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');

          if (mainClient.status === 'LOCKED' || mainClient.status === 'EXPIRED') {
            toast.error("Society account is locked or expired");
            router.push('/login');
            return;
          }
          
          // --- Auto Backup Logic ---
          if (mainClient.auto_backup === true) {
             const today = new Date().toISOString().split('T')[0];
             if (localStorage.getItem(`last_backup_${mainOwnerId}`) !== today) {
                performAutoBackup(mainOwnerId).then(() => localStorage.setItem(`last_backup_${mainOwnerId}`, today));
             }
          }
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error("Layout Auth Error:", err);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkImpersonation(); // ✅ Run this first
    initializeAuth();      // ✅ Then run Auth
  }, [pathname, router]);

  // ✅ ADDED BACK: Back to Admin Function
  const handleBackToAdmin = () => {
    localStorage.removeItem('is_admin_impersonating');
    // Direct Admin Dashboard par bhejein
    window.location.href = '/admin/clients'; 
  };

  if (isChecking) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      <p className="text-sm text-slate-500 animate-pulse">Synchronizing permissions...</p>
    </div>
  );
  if (!isAuthorized) return null;

  return (
    // ✅ Added Fragment Wrapper <> to include Banner
    <>
      {/* ✅ Purple Banner for Admin */}
      {isImpersonating && (
        <div className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-6 py-2.5 flex justify-between items-center text-sm shadow-xl sticky top-0 z-[999]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            <span className="font-semibold tracking-wide">ADMIN VIEW: Actively managing this society</span>
          </div>
          <button 
            onClick={handleBackToAdmin}
            className="bg-white text-purple-800 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" /> Exit & Back to Admin
          </button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800"><ClientSidebar /></div>
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-72 h-full bg-white dark:bg-slate-900"><ClientSidebar /></div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
