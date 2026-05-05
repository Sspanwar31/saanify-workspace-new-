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
  const [client, setClient] = useState<any>(null); // ✅ Added client state for Banner Name

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

        // 🚀 1. SESSION SYNC
        const impToken = localStorage.getItem('impersonation_token');
        if (impToken) {
          const { error: impError } = await supabase.auth.setSession({ 
            access_token: impToken, 
            refresh_token: impToken 
          });
          // Agar token expired ya galat hai toh saaf karein
          if (impError) {
             localStorage.removeItem('impersonation_token');
             document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
          }
        }

        // 🚀 2. GET CURRENT SESSION
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // 🚀 3. DECODE JWT (Banner Fix)
        // Sirf banner tabhi dikhayein jab JWT ke andar 'is_impersonating' true ho
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        setIsImpersonating(!!payload.is_impersonating);

        // 🚀 4. FETCH LOGGED-IN USER PROFILE (Name Fix)
        // Ye wohi insaan hai jo login hai (Owner ya Treasurer)
        const { data: userProfile, error: profileErr } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileErr || !userProfile) throw new Error("Profile not found");

        // 🚀 RESOLVE TARGET SOCIETY (Owner Data)
        const mainOwnerId = userProfile.role === 'treasurer' ? userProfile.client_id : userProfile.id;

        // ✅ IMPORTANT: LocalStorage mein dono cheezein rakhein
        // 1. userProfile: Taaki naam aur permissions mil sakein
        // 2. resolved_client_id: Taaki Subscription page ko pata chale kiska data uthana hai
        const storageData = {
            ...userProfile,
            resolved_client_id: mainOwnerId 
        };
        localStorage.setItem('current_user', JSON.stringify(storageData));

        const { data: mainClient } = await supabase
          .from('clients')
          .select('*')
          .eq('id', mainOwnerId)
          .single();

        if (mainClient) {
          // ✅ Set Client State for Banner Name
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
              (path.includes('reports') && permissions.includes('View Reports'));

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

  // Handle Back to Admin
  const handleBack = () => {
    localStorage.removeItem('impersonation_token');
    document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = '/admin/dashboard';
  };

  if (isChecking) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!isAuthorized) return null;

  return (
    <>
      {/* Banner sirf tab dikhega jab Admin ne access kiya ho */}
      {isImpersonating && (
        <div className="w-full bg-indigo-600 text-white px-4 py-2 flex justify-between items-center text-sm sticky top-0 z-[100]">
          <span>🔐 Admin Mode: Viewing as {client?.name}</span>
          <button onClick={handleBack} className="bg-white text-indigo-700 px-3 py-1 rounded text-xs font-bold shadow-sm">Exit Admin Mode</button>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <div className="w-64 shrink-0 hidden md:block border-r dark:border-slate-800"><ClientSidebar /></div>
        
        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[150] md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-72 h-full bg-white dark:bg-slate-900"><ClientSidebar /></div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        
        {/* Mobile Bottom Nav */}
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
