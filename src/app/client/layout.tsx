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

  // 1️⃣ Wait for Mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2️⃣ Auth + Session Fix (ONLY after mount)
  useEffect(() => {
    if (!isMounted) return;

    const storedUser = localStorage.getItem('current_user');
    const storedMember = localStorage.getItem('current_member');

    console.log("🛡️ Auth Check:", {
      isLoggedIn,
      storedUser: storedUser ? 'Exists' : 'Null',
      storedMember: storedMember ? 'Exists' : 'Null'
    });

    // 🔴 Not logged in → redirect
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    // ✅ FIX: Client admin ke liye virtual member context
    if (storedUser && (!storedMember || storedMember === 'Null')) {
      try {
        const user = JSON.parse(storedUser);

        const virtualMember = {
          id: user.id,
          name: user.name || 'Admin',
          role: 'client_admin',
          client_id: user.id
        };

        localStorage.setItem(
          'current_member',
          JSON.stringify(virtualMember)
        );

        console.log('🧩 Virtual Member Injected for Client Admin');
      } catch (err) {
        console.error('Virtual member inject failed:', err);
      }
    }

    // ✅ Subscription check
    checkSubscriptionStatus();

  }, [isMounted, isLoggedIn, router]);

  // 3️⃣ Prevent Flash of Content
  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // 4️⃣ Logged out state (wait for redirect)
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
