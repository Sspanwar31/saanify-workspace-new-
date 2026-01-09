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
  const [allowedItems, setAllowedItems] = useState<any[]>([]); // Dynamic Menu

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
          // Note: Mapping key names to Permission Strings
          // Aapko ensure karna hoga ki Database me stored keys aur yahan 'perm' keys match karein
          // Example: 'View Dashboard' vs 'VIEW_DASHBOARD'
          
          // Simple Hack: Agar DB me 'View Dashboard' hai, to hum usse match karenge
          const perms = data?.role_permissions?.['treasurer'] || [];
          
          // Map DB string to Key
          // (Aapke RolesPermissionsTab me Strings use ho rahi hain jaise 'View Dashboard')
          // Hum navItems me bhi wahi string use karenge

          const filtered = navItems.filter(item => {
             // Mapping logic: Item Label aur Permission Name match hona chahiye
             // Ya fir ek mapping object banayein
             // Simple approach: Assume perm key is stored as readable string in DB
             
             // Mapping Table based on your provided code:
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
        {/* LOGO */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="h-9 w-9 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
             S
          </div>
          <div>
             <h1 className="font-bold text-lg text-slate-900 tracking-tight">Saanify V2</h1>
             <p className="text-[10px] text-slate-500 font-medium">
                {userRole === 'treasurer' ? 'Treasurer Panel' : 'Society Manager'}
             </p>
          </div>
        </div>
        
        {/* MENU */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-orange-50 text-orange-700 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100">
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-3"
            >
              <LogOut className="h-4 w-4" /> 
              <span className="font-medium">Logout</span>
            </Button>
        </div>
    </aside>
  );
}
