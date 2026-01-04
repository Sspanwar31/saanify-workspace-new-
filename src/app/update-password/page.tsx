'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // 1. Check if Supabase handles the recovery link
    const setupSession = async () => {
      // Listen for the Password Recovery Event
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth Event:", event);
        
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setIsSessionReady(true); // ✅ Session Mil gaya, ab password update kar sakte hain
        }
      });

      // Manual check: Agar event miss ho gaya lekin session set ho chuka hai
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsSessionReady(true);
      } else {
        // Agar URL me token hai par session nahi bana, to thoda wait karte hain
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) {
             // Agar token hi nahi hai URL me
             // toast.error("Invalid Link"); // User ko darana nahi hai abhi
        }
      }

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    setupSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isSessionReady) {
        toast.error("Session not ready. Please refresh the page.");
        setLoading(false);
        return;
    }

    try {
      // 2. Update Password Logic
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success("Password Updated Successfully!");
      
      // Logout karke Login page par bhejein (Security best practice)
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
             <Lock className="w-6 h-6"/>
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
              disabled={loading || !isSessionReady} // 🔒 Button tab tak disable rahega jab tak session na mile
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
            </Button>

            {!isSessionReady && (
                <p className="text-xs text-center text-orange-500 animate-pulse">
                    Verifying secure link... please wait.
                </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
