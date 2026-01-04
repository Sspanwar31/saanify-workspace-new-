'use client';

import { useState } from 'react';
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
  const [formData, setFormData] = useState({ email: '', password: '' });

  /* ================= AUTH LOGIC (UNCHANGED) ================= */

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
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
        await checkRoleAndRedirect(data.user.id);
      }
    } catch {
      toast.error('Access Denied', {
        description: 'Invalid credentials or account inactive.',
      });
      setLoading(false);
    }
  };

  const checkRoleAndRedirect = async (userId: string) => {
    try {
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .single();
      if (admin) {
        localStorage.setItem('admin_session', 'true');
        router.push('/admin');
        return;
      }

      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .single();
      if (client) {
        localStorage.setItem('current_user', JSON.stringify(client));
        router.push('/dashboard');
        return;
      }

      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (member) {
        localStorage.setItem('current_member', JSON.stringify(member));
        router.push(member.role === 'treasurer' ? '/treasurer' : '/member');
        return;
      }

      throw new Error();
    } catch {
      toast.error('Login Failed', {
        description: 'Profile not linked.',
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Email Required');
      return;
    }
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setResetLoading(false);
    toast.success('Password reset link sent');
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

  /* ================= UI START ================= */

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">

      {/* LEFT HERO (BALANCED) */}
      <div className="hidden lg:flex bg-gradient-to-br from-[#0B132B] via-[#0E1B3C] to-[#0B132B] px-16 py-20 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,134,255,0.12),transparent_45%)]" />

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Building2 className="text-blue-400" />
            </div>
            <span className="text-2xl font-bold">Saanify</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Smart Society <br />
            <span className="text-blue-400">Financial Management</span>
          </h1>

          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            Deposits, loans, expenses & compliance — all in one secure platform.
          </p>

          <div className="space-y-4">
            {[
              'Bank-grade Security & Encryption',
              'Trusted by 100+ Societies',
              'GST & Audit Ready',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400" />
                <span className="text-slate-200">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN (PRIMARY FOCUS) */}
      <div className="flex items-center justify-center px-8">
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/70 border border-slate-200 shadow-xl rounded-2xl">
          <CardContent className="p-8 space-y-6">

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
                <ShieldCheck className="w-4 h-4" /> Secure Access
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                Society Admin Login
              </h2>
              <p className="text-slate-500 mt-1">
                Access your financial dashboard securely
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    className="pl-10 h-12 bg-slate-50"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10 h-12 bg-slate-50"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-slate-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg"
              >
                {loading && <Loader2 className="mr-2 animate-spin" />}
                Secure Login
              </Button>
            </form>

            <div className="flex justify-between text-sm">
              <button
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-blue-600 font-medium"
              >
                Forgot password?
              </button>
              <span className="text-slate-500">Contact Support</span>
            </div>

            <div className="text-xs text-center text-slate-400 pt-4 border-t">
              🔐 256-bit Encryption • RBI Compliant
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
