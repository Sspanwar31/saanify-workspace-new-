'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ClientSidebar from '@/components/layout/ClientSidebar'; // Treasurer uses same sidebar logic
import { Loader2 } from 'lucide-react';

export default function TreasurerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic Auth Check
    const checkUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
           router.push('/login');
       } else {
           setLoading(false);
       }
    };
    checkUser();
  }, [router]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="flex h-screen bg-slate-50">
       <ClientSidebar /> {/* Uses Dynamic Permissions */}
       
       <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold">Treasurer Dashboard</h1>
          <p className="text-gray-500">Welcome to the restricted financial panel.</p>
          
          {/* Yahan aap Dashboard Stats component reuse kar sakte hain */}
          {/* <DashboardStats /> */}
       </main>
    </div>
  );
}
