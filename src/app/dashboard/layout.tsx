'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { supabase } from '@/lib/supabase-simple';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
        // 1. Check Session (Basic)
        const storedUser = localStorage.getItem('current_user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        // 2. Check Subscription Status from Supabase
        const { data: clients } = await supabase.from('clients').select('plan_end_date, subscription_status').limit(1);
        
        if (clients && clients.length > 0) {
            const client = clients[0];
            const expiry = new Date(client.plan_end_date || new Date());
            const today = new Date();

            const isExpired = today > expiry;
            const isInactive = client.subscription_status !== 'active';

            // Guard Logic: If expired AND not on subscription page -> Redirect
            if ((isExpired || isInactive) && pathname !== '/dashboard/subscription') {
                router.push('/dashboard/subscription'); // Force Redirect
            } else {
                setIsAuthorized(true);
            }
        } else {
             // Fallback if no client found (New user case)
             setIsAuthorized(true);
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR - Always visible so user can go to subscription page */}
      <div className="w-64 shrink-0 hidden md:block h-full">
        <ClientSidebar />
      </div>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto h-full">
         {children}
      </main>
    </div>
  );
}
