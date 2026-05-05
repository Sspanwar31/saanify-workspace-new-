'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react'; 
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // --- Auto Backup Function (Same as before) ---
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

  // ✅ UPDATED: Main Auth & Impersonation Logic
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsChecking(true);

        // 🚀 STEP 1: Impersonation Token Check (Updated Logic - No SignOut)
        const impToken = localStorage.getItem('impersonation_token');
        
        if (impToken) {
          console.log("🛠️ Attempting Impersonation Sync...");

          // ✅ IMPORTANT: signOut() mat karein, seedha setSession karein
          const { data: impData, error: impError } = await supabase.auth.setSession({
            access_token: impToken,
            refresh_token: impToken, 
          });

          if (impError) {
            console.error("❌ Impersonation Failed:", impError.message);
            // Agar token invalid hai toh saaf kar dein taaki loop na ho
            localStorage.removeItem('impersonation_token');
            document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            router.push('/login');
            return; // Stop further execution
          } else {
            console.log("✅ Session Authenticated for:", impData.user?.email);
            setIsImpersonating(true);
            setIsAuthorized(true);
          }
        }

        // 🚀 STEP 2: Ab Final Session check karein (Chahe Impersonated ho ya Normal)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.warn("No valid session found, redirecting...");
          router.push('/login');
          return;
        }

        // 🚀 STEP 3: Client Details Verify karein (Theme, Backup, Lock Check)
        const resolvedClientId = session.user.id;
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

          // Access Protection (Lock/Expiry Check)
          const isLocked = client.status === 'LOCKED' || client.status === 'EXPIRED';
          if (isLocked) {
             router.push('/login');
             return;
          }

          const expiry = new Date(client.plan_end_date || new Date());
          const todayDate = new Date();
          const isTrial = client.plan === 'TRIAL' || client.plan === 'FREE_TRIAL';
          const isExpired = todayDate > expiry && client.plan !== 'LIFETIME';
          const isInactive = client.subscription_status !== 'active' && !isTrial;

          if ((isExpired || isInactive) && pathname !== '/dashboard/subscription') {
            router.push('/dashboard/subscription');
            return;
          }
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error("Auth initialization error:", err);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    initializeAuth();
  }, [pathname, router]);

  // Page change hone par menu apne aap band ho jaye
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ✅ handleBack to Admin logic
  const handleBack = async () => {
    // 1. Cookies aur LocalStorage saaf karein
    document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem('impersonation_token');
    // 2. Wapas admin par bhejien
    window.location.href = '/admin/dashboard';
  };

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <>
      {/* ✅ Banner confirmation */}
      {isImpersonating && pathname.startsWith('/dashboard') && (
        <div className="w-full bg-purple-600 text-white px-4 py-2 flex justify-between items-center text-sm shadow-md z-50">
          <span className="font-medium">🔐 Viewing as Client (Admin Mode)</span>
          <button
            onClick={handleBack}
            className="bg-white text-purple-700 px-3 py-1 rounded-md text-xs font-semibold hover:bg-gray-100 transition"
          >
            Back to Admin
          </button>
        </div>
      )}

      {/* ORIGINAL LAYOUT */}
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex-col md:flex-row">
        
        {/* DESKTOP SIDEBAR */}
        <div className="w-64 shrink-0 hidden md:block h-full border-r border-slate-200 dark:border-slate-800">
          <ClientSidebar />
        </div>

        {/* MOBILE DRAWER */}
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
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>
    </>
  );
}
