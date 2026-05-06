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
  // 🔴 REMOVED: const [isImpersonating, setIsImpersonating] = useState(false);
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
    const initializeAuth = async () => {
      try {
        setIsChecking(true);

        // 🔴 REMOVED: Impersonation Token Block (setSession)

        // 🟢 6. SAFE VERSION: Final Session Verification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          router.push('/login');
          return;
        }

        // 🔴 REMOVED: JWT Payload Check Block

        // 🚀 4. Fetch Profile
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
        
        // 🟢 8. OPTIONAL CLEANUP
        // localStorage.setItem('current_user', JSON.stringify(storageData));

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

    initializeAuth();
  }, [pathname, router]);

  // 🔴 REMOVED: handleBack function

  if (isChecking) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      <p className="text-sm text-slate-500 animate-pulse">Synchronizing permissions...</p>
    </div>
  );
  if (!isAuthorized) return null;

  return (
    // 🔴 REMOVED: Fragment <> & Impersonation Banner
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
  );
}
