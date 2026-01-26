'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2,
  Lock, 
  Mail,
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Building2 
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
    const init = async () => {
      // 🔹 CHANGE 3: Page load par check karo
      const { data: user, error } = await supabase.auth.getUser();
      
      // ✅ AB CHANGE 3: Safe Check
      if (error) {
        console.log("🔐 User not logged in.");
        router.push('/login');
        return;
      }

      // ✅ CHANGE 1: Redirect if already logged in (Avoid loops)
      if (user) {
        await checkRoleAndRedirect(user.id);
      }
    };
    init();
  }, [router]);

  // ✅ CHANGE 2: Role Redirect Logic (Blocked Client + Treasurer Redirect)
  const checkRoleAndRedirect = async (userId: string) => {
    try {
      // 1. Check Admin
      const { data: admin } = await supabase.from('admins').select('*').eq('id', userId).maybeSingle();
      
      if (admin) {
        localStorage.setItem('admin_session', 'true');
        router.push('/admin');
        return;
      }

      // 2. Check Client (Safe Check + Blocked Status)
      const { data: client } = await supabase.from('clients').select('*').eq('id', userId).maybeSingle();

      // ✅ FIX: Blocked Client Logic
      if (client) {
        if (client.status !== 'ACTIVE') {
          toast.error('Account Locked', {
            description: 'Your account is locked or expired. Please contact support.',
          });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        localStorage.setItem('current_user', JSON.stringify(client));
        router.push('/dashboard');
        return;
      }

      // 3. Check Member (Treasurer Redirect)
      const { data: member } = await supabase.from('members').select('*').eq('auth_user_id', userId).maybeSingle();

      if (member) {
        localStorage.setItem('current_member', JSON.stringify(member));

        // ✅ CHANGE 3: Treasurer / Member Logic
        if (member.status !== 'ACTIVE') {
            toast.error('Access Disabled', {
              description: 'Your access has been disabled by admin.',
            });
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        if (member.role === 'treasurer') {
            router.push('/dashboard');
        } else {
            router.push('/member-portal/dashboard');
        }
      }

      throw new Error('No profile found.');
    } catch (e) {
      console.error('Auth Error:', e);
      setLoading(false);
      toast.error('Login Failed', {
        description: 'Invalid credentials or account inactive.',
      });
    }
  };

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
        // Super Admin Backdoor (Test Only)
        if (formData.email === 'admin@societyify.com' && formData.password === 'admin123') {
          await createSuperAdmin();
          return;
        }

        toast.error('Access Denied', {
          description: 'Invalid credentials or account inactive.',
        });
        setLoading(false);
        return;
      }

      await checkRoleAndRedirect(data.user.id);

    } catch (error: any) {
      toast.error('Access Denied', {
        description: 'Invalid credentials or account inactive.',
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
    await supabase
      .from('admins')
      .upsert([{ id: 'admin', email: 'admin@societyify.com' }]);
    router.push('/admin');
  };

  /* ================= UI START (UNCHANGED) ================= */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex items-center justify-center">
      
      {/* DECORATIVE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-multiply blur-[100px] opacity-40 rotate-12"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-multiply blur-[100px] opacity-30 -rotate-12"></div>
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-pink-500/20 rounded-full mix-blend-multiply blur-[100px] opacity-30 rotate-12"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full mix-blend-multiply blur-[100px] opacity-30 -rotate-12"></div>
        
        <div className="inset-0 bg-slate-900/80 backdrop-blur-md">
            <div className="relative z-10 w-full max-w-md p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center gap-3 justify-center">
                  <Building2 className="w-10 h-10 text-blue-500" />
                  <span className="text-3xl font-extrabold tracking-tight text-white">
                    Saanify
                  </span>
                </div>
                <p className="text-slate-400 font-light">
                  Manage your society finances securely.
                </p>
                
                <Card className="bg-white/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl w-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Enter your credentials to continue.
                      </p>
                      <form onSubmit={handleAuth} className="space-y-5">
                        
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-700 font-semibold text-left text-sm">Email Address</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 text-slate-400 group-focus:text-blue-500" />
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  autoComplete="email"
                                  required
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="pl-10 py-3 bg-slate-50/50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                                  placeholder="name@society.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-700 font-semibold text-left text-sm">Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 text-slate-400 group-focus:text-blue-500" />
                                <Input
                                  id="password"
                                  name="password"
                                  type={showPassword ? 'text' : 'password'}
                                  required
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  className="pl-10 py-3 bg-slate-50/50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                                  placeholder="•••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-slate-300"
                                >
                                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                              <Input
                                id="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 border-slate-300 rounded accent-blue-500 bg-transparent"
                              />
                              <Label htmlFor="remember-me" className="text-slate-600 dark:text-slate-400 select-none">Remember me</Label>
                          </div>
                          
                          <button 
                            onClick={handleForgotPassword} 
                            disabled={resetLoading}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
                          >
                            {resetLoading ? 'Sending...' : 'Forgot password?'}
                          </button>
                        </div>

                        {/* Submit Button */}
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 text-white font-semibold h-11 shadow-md hover:shadow-blue-500/50 transition-all duration-300 active:scale-[0.99] disabled:scale-100"
                        >
                          {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                            </>
                          ) : (
                            'Sign In'
                          )}
                        </Button>
                      </form>
                  </CardContent>
                </Card>

                {/* Terms of Service & Contact Support */}
                <div className="text-center text-xs text-slate-500">
                    <p className="text-center text-slate-400">
                        By clicking Sign In, you agree to our Terms of Service and Privacy Policy.
                    </p>
                    <div className="flex justify-center mt-2">
                        {/* 🔹 CHANGE 3: Contact Support (Broken Link Fix) */}
                        <span className="cursor-pointer hover:text-blue-600 dark:text-blue-400" onClick={() => router.push('/support')}>
                            Contact Support
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
