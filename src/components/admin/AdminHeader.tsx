'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminHeader() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase.from('admins').select('*').eq('email', user.email).single();
        setProfile(data || { name: 'Admin', email: user.email, role: 'UNKNOWN' });
        // Store role locally for other pages to use quickly
        if(data) localStorage.setItem('admin_role', data.role);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
    toast.success("Logged out");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="font-bold text-slate-700">Admin Console</div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-500"/>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{profile?.name || 'Loading...'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{profile?.role || '...'}</p>
           </div>
           <Avatar>
             <AvatarFallback className="bg-slate-900 text-white font-bold">
                {profile?.name?.charAt(0) || 'A'}
             </AvatarFallback>
           </Avatar>
           <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50">
             <LogOut className="w-5 h-5"/>
           </Button>
        </div>
      </div>
    </header>
  );
}