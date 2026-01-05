'use client';

import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  User,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClientStore } from '@/lib/client/store';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useClientStore();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/member-portal/dashboard' },
    { label: 'Passbook', icon: BookOpen, href: '/member-portal/passbook' },
    { label: 'Loans', icon: CreditCard, href: '/member-portal/loans' },
    { label: 'Profile', icon: User, href: '/member-portal/profile' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r">
        <div className="px-6 py-5 border-b">
          <h1 className="text-lg font-bold text-gray-800">Saanify</h1>
          <p className="text-xs text-gray-500">Member Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition
                  ${isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome, {currentUser?.name}
            </h2>
            <p className="text-xs text-gray-500">Your Account Overview</p>
          </div>

          <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
            {currentUser?.name?.charAt(0)}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
