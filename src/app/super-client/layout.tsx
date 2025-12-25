'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/super-client/Sidebar'; // Ensure this path is correct
import { useSuperClientStore } from '@/lib/super-client/store'; // Ensure this path is correct
import { Toaster } from "@/components/ui/sonner"; // Or your toast component

export default function SuperClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { checkSubscriptionStatus, subscription } = useSuperClientStore();
  const [isMounted, setIsMounted] = useState(false);

  // 1. Hydration Fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Subscription Gatekeeper Logic
  useEffect(() => {
    if (isMounted) {
      const status = checkSubscriptionStatus(); // Run check
      // If Expired and NOT on subscription page, Redirect
      if (status.status === 'EXPIRED' && pathname !== '/super-client/subscription') {
        router.replace('/super-client/subscription');
      }
    }
  }, [isMounted, pathname, checkSubscriptionStatus, router]);

  if (!isMounted) return null; // Prevent mismatch

  return (
    <div className="flex h-screen w-full bg-orange-50/20 overflow-hidden">
      {/* SIDEBAR - FIXED LEFT */}
      <aside className="w-64 flex-shrink-0 border-r border-orange-200 bg-white/95 hidden md:block z-50">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT - SCROLLABLE RIGHT */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8">
          {children}
        </div>
      </main>
      
      <Toaster />
    </div>
  );
}