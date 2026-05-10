'use client';

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

export default function ClientSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ NEW CODE APPLIED (UseMemo hata karke direct assignment)
  const user = profile;

  const userRole = user?.role || 'client';
  
  // ✅ SAFE ARRAY CHECK
  const permissions = Array.isArray(
    user?.role_permissions?.treasurer
  ) 
    ? user.role_permissions.treasurer
    : [];

  const handleLogout = async () => {
    localStorage.clear();
    document.cookie = "impersonation_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    await supabase.auth.signOut();
    window.location.href = '/login'; // ✅ CHANGE 2: Smooth redirect
    toast.success("Logged out");
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm">
        {/* HEADER: Hamesha dikhega */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">S</div>
          <div>
             <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Saanify V2</h1>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {userRole === 'treasurer' ? 'Treasurer Panel' : 'Society Manager'}
             </p>
          </div>
        </div>
        
        {/* MENU: Ab bina kisi delay ke dikhega */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const hasAccess = userRole !== 'treasurer' || item.perm === 'ALWAYS' || permissions.includes(item.perm);
            const isForbiddenForStaff = item.ownerOnly && userRole === 'treasurer';

            if (!hasAccess || isForbiddenForStaff) return null;

            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                prefetch={false} // ✅ CHANGE 1: Prefetch Disabled
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-orange-500 text-white shadow-md font-semibold' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER: Hamesha dikhega */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50 gap-3">
              <LogOut className="h-4 w-4" /> 
              <span className="font-medium">Logout</span>
            </Button>
        </div>
    </aside>
  );
}
