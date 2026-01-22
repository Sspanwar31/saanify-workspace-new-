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
import { supabase } from '@/lib/supabase'; // Import Supabase

// Map Menu Items to Permission Keys
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: 'VIEW_DASHBOARD' },
  { label: 'Members', href: '/dashboard/members', icon: Users, perm: 'VIEW_MEMBERS' },
  { label: 'Passbook', href: '/dashboard/passbook', icon: BookOpen, perm: 'VIEW_PASSBOOK' },
  { label: 'Loans', href: '/dashboard/loans', icon: CreditCard, perm: 'VIEW_LOANS' },
  { label: 'Maturity', href: '/dashboard/maturity', icon: TrendingUp, perm: 'VIEW_REPORTS' },
  { label: 'Admin Fund', href: '/dashboard/admin-fund', icon: ShieldCheck, perm: 'MANAGE_ADMIN_FUND' },
  { label: 'Expenses', href: '/dashboard/expenses', icon: Wallet, perm: 'MANAGE_EXPENSES' },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText, perm: 'VIEW_REPORTS' },
  { label: 'User Management', href: '/dashboard/user-management', icon: UserCog, perm: 'VIEW_USERS' },
  { label: 'Subscription', href: '/dashboard/subscription', icon: Crown, perm: 'MANAGE_SYSTEM' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, perm: 'VIEW_SETTINGS' },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState('client_admin');
  const [allowedItems, setAllowedItems] = useState<any[] | null>(null); // Dynamic Menu

  useEffect(() => {
    const checkPermissions = async () => {
      const stored = localStorage.getItem('current_user') || localStorage.getItem('current_member');
      if (!stored) return;

      const user = JSON.parse(stored);
      
      // 1. If Client Admin (Owner) -> Show All
      if (!user.role || user.role === 'client_admin') {
          setUserRole('client_admin');
          setAllowedItems(navItems);
          return;
      }

      // 2. If Treasurer -> Fetch Permissions from DB
      if (user.role === 'treasurer') {
          setUserRole('treasurer');
          const { data } = await supabase
              .from('clients')
              .select('role_permissions')
              .eq('id', user.client_id)
              .single();

          // Get Permissions Array
          const perms = data?.role_permissions?.['treasurer'] || [];
          
          if (!perms.length) {
            setAllowedItems(navItems);
            return;
          }
          
          // Map DB string to Key
          const map: any = {
             'VIEW_DASHBOARD': 'View Dashboard',
             'VIEW_MEMBERS': 'View Members',
             'VIEW_PASSBOOK': 'View Passbook',
             'VIEW_LOANS': 'View Loans',
             'VIEW_REPORTS': 'View Reports',
             'MANAGE_EXPENSES': 'Manage Expenses',
             'VIEW_USERS': 'User Management Access',
             'VIEW_SETTINGS': 'View Settings',
             'MANAGE_ADMIN_FUND': 'Manage Admin Fund',
             'MANAGE_SYSTEM': 'Manage System'
          };

          const filtered = navItems.filter(item => {
             const dbKey = map[item.perm];
             return perms.includes(dbKey);
          });
          
          setAllowedItems(filtered);
      }
    };

    checkPermissions();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    supabase.auth.signOut();
    router.push('/login');
    toast.success("Logged out");
  };

  return (
    // ✅ Updated: Dark Mode Classes Added
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm transition-colors duration-300">
        {/* LOGO */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
             S
          </div>
          <div>
             <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Saanify V2</h1>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {userRole === 'treasurer' ? 'Treasurer Panel' : 'Society Manager'}
             </p>
          </div>
        </div>
        
        {/* MENU */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {(allowedItems ?? navItems).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
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
