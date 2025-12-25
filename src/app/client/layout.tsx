'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/client/Sidebar';
import { useClientStore } from '@/lib/client/store';
import { Toaster } from "@/components/ui/sonner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, currentUser, checkSubscriptionStatus } = useClientStore();
  const [isMounted, setIsMounted] = useState(false);

  // 1. Wait for Mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Auth Check (ONLY after mount)
  useEffect(() => {
    if (isMounted) {
      console.log("🛡️ Auth Check:", isLoggedIn, currentUser?.email);
      
      if (!isLoggedIn) {
        // Only redirect if explicitly logged out
        router.replace('/login');
      } else {
        // Run checks if logged in
        checkSubscriptionStatus();
      }
    }
  }, [isMounted, isLoggedIn, router]);

  // 3. Prevent Flash of Content / Early Redirect
  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // 4. If loaded but not logged in, return null (wait for redirect)
  if (!isLoggedIn) return null;

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r bg-white dark:bg-gray-950 hidden md:block z-50 h-full">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto relative h-full">
        <div className="p-8">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}