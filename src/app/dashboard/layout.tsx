'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Updated import
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
        // 1. Check User (Client Admin OR Treasurer)
        const storedUser = localStorage.getItem('current_user');
        const storedMember = localStorage.getItem('current_member');

        // ✅ NEW: Agar Treasurer hai, to allow karo
        if (storedMember) {
            const member = JSON.parse(storedMember);
            if (member.role === 'treasurer') {
                setIsAuthorized(true);
                setIsChecking(false);
                return; // Treasurer ko subscription check ki zaroorat nahi (Owner handle karega)
            } else {
                // Agar normal Member dashboard kholne ki koshish kare
                router.push('/member-portal/dashboard');
                return;
            }
        }

        // 2. Check Client Admin
        if (!storedUser) {
            router.push('/login');
            return;
        }

        // 3. Subscription Check (Sirf Owner ke liye)
        const user = JSON.parse(storedUser);
        const { data: clients } = await supabase.from('clients').select('plan_end_date, subscription_status').eq('id', user.id).single();
        
        if (clients) {
            const expiry = new Date(clients.plan_end_date || new Date());
            const today = new Date();

            const isExpired = today > expiry;
            const isInactive = clients.subscription_status !== 'active';

            if ((isExpired || isInactive) && pathname !== '/dashboard/subscription') {
                router.push('/dashboard/subscription');
            } else {
                setIsAuthorized(true);
            }
        } else {
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
      <div className="w-64 shrink-0 hidden md:block h-full">
        <ClientSidebar />
      </div>
      <main className="flex-1 overflow-y-auto h-full">
         {children}
      </main>
    </div>
  );
}
