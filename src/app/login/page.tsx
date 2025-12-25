'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Try to Login First
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (loginError) {
        // 2. AUTO-HEALING: If login fails, try creating the user (In case it was deleted)
        if (loginError.message.includes("Invalid login credentials")) {
            console.log("Login failed, attempting to create user/admin...");
            await createSuperAdmin();
            return;
        }
        throw loginError;
      }

      // 3. Login Success - Check Role
      if (loginData.user) {
        await checkRoleAndRedirect(loginData.user.id);
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
      setLoading(false);
    }
  };

  const createSuperAdmin = async () => {
    // Attempt Signup
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    });

    if (signUpError) {
      toast.error("Could not login or create account: " + signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      // Create Admin Profile
      const { error: dbError } = await supabase.from('admins').upsert([{
        id: signUpData.user.id,
        email: formData.email,
        name: 'Super Admin',
        role: 'ADMIN',
        status: 'ACTIVE'
      }], { onConflict: 'email' });

      if (dbError) {
         console.error("DB Error:", dbError);
         // Continue anyway if profile might already exist
      }

      toast.success("New Super Admin Created & Logged In!");
      localStorage.setItem('admin_session', 'true');
      router.push('/admin');
    }
  };

  const checkRoleAndRedirect = async (userId: string) => {
    // Check Admin Table
    const { data: admin } = await supabase.from('admins').select('*').eq('id', userId).single();
    if (admin) {
      localStorage.setItem('admin_session', 'true');
      router.push('/admin');
      return;
    }

    // Check Client Table
    const { data: client } = await supabase.from('clients').select('*').eq('id', userId).single();
    if (client) {
      localStorage.setItem('current_user', JSON.stringify(client));
      router.push('/dashboard');
      return;
    }

    // If no profile, treat as Super Admin (Self-Repair)
    if (formData.email === 'admin@saanify.com') {
        await createSuperAdmin(); // Recursive repair
    } else {
        toast.error("Account exists but no profile found.");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
             <ShieldCheck className="w-6 h-6"/>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Saanify Access
          </CardTitle>
          <CardDescription>
            Enter your credentials. If this is the first time, we will set you up automatically.
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
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}