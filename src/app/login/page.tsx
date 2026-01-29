'use client';

import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  
  const [rememberMe, setRememberMe] = useState(false);  

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setFormData((p) => ({ ...p, email: savedEmail }));
    }
  }, []);

  /* ================= AUTH LOGIC ================= */

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Removed password clear logic to preserve password in input fields as per attributes request
        // setFormData((p) => ({ ...p, password: '' }));

        if (
          formData.email === 'admin@saanify.com' &&
          error.message.includes('Invalid')
        ) {
          await createSuperAdmin();
          return;
        }
        throw error;
      }

      if (data.user) {
        if (rememberMe) {
          localStorage.setItem('remember_email', formData.email);
        } else {
          localStorage.removeItem('remember_email');
        }
        
        await checkRoleAndRedirect(data.user.id);
      }
    } catch {
      toast.error('Access Denied', {
        description: 'Invalid credentials or account inactive.',
      });
      setLoading(false);
    }
  };

  // ✅ UPDATED: Role Redirection with CASE INSENSITIVE CHECK
  const checkRoleAndRedirect = async (userId: string) => {
    try {
      // 1. Check Admin
      const { data: admin } = await supabase.from('admins').select('*').eq('id', userId).maybeSingle();
      if (admin) {
        localStorage.setItem('admin_session', 'true');
        router.push('/admin');
        return;
      }

      // 2. Check Client (Owner or Treasurer)
      const { data: client } = await supabase.from('clients').select('*').eq('id', userId).maybeSingle();
      
      if (client) {
        // 🔥 FIX 1: Convert status to Uppercase before checking
        const currentStatus = (client.status || '').toUpperCase();

        if (currentStatus !== 'ACTIVE') {
          toast.error('Account Locked', {
            description: 'Your account is locked, blocked, or expired.',
          });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // --- 🛡️ TREASURER GUARD LOGIC ---
        if (client.role === 'treasurer' && client.client_id) {
            const { data: bossClient } = await supabase
                .from('clients')
                .select('status')
                .eq('id', client.client_id)
                .single();
            
            // 🔥 FIX 2: Check Boss status case-insensitively too
            if (bossClient) {
                const bossStatus = (bossClient.status || '').toUpperCase();
                
                if (bossStatus !== 'ACTIVE') {
                    toast.error('Organization Locked', {
                        description: 'The main organization account is locked/expired. Access denied.',
                    });
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }
            }
        }
        // ---------------------------------

        localStorage.setItem('current_user', JSON.stringify(client));
        router.push('/dashboard');
        return;
      }

      // 3. Check Member (End User)
      const { data: member } = await supabase.from('members').select('*').eq('auth_user_id', userId).maybeSingle();

      if (member) {
        // 🔥 FIX 3: Member status check (Case Insensitive)
        const memberStatus = (member.status || '').toUpperCase();
        
        if (memberStatus !== 'ACTIVE') {
          toast.error('Access Denied', {
            description: 'Your account has been blocked by administrator.',
          });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Check if Parent Client is Locked
        const { data: parentClient } = await supabase.from('clients').select('status').eq('id', member.client_id).single();
        
        if(parentClient) {
            const parentStatus = (parentClient.status || '').toUpperCase();
            if(parentStatus !== 'ACTIVE') {
                toast.error('Organization Suspended', { description: 'Contact admin.' });
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }
        }

        localStorage.setItem('current_member', JSON.stringify(member));

        if (member.role === 'treasurer') {
            toast.success("Welcome Treasurer");
            router.push('/dashboard'); 
        } else {
            toast.success("Welcome Member");
            router.push('/member-portal/dashboard');
        }
        return;
      }

      throw new Error("No profile found");
    } catch (e) {
      toast.error('Login Failed', {
        description: 'Profile not linked or missing.',
      });
      setLoading(false);
    }
  };

  // Forgot Password Logic
  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Email Required', { description: 'Please enter your email.' });
      return;
    }
    setResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      toast.success('Password reset link sent', { description: 'Check your email inbox.' });
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setResetLoading(false);
    }
  };

  const createSuperAdmin = async () => {
    const { data } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    if (data.user) {
      await supabase
        .from('admins')
        .upsert([{ id: data.user.id, email: formData.email }]);
      router.push('/admin');
    }
  };

  /* ================= UI START (UNCHANGED) ================= */

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 overflow-hidden">

      {/* LEFT HERO */}
      <div className="hidden lg:flex relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          <div className="flex items-center gap-3 mb-12 group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Building2 className="text-blue-400 w-6 h-6" />
            </div>
            <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Saanify
            </span>
          </div>

          <div className="max-w-lg space-y-8">
            <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tight">
              Smart Society <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Finance.
              </span>
            </h1>
            <p className="text-slate-300 text-xl leading-relaxed font-light">
              Manage deposits, loans, and compliance with an architecture built for modern societies.
            </p>
            <div className="pt-6 space-y-5">
              {['Bank-grade AES-256 Encryption', 'Real-time Audit Trails', 'Automated GST Compliance'].map((t) => (
                <div key={t} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="text-emerald-400 w-4 h-4" />
                  </div>
                  <span className="text-slate-200 font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN */}
      <div className="flex items-center justify-center p-6 lg:p-12 relative bg-slate-50">
        <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <Card className="w-full max-w-[440px] bg-white/80 backdrop-blur-xl border-slate-200 shadow-2xl shadow-blue-900/5 relative z-10 rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

          <CardContent className="p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-2 border border-blue-100 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 mt-2">Enter your credentials to access your workspace.</p>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2.5">
                <Label className="text-slate-700 font-semibold text-sm px-1">Email Address</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input 
                    className="pl-11 h-11 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 rounded-xl" 
                    placeholder="name@society.com" 
                    type="email" 
                    autoComplete="email"
                    name="email"
                    id="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-slate-700 font-semibold text-sm">Password</Label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    className="pl-11 pr-11 h-11 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 rounded-xl" 
                    placeholder="•••••" 
                    autoComplete="current-password"
                    name="password"
                    id="password"
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* CHANGE 2: Remember Me Checkbox */}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]">
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</> : 'Sign In'}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
              <button onClick={handleForgotPassword} disabled={resetLoading} className="text-slate-600 hover:text-blue-600 font-medium transition-colors disabled:opacity-50">
                {resetLoading ? 'Sending link...' : 'Forgot password?'}
              </button>
              
              {/* CHANGE 3: Contact Support Redirect Fix */}
              <span
                onClick={() => router.push('/support')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                Contact Support
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Secured by 256-bit SSL Encryption</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
