'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/layout/ClientSidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Session Check
    const storedUser = localStorage.getItem('current_user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR - Fixed */}
      <div className="w-64 shrink-0 hidden md:block h-full">
        <ClientSidebar />
      </div>

      {/* CONTENT - Scrollable */}
      <main className="flex-1 overflow-y-auto h-full">
         {children}
      </main>
    </div>
  );
}