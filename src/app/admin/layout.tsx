'use client';
import { useState } from 'react'; // Menu open/close ke liye
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, CreditCard, BarChart2, 
  Zap, Settings, LogOut, Shield, Menu, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Client Management', href: '/admin/clients', icon: Users },
  { label: 'Subscription & Billing', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Activity & Audit', href: '/admin/activity', icon: Shield },
  { label: 'Automation Center', href: '/admin/automation', icon: Zap },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
             <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
             <h1 className="font-bold text-lg tracking-wide">Saanify</h1>
             <p className="text-[10px] text-gray-400 uppercase tracking-wider">Super Admin</p>
          </div>
        </div>
        {/* Mobile par Close Button */}
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400">
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setIsMobileMenuOpen(false)} // Click par menu close ho jaye
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
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-[#1a1f37] text-white flex-col shadow-xl">
        <SidebarContent />
      </aside>

      {/* 2. MOBILE SIDEBAR (Drawer Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop/Dark Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Drawer */}
          <aside className="relative w-72 h-full bg-[#1a1f37] text-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* MOBILE HEADER (Only shows on mobile) */}
        <header className="md:hidden h-16 bg-[#1a1f37] text-white flex items-center justify-between px-4 shadow-md">
           <div className="flex items-center gap-2">
             <Shield className="h-6 w-6 text-blue-400" />
             <span className="font-bold tracking-tight">Saanify</span>
           </div>
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 hover:bg-white/10 rounded-lg transition-colors"
           >
             <Menu className="h-6 w-6" />
           </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {/* Mobile par padding kam, Desktop par zyada */}
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
