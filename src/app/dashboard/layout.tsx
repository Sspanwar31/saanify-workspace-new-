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

        const { data: client, error } = await supabase
          .from('clients')
          .select('plan_end_date, subscription_status')
          .eq('id', resolvedClientId)
          .single();

        if (error) {
          // If fetch fails, we allow access safely to avoid lockout
          setIsAuthorized(true);
          setIsChecking(false);
          return;
        }

        if (client) {
          const expiry = new Date(client.plan_end_date || new Date());
          const today = new Date();
          const isExpired = today > expiry;
          const isInactive = client.subscription_status !== 'active';

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
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="w-64 shrink-0 hidden md:block h-full">
        <ClientSidebar />
      </div>
      <main className="flex-1 overflow-y-auto h-full">
        {children}
      </main>
    </div>
  );
}
