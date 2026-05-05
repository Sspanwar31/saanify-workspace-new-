'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

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
    const initializeAuth = async () => {
      try {
        setIsChecking(true);

        // 1. Impersonation Check
        const impToken = localStorage.getItem('impersonation_token');
        if (impToken) {
          const { error: impError } = await supabase.auth.setSession({ access_token: impToken, refresh_token: impToken });
          if (!impError) setIsImpersonating(true);
        }

        // 2. Final Session Check
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // 🚀 3. TREASURER & PERMISSION LOGIC (The Fix)
        // Pehle logged-in user ka profile nikalein
        const { data: userProfile, error: profileErr } = await supabase
          .from('clients')
          .select('role, client_id, role_permissions, status')
          .eq('id', session.user.id)
          .single();

        if (profileErr || !userProfile) throw new Error("Profile not found");

        // Resolve kiske account mein kaam ho raha hai
        // Agar treasurer hai toh uske 'client_id' (Owner) ka data uthao
        const mainOwnerId = userProfile.role === 'treasurer' ? userProfile.client_id : session.user.id;

        const { data: mainClient } = await supabase
          .from('clients')
          .select('*')
          .eq('id', mainOwnerId)
          .single();

        if (mainClient) {
          // --- Permission Check ---
          // Agar Treasurer hai, toh check karein kya uske paas is page ki permission hai
          if (userProfile.role === 'treasurer') {
            const permissions = userProfile.role_permissions?.treasurer || [];
            const currentPath = pathname.toLowerCase();

            // Logic: Agar path 'members' hai aur permission mein 'View Members' nahi hai toh block karein
            const isAllowed = (path: string) => {
                if (path === '/dashboard') return true; // Dashboard sabko allowed hai
                if (path.includes('members') && permissions.includes('View Members')) return true;
                if (path.includes('passbook') && permissions.includes('View Passbook')) return true;
                if (path.includes('loans') && permissions.includes('View Loans')) return true;
                if (path.includes('expenses') && permissions.includes('Manage Expenses')) return true;
                if (path.includes('reports') && permissions.includes('View Reports')) return true;
                return false;
            };

            // Agar permission nahi hai aur user dashboard ke bahar kisi page par hai
            if (currentPath !== '/dashboard' && !isAllowed(currentPath)) {
                toast.error("You don't have permission to access this section");
                router.push('/dashboard');
                return;
            }
          }

          // --- Theme & Backup (Owner ke settings ke hisab se) ---
          if (mainClient.theme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');

          if (mainClient.auto_backup === true) {
             const today = new Date().toISOString().split('T')[0];
             if (localStorage.getItem(`last_backup_${mainOwnerId}`) !== today) {
                performAutoBackup(mainOwnerId).then(() => localStorage.setItem(`last_backup_${mainOwnerId}`, today));
             }
          }

          // --- Expiry & Lock Check (Owner ke status ke hisab se) ---
          if (mainClient.status === 'LOCKED' || mainClient.status === 'EXPIRED') {
            router.push('/login');
            return;
          }
        }

        setIsAuthorized(true);
      } catch (err) {
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    initializeAuth();
  }, [pathname, router]);

  const handleBack = () => {
    document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem('impersonation_token');
    window.location.href = '/admin/dashboard';
  };

  if (isChecking) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAuthorized) return null;

  return (
    <>
      {isImpersonating && (
        <div className="w-full bg-purple-600 text-white px-4 py-2 flex justify-between items-center text-sm z-50">
          <span>🔐 Admin Mode: Viewing Client Panel</span>
          <button onClick={handleBack} className="bg-white text-purple-700 px-2 py-1 rounded text-xs font-bold">Back to Admin</button>
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
