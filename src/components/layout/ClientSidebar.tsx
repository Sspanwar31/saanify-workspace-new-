'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, BookOpen, CreditCard, TrendingUp, 
  Wallet, Receipt, FileText, Settings, LogOut, ShieldCheck,
  UserCog, Crown // ✅ New Icons Added
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Members', href: '/dashboard/members', icon: Users },
  { label: 'Passbook', href: '/dashboard/passbook', icon: BookOpen },
  { label: 'Loans', href: '/dashboard/loans', icon: CreditCard },
  { label: 'Maturity', href: '/dashboard/maturity', icon: TrendingUp },
  { label: 'Admin Fund', href: '/dashboard/admin-fund', icon: ShieldCheck },
  { label: 'Expenses', href: '/dashboard/expenses', icon: Wallet },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
  
  // ✅ New Sections Added Here
  { label: 'User Management', href: '/dashboard/user-management', icon: UserCog },
  { label: 'Subscription', href: '/dashboard/subscription', icon: Crown },

  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('current_user');
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
             <p className="text-[10px] text-slate-500 font-medium">Society Manager</p>
          </div>
        </div>
        
        {/* MENU */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
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
