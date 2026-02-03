'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Auto Backup Function
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

    } catch (err) { console.error("Backup Failed (Silent):", err); }
  };

  useEffect(() => {
    let attempts = 0;

    const checkAccess = async () => {
      const storedUser = localStorage.getItem('current_user');
      
      // Retry Logic: Wait for Signup to set localStorage
      if (!storedUser && attempts < 2) {
         attempts++;
         setTimeout(checkAccess, 200); // Retry after 200ms
         return;
      }

      const storedMember = localStorage.getItem('current_member');

      // Security Checks
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

        // Fetch Client Data
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
          // Theme Logic
          const root = document.documentElement;
          if (client.theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
          } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
          }

          // Backup Logic
          if (client.auto_backup === true) {
             const today = new Date().toISOString().split('T')[0]; 
             const lastBackup = localStorage.getItem(`last_backup_${resolvedClientId}`);
             if (lastBackup !== today) {
                performAutoBackup(resolvedClientId).then(() => {
                    localStorage.setItem(`last_backup_${resolvedClientId}`, today);
                });
             }
          }

          // Validation Logic
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
      } catch (err) {
        router.push('/login');
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="w-64 shrink-0 hidden md:block h-full border-r border-slate-200 dark:border-slate-800">
        <ClientSidebar />
      </div>
      <main className="flex-1 overflow-y-auto h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {children}
      </main>
    </div>
  );
}
