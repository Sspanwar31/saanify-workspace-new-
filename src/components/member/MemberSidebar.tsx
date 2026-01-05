'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, CreditCard, Settings, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function MemberSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/member-portal/dashboard' },
    { name: 'Passbook', icon: BookOpen, path: '/member-portal/passbook' },
    { name: 'My Loans', icon: CreditCard, path: '/member-portal/loans' },
    { name: 'Settings', icon: Settings, path: '/member-portal/settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="w-64 h-screen bg-[#0B132B] text-white fixed left-0 top-0 flex flex-col shadow-xl z-50">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white tracking-wide">Saanify</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Member Portal</p>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-white/10 bg-[#0E1B3C]">
        <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5 mr-3" /> Logout
        </Button>
      </div>
    </div>
  );
}
