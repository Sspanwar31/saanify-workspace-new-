'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  /* ================= SESSION FIX ================= */

  useEffect(() => {
    const initSession = async () => {
      try {
        // 1️⃣ FIRST: check already active session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsSessionReady(true);
          return;
        }

        // 2️⃣ SECOND: NEW flow (?code=)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setIsSessionReady(true);
            return;
          }
        }

        // 3️⃣ THIRD: OLD flow (#access_token)
        if (window.location.hash.includes('access_token')) {
          // Supabase auto-consumes hash tokens internally
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock />
          </div>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>Enter your new secure password.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isSessionReady || loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : 'Update Password'}
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
