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

        // Case 1: Agar koi bhi login nahi hai -> Bhagao
        if (!storedUser && !storedMember) {
            router.push('/login');
            return;
        }

        // Case 2: Agar Treasurer hai -> Aane do
        if (storedMember) {
            const member = JSON.parse(storedMember);
            if (member.role === 'treasurer') {
                setIsAuthorized(true);
                setIsChecking(false);
                return; 
            } else {
                router.push('/member-portal/dashboard');
                return;
            }
        }

        // Case 3: Agar Client Admin hai -> Subscription Check karo
        if (storedUser) {
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
                 // New user without DB record yet
                 setIsAuthorized(true);
            }
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
