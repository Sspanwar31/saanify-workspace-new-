'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Settings, Menu } from 'lucide-react';

export default function MobileBottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients', href: '/dashboard/clients', icon: Users },
    { label: 'Billing', href: '/dashboard/subscription', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 z-[100] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[64px]">
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500'}`}>
                <item.icon size={22} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Menu button for everything else */}
        <button onClick={onMenuClick} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-500">
           <div className="p-1.5"><Menu size={22} /></div>
           <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </div>
  );
}
