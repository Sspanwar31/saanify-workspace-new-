'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  /* ================= SESSION FIX (UNCHANGED) ================= */

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsSessionReady(true);
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setIsSessionReady(true);
            return;
          }
        }

        if (window.location.hash.includes('access_token')) {
          setTimeout(async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              setIsSessionReady(true);
            } else {
              toast.error('Session expired. Please request a new link.');
            }
          }, 800);
          return;
        }

        toast.error('Invalid or expired reset link');
      } catch (err) {
        console.error(err);
        toast.error('Failed to establish secure session');
      }
    };

    initSession();
  }, []);

  /* ================= UPDATE PASSWORD ================= */

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSessionReady) {
      toast.error('Session not ready yet');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated successfully');
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4">
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/80 border border-slate-200 shadow-2xl rounded-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Building2 />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Saanify
            </span>
          </div>

          {/* Security Badge */}
          <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Secure Password Reset
          </div>

          <CardTitle className="text-2xl font-bold">
            Set New Password
          </CardTitle>
          <CardDescription>
            Create a strong password to secure your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {/* Password Field */}
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="pl-10 pr-10 h-12 bg-slate-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Minimum 6 characters
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!isSessionReady || loading}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Password
            </Button>

            {!isSessionReady && (
              <p className="text-xs text-center text-slate-400">
                Establishing secure connection...
              </p>
            )}

            <div className="text-xs text-center text-slate-400 pt-3 border-t">
              🔐 256-bit Encrypted • Trusted by Societies
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
