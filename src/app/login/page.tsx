'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        // Auto-fix for Super Admin only (Dev purpose)
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
      toast.error("Access Denied", { description: "Invalid credentials. Please try again." });
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

        // C. Check Member / Treasurer
        const { data: member } = await supabase.from('members').select('*').eq('auth_user_id', userId).single();
        
        if (member) {
            localStorage.setItem('current_member', JSON.stringify(member));
            
            if (member.role === 'treasurer') {
                toast.success("Welcome Treasurer");
                router.push('/treasurer'); 
            } else {
                toast.success("Welcome Member");
                router.push('/member');
            }
            return;
        }

        throw new Error("No active profile found.");

    } catch (error: any) {
        toast.error("Login Error", { description: "User found but profile link is missing." });
        setLoading(false);
    }
  };

  const createSuperAdmin = async () => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* Background Elements for Premium Feel */}
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 skew-y-3 origin-top-left -translate-y-10 z-0"></div>
      
      <div className="z-10 w-full max-w-md px-4">
        
        {/* BRANDING HEADER */}
        <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 mb-4 shadow-lg border border-slate-200">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Saanify Access</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Smart Society Management System</p>
        </div>

        {/* LOGIN CARD */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
             <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-green-100">
                <Lock className="w-3 h-3" />
                <span className="font-semibold">Secure Login Environment</span>
             </div>
          </CardHeader>
          
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleAuth} className="space-y-5">
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                        type="email" 
                        placeholder="name@society.com" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required 
                    />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-slate-700 font-semibold">Password</Label>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
              </div>

              {/* Action Button */}
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-slate-900/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Secure Login'}
              </Button>

            </form>
          </CardContent>

          {/* Footer / Trust Indicators */}
          <CardFooter className="flex flex-col gap-4 bg-slate-50 border-t border-slate-100 py-6">
             <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                <span>256-bit SSL Encryption</span>
                <span className="text-slate-300">|</span>
                <span>ISO 27001 Compliant</span>
             </div>
             
             <div className="flex justify-between w-full text-sm mt-2">
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">Forgot password?</a>
                <a href="#" className="text-slate-500 hover:text-slate-700">Contact Support</a>
             </div>
          </CardFooter>
        </Card>

        {/* Footer Branding */}
        <p className="text-center text-slate-400 text-xs mt-8">
            &copy; {new Date().getFullYear()} Saanify Financial Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
