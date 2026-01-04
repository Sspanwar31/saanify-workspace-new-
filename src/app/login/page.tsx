'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Attempt Login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (loginError) {
        // Auto-fix for Super Admin only
        if (formData.email === 'admin@saanify.com' && loginError.message.includes("Invalid")) {
            await createSuperAdmin();
            return;
        }
        throw loginError;
      }

      // 2. Check Role & Redirect
      if (loginData.user) {
        await checkRoleAndRedirect(loginData.user.id);
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed");
      setLoading(false);
    }
  };

  const checkRoleAndRedirect = async (userId: string) => {
    try {
        // A. Check Super Admin
        const { data: admin } = await supabase.from('admins').select('*').eq('id', userId).single();
        if (admin) {
            localStorage.setItem('admin_session', 'true');
            toast.success("Welcome Super Admin");
            router.push('/admin');
            return;
        }

        // B. Check Client (Society Owner)
        const { data: client } = await supabase.from('clients').select('*').eq('id', userId).single();
        if (client) {
            localStorage.setItem('current_user', JSON.stringify(client));
            toast.success(`Welcome ${client.society_name || 'Admin'}`);
            router.push('/dashboard');
            return;
        }

        // C. Check Member / Treasurer (Using Members Table)
        const { data: member } = await supabase.from('members').select('*').eq('auth_user_id', userId).single();
        
        if (member) {
            localStorage.setItem('current_member', JSON.stringify(member));
            
            if (member.role === 'treasurer') {
                toast.success("Welcome Treasurer");
                router.push('/treasurer'); // Treasurer Panel
            } else {
                toast.success("Welcome Member");
                router.push('/member'); // Member App View
            }
            return;
        }

        throw new Error("No profile found for this user.");

    } catch (error: any) {
        console.error("Role check failed:", error);
        toast.error("User found but profile missing.");
        setLoading(false);
    }
  };

  const createSuperAdmin = async () => {
    // Only for initializing system
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    });
    
    if (data.user) {
      await supabase.from('admins').upsert([{ id: data.user.id, email: formData.email, role: 'ADMIN' }]);
      router.push('/admin');
    } else {
        toast.error("Setup failed: " + error?.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
             <UserCheck className="w-6 h-6"/>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Saanify Login
          </CardTitle>
          <CardDescription>
            Society Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
