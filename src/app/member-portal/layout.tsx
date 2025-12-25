'use client';

import { Home, BookOpen, CreditCard, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClientStore } from '@/lib/client/store';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useClientStore();

  const navItems = [
    { label: 'Home', icon: Home, href: '/member-portal/dashboard' },
    { label: 'Passbook', icon: BookOpen, href: '/member-portal/passbook' },
    { label: 'Loans', icon: CreditCard, href: '/member-portal/loans' },
    { label: 'Profile', icon: User, href: '/member-portal/profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      {/* Top Header */}
      <div className="bg-white px-6 py-4 shadow-sm z-10 flex justify-between items-center sticky top-0">
        <div>
           <h1 className="text-lg font-bold text-gray-800">Saanify</h1>
           <p className="text-xs text-gray-500">Member Portal</p>
        </div>
        <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold">
           {currentUser?.name?.charAt(0)}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-24 p-4 space-y-4">
        {children}
      </main>

      {/* Bottom Navigation (App Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 pb-5 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
              <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-orange-50' : 'bg-transparent'}`}>
                 <item.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-orange-600 fill-orange-600/20' : 'text-gray-400 group-hover:text-gray-600'}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}