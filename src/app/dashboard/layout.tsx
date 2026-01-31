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

  // ✅ Helper Function: Perform Backup
  const performAutoBackup = async (clientId: string) => {
    try {
      console.log("⏳ Starting Auto Backup...");
      
      // Fetch All Critical Data
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
      const fileName = `${clientId}/latest_backup.json`; // Always overwrite this file

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('client_backups')
        .upload(fileName, fileBody, {
          contentType: 'application/json',
          upsert: true // Overwrite mode
        });

      if (error) throw error;
      console.log("✅ Auto Backup Successful!");

    } catch (err) {
      console.error("Backup Failed (Silent):", err);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      const storedUser = localStorage.getItem('current_user');
      const storedMember = localStorage.getItem('current_member');

      /* ---------------------------------------------------
         ❌ MEMBER NEVER ALLOWED IN CLIENT DASHBOARD
      --------------------------------------------------- */
      if (storedMember && !storedUser) {
        router.push('/member-portal/dashboard');
        return;
      }

      /* ---------------------------------------------------
         ❌ NO LOGIN
      --------------------------------------------------- */
      if (!storedUser) {
        router.push('/login');
        return;
      }

      /* ---------------------------------------------------
         ✅ CLIENT / TREASURER (SAME DASHBOARD)
      --------------------------------------------------- */
      try {
        const user = JSON.parse(storedUser);

        // ✅ IMPORTANT FIX
        const resolvedClientId = user.client_id ?? user.id;

        // ✅ LINE 1 — client fetch me plan add karo
        const { data: client, error } = await supabase
          .from('clients')
          .select('plan, plan_end_date, subscription_status, theme, auto_backup')
          .eq('id', resolvedClientId)
          .single();

        if (error) {
          // If fetch fails, we allow access safely to avoid lockout
          setIsAuthorized(true);
          setIsChecking(false);
          return;
        }

        if (client) {
          // ✅ FIX: Apply Global Theme Logic
          const root = document.documentElement;
          if (client.theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
          } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
          }

          // ✅ NEW: Auto Backup Logic (Runs if Toggle is ON)
          if (client.auto_backup === true) {
             const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
             const lastBackup = localStorage.getItem(`last_backup_${resolvedClientId}`);

             // Agar aaj backup nahi hua hai
             if (lastBackup !== today) {
                performAutoBackup(resolvedClientId).then(() => {
                    localStorage.setItem(`last_backup_${resolvedClientId}`, today);
                });
             }
          }

          const expiry = new Date(client.plan_end_date || new Date());
          const today = new Date();
          
          // ✅ LINE 2 — expiry check me plan ka reference lao
          const isExpired = today > expiry && client.plan !== 'LIFETIME';
          
          const isInactive = client.subscription_status !== 'active';

          // ✅ LINE 3 — condition same rahe
          if ((isExpired || isInactive) && pathname !== '/dashboard/subscription') {
            router.push('/dashboard/subscription');
            return;
          }
        }

        // ✅ Client OR Treasurer both allowed
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
