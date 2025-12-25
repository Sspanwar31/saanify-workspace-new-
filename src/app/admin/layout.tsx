'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, CreditCard, BarChart2, Activity, 
  PieChart, Zap, Settings, LogOut, Shield 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Client Management', href: '/admin/clients', icon: Users },
  { label: 'Subscription & Billing', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 }, // Contains Data Viz now
  { label: 'Activity & Audit', href: '/admin/activity', icon: Shield }, // Renamed
  { label: 'Automation Center', href: '/admin/automation', icon: Zap }, // Renamed
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ADMIN SIDEBAR */}
      <aside className="w-64 bg-[#1a1f37] text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
             <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
             <h1 className="font-bold text-lg tracking-wide">Saanify</h1>
             <p className="text-[10px] text-gray-400 uppercase tracking-wider">Super Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-white/5">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-8 max-w-7xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
}