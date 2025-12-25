'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, CreditCard, BarChart2, Activity, 
  PieChart, Zap, Settings, LogOut, Shield, Crown 
} from 'lucide-react';

export default function OldAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems = [
    { label: 'Overview', href: '/old-admin/dashboard', icon: LayoutDashboard },
    { label: 'Client Management', href: '/old-admin/clients', icon: Users },
    { label: 'Subscription & Billing', href: '/old-admin/billing', icon: CreditCard },
    { label: 'Analytics', href: '/old-admin/analytics', icon: BarChart2 },
    { label: 'Activity Monitor', href: '/old-admin/activity', icon: Activity },
    { label: 'Data Visualization', href: '/old-admin/data', icon: PieChart },
    { label: 'Automation', href: '/old-admin/automation', icon: Zap },
    { label: 'System Settings', href: '/old-admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0f111a] text-white overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#16192c] border-r border-white/5 flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
             <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
             <h1 className="font-bold text-xl tracking-tight text-white">Saanify <span className="text-cyan-400">Stallone</span></h1>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">Complete Control</p>
          </div>
        </div>

        <div className="px-4 mb-2">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 flex items-center gap-3 shadow-lg">
             <Shield className="h-5 w-5 text-white" />
             <span className="text-sm font-bold">Super Admin</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group
              ${pathname === item.href ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'}`} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-all">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
        <div className="p-8 relative z-10">
           {children}
        </div>
      </main>
    </div>
  );
}