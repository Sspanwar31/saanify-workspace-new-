'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isSessionReady, setIsSessionReady] = useState(false);

  /* ================= FIXED SESSION HANDLING ================= */

  useEffect(() => {
    const initRecoverySession = async () => {
      try {
        // ✅ 1. URL se code nikalo (mobile-safe)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) {
          toast.error('Invalid or expired reset link');
          return;
        }

        // ✅ 2. Supabase ko bol do: is code se session banao
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error(error);
          toast.error('Session expired. Please request a new link.');
          return;
        }

        // ✅ 3. Session ready
        setIsSessionReady(true);
      } catch (err) {
        console.error(err);
        toast.error('Something went wrong. Please try again.');
      }
    };

    initRecoverySession();
  }, []);

  /* ================= UPDATE PASSWORD ================= */

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSessionReady) {
      toast.error('Session not ready. Please wait.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast.success('Password updated successfully');

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error('Error updating password', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Set New Password
          </CardTitle>
          <CardDescription>
            Enter your new secure password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 h-11"
              disabled={loading || !isSessionReady}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Update Password'
              )}
            </Button>

            {!isSessionReady && (
              <p className="text-xs text-center text-gray-400">
                Establishing secure connection...
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
