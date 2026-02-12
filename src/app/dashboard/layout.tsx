'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav'; // ✅ IMPORT ADDED

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State

  // --- Auto Backup Function (Unchanged) ---
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
      const fileBody = JSON.stringify(backupData);
      const fileName = `${clientId}/latest_backup.json`;
      await supabase.storage
        .from('client_backups')
        .upload(fileName, fileBody, { contentType: 'application/json', upsert: true });
    } catch (err) { console.error("Backup Failed:", err); }
  };

  useEffect(() => {
    let attempts = 0;
    const checkAccess = async () => {
      const storedUser = localStorage.getItem('current_user');
      if (!storedUser && attempts < 2) {
         attempts++;
         setTimeout(checkAccess, 200);
         return;
      }
      const storedMember = localStorage.getItem('current_member');
      if (storedMember && !storedUser) {
        router.push('/member-portal/dashboard');
        return;
      }
      if (!storedUser) {
        router.push('/login');
        return;
      }
      try {
        const user = JSON.parse(storedUser);
        const resolvedClientId = user.client_id ?? user.id;
        const { data: client, error } = await supabase
          .from('clients')
          .select('plan, plan_end_date, subscription_status, theme, auto_backup, status')
          .eq('id', resolvedClientId)
          .single();

        if (error) {
          setIsAuthorized(true);
          setIsChecking(false);
          return;
        }

        if (client) {
          const root = document.documentElement;
          if (client.theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
          } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
          }
          if (client.auto_backup === true) {
             const today = new Date().toISOString().split('T')[0]; 
             const lastBackup = localStorage.getItem(`last_backup_${resolvedClientId}`);
             if (lastBackup !== today) {
                performAutoBackup(resolvedClientId).then(() => {
                    localStorage.setItem(`last_backup_${resolvedClientId}`, today);
                });
             }
          }
          const expiry = new Date(client.plan_end_date || new Date());
          const today = new Date();
          const isTrial = client.plan === 'TRIAL' || client.plan === 'FREE_TRIAL';
          const isExpired = today > expiry && client.plan !== 'LIFETIME';
          const isInactive = client.subscription_status !== 'active' && !isTrial;
          const isLocked = client.status === 'LOCKED' || client.status === 'EXPIRED';

          if (isLocked) {
             localStorage.clear();
             router.push('/login');
             return;
          }
          if ((isExpired || isInactive) && pathname !== '/dashboard/subscription') {
            router.push('/dashboard/subscription');
            return;
          }
        }
        setIsAuthorized(true);
      } catch (err) { router.push('/login'); }
      setIsChecking(false);
    };
    checkAccess();
  }, [pathname, router]);

  // Page change hone par menu apne aap band ho jaye
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR: Desktop par dikhega, mobile par hidden */}
      <div className="w-64 shrink-0 hidden md:block h-full border-r border-slate-200 dark:border-slate-800">
        <ClientSidebar />
      </div>

      {/* MOBILE DRAWER: Sirf 'More' click karne par khulega */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-72 h-full bg-white dark:bg-slate-900 animate-in slide-in-from-left">
             <ClientSidebar />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto h-full pb-20 md:pb-0 bg-slate-50 dark:bg-slate-900">
        {/* Desktop Layout kharab na ho isliye padding sirf mobile par 'pb-20' di hai */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV: Sirf mobile par dikhega */}
      <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
