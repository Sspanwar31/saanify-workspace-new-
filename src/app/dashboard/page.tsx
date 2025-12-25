'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Wallet, FileText, Settings, LogOut, 
  Bell, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // 1. SECURITY LOGIC
  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === 'ADMIN') { router.push('/admin'); return; }
      setUser(parsed);
    } catch (e) {
      localStorage.removeItem('current_user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    router.push('/login');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (!user) return null;

  // 2. THE PREMIUM UI
  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full inset-y-0 z-50">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">S</div>
              <span className="font-bold text-xl tracking-tight">Saanify</span>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
           {[
             { id: 'overview', label: 'Overview', icon: LayoutDashboard },
             { id: 'members', label: 'Members', icon: Users },
             { id: 'finances', label: 'Finances', icon: Wallet },
             { id: 'reports', label: 'Reports', icon: FileText },
             { id: 'settings', label: 'Settings', icon: Settings },
           ].map((item) => (
             <button 
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
                <item.icon className="w-5 h-5"/>
                <span className="font-medium">{item.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Your Plan</p>
              <div className="flex justify-between items-center mb-2">
                 <span className="font-bold text-white">{user.plan || 'BASIC'}</span>
                 <Badge variant="outline" className="text-green-400 border-green-900 bg-green-900/20 text-[10px]">Active</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs h-7 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">Upgrade</Button>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
           <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
           
           <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" className="text-slate-500 relative">
                 <Bell className="w-5 h-5"/>
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogout}>
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-700 leading-none">{user.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{user.society_name}</p>
                 </div>
                 <Avatar className="h-9 w-9 border-2 border-white shadow-sm group-hover:border-blue-200 transition-colors">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                       {user.name?.charAt(0)}
                    </AvatarFallback>
                 </Avatar>
              </div>
           </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="p-8 space-y-8">
           
           {/* Stats Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Members</CardTitle>
                    <Users className="w-4 h-4 text-blue-600"/>
                 </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold text-slate-900">0</div>
                    <p className="text-xs text-slate-500 mt-1">Active residents</p>
                 </CardContent>
              </Card>
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Collection</CardTitle>
                    <Wallet className="w-4 h-4 text-green-600"/>
                 </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold text-slate-900">₹0.00</div>
                    <p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-1"/> +0% this month</p>
                 </CardContent>
              </Card>
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Pending Dues</CardTitle>
                    <ArrowDownLeft className="w-4 h-4 text-red-600"/>
                 </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold text-slate-900">₹0.00</div>
                    <p className="text-xs text-slate-500 mt-1">From 0 members</p>
                 </CardContent>
              </Card>
           </div>

           {/* Content Placeholder */}
           <Card className="border-0 shadow-sm ring-1 ring-slate-200 min-h-[400px]">
              <CardHeader>
                 <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <LayoutDashboard className="w-8 h-8 text-slate-400"/>
                 </div>
                 <h3 className="font-bold text-slate-900">No Activity Yet</h3>
                 <p className="text-slate-500 text-sm max-w-sm mt-2">
                    Once you start adding members and recording transactions, your dashboard will come to life.
                 </p>
                 <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Add First Member</Button>
              </CardContent>
           </Card>

        </div>
      </div>
    </div>
  );
}