'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, CreditCard, BarChart2, 
  Shield, Zap, Settings, LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const navItems = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard }, // Fixed href (was /admin)
  { label: 'Client Management', href: '/admin/clients', icon: Users },
  { label: 'Subscription & Billing', href: '/admin/subscription', icon: CreditCard }, // Fixed href (singular)
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Activity & Audit', href: '/admin/activity', icon: Shield },
  { label: 'Automation Center', href: '/admin/automation', icon: Zap },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
    toast.success("Logged out");
  };

  return (
    <aside className="w-64 bg-[#1a1f37] text-white flex flex-col shadow-xl h-full">
        {/* LOGO AREA */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
             <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
             <h1 className="font-bold text-lg tracking-wide leading-tight">Saanify</h1>
             <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Super Admin</p>
          </div>
        </div>
        
        {/* MENU */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            // Check if current path starts with the href (for active state)
            // Special handling for dashboard root
            const isActive = item.href === '/admin/dashboard' 
               ? pathname === '/admin' || pathname === '/admin/dashboard'
               : pathname.startsWith(item.href);

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-[#15192b]">
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3"
            >
              <LogOut className="h-4 w-4" /> 
              <span className="font-medium">Logout</span>
            </Button>
        </div>
    </aside>
  );
}