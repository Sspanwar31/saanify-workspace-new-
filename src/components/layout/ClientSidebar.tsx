'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, BookOpen, CreditCard, TrendingUp, 
  Wallet, FileText, Settings, LogOut, ShieldCheck,
  UserCog, Crown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// 🚀 EXACT MATCH: Database mein jo strings hain, wahi yahan honi chahiye
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: 'ALWAYS' },
  { label: 'Members', href: '/dashboard/members', icon: Users, perm: 'View Members' },
  { label: 'Passbook', href: '/dashboard/passbook', icon: BookOpen, perm: 'View Passbook' },
  { label: 'Loans', href: '/dashboard/loans', icon: CreditCard, perm: 'View Loans' },
  { label: 'Maturity', href: '/dashboard/maturity', icon: TrendingUp, perm: 'View Dashboard' },
  { label: 'Admin Fund', href: '/dashboard/admin-fund', icon: ShieldCheck, perm: 'Manage Admin Fund' },
  { label: 'Expenses', href: '/dashboard/expenses', icon: Wallet, perm: 'Manage Expenses' },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText, perm: 'View Reports' },
  { label: 'User Management', href: '/dashboard/user-management', icon: UserCog, perm: 'User Management Access' },
  { label: 'Subscription', href: '/dashboard/subscription', icon: Crown, ownerOnly: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, ownerOnly: true },
];

export default function ClientSidebar({ profile }: { profile?: any }) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Layout se profile lo, warna localStorage fallback
  const user = profile || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('current_user') || '{}') : {});
  const userRole = user.role || 'client_admin';
  const permissions = user.role_permissions?.treasurer || [];

  const handleLogout = async () => {
    localStorage.clear();
    document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    await supabase.auth.signOut();
    router.push('/login');
    toast.success("Logged out");
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm">
        {/* LOGO */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">S</div>
          <div>
             <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Saanify V2</h1>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {userRole === 'treasurer' ? 'Treasurer Panel' : 'Society Manager'}
             </p>
          </div>
        </div>
        
        {/* MENU */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // ✅ ALWAYS = har role ko dikhega, ownerOnly = sirf owner ko
            const hasAccess = userRole !== 'treasurer' || item.perm === 'ALWAYS' || permissions.includes(item.perm);
            const isForbiddenForStaff = item.ownerOnly && userRole === 'treasurer';

            if (!hasAccess || isForbiddenForStaff) return null;

            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-3"
            >
              <LogOut className="h-4 w-4" /> 
              <span className="font-medium">Logout</span>
            </Button>
        </div>
    </aside>
  );
}
