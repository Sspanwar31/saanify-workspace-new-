'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck, CheckCircle2, Building2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // --- LOGIN LOGIC (Same as before + Auto Healing) ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (loginError) {
        // Auto-fix for Super Admin Dev only
        if (formData.email === 'admin@saanify.com' && loginError.message.includes("Invalid")) {
            await createSuperAdmin();
            return;
        }
        throw loginError;
      }

      if (loginData.user) {
        await checkRoleAndRedirect(loginData.user.id);
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Access Denied", { description: "Invalid credentials or account inactive." });
      setLoading(false);
    }
  };

  // --- ROLE CHECKING LOGIC ---
  const checkRoleAndRedirect = async (userId: string) => {
    try {
        // 1. Check Super Admin
        const { data: admin } = await supabase.from('admins').select('*').eq('id', userId).single();
        if (admin) {
            localStorage.setItem('admin_session', 'true');
            toast.success("Welcome Super Admin");
            router.push('/admin');
            return;
        }

        // 2. Check Client (Society Owner)
        const { data: client } = await supabase.from('clients').select('*').eq('id', userId).single();
        if (client) {
            localStorage.setItem('current_user', JSON.stringify(client));
            toast.success(`Welcome ${client.society_name || 'Admin'}`);
            router.push('/dashboard');
            return;
        }

        // 3. Check Member / Treasurer
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

        throw new Error("Profile not linked.");

    } catch (error: any) {
        toast.error("Login Failed", { description: "User authenticated but profile not found." });
        setLoading(false);
    }
  };

  // --- FORGOT PASSWORD LOGIC (New) ---
  const handleForgotPassword = async () => {
    if (!formData.email) {
        toast.error("Email Required", { description: "Please enter your email to reset password." });
        return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/update-password`,
    });
    setResetLoading(false);

    if (error) {
        toast.error("Error", { description: error.message });
    } else {
        toast.success("Check your Email", { description: "Password reset link sent successfully." });
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
    <div className="min-h-screen w-full grid lg:grid-cols-5 bg-[#F9FAFB]">
      
      {/* 🔹 LEFT PANEL: HERO & BRANDING (60%) */}
      <div className="hidden lg:flex lg:col-span-3 bg-[#0B132B] relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Abstract Background Pattern */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1C2541] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#3A86FF] rounded-full blur-[100px] opacity-20 translate-y-1/4 -translate-x-1/4"></div>

        {/* Content */}
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                    <Building2 className="w-6 h-6 text-[#3A86FF]" />
                </div>
                <span className="text-2xl font-bold tracking-wide">Saanify</span>
            </div>

            <h1 className="text-5xl font-bold leading-tight mb-6">
                Smart Society <br/> 
                <span className="text-[#3A86FF]">Financial Management</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-lg mb-8 leading-relaxed">
                Manage deposits, loans, expenses, and compliance in one secure platform. 
                Bank-grade security for your peace of mind.
            </p>

            <div className="space-y-4">
                {['Bank-grade Security & Encryption', 'Used by 100+ Societies', 'GST & Audit Ready'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium">{item}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/10 mt-auto">
            <p className="text-sm text-slate-400">Trusted by societies across India</p>
        </div>
      </div>

      {/* 🔹 RIGHT PANEL: LOGIN CARD (40%) */}
      <div className="lg:col-span-2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-[400px] space-y-8">
            
            {/* Mobile Logo (Visible only on small screens) */}
            <div className="lg:hidden flex justify-center mb-6">
                <div className="flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-[#0B132B]" />
                    <span className="text-2xl font-bold text-[#0B132B]">Saanify</span>
                </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">
                    <ShieldCheck className="w-3 h-3" /> Secure Access Portal
                </div>
                <h2 className="text-3xl font-bold text-[#111827]">Welcome Back</h2>
                <p className="text-[#6B7280]">Sign in to manage your society finances</p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-2">
                    <Label className="text-[#111827] font-medium">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                        <Input 
                            type="email" 
                            placeholder="name@society.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="pl-11 h-12 bg-white border-[#E5E7EB] focus:border-[#3A86FF] focus:ring-[#3A86FF] rounded-lg shadow-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[#111827] font-medium">Password</Label>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="pl-11 pr-11 h-12 bg-white border-[#E5E7EB] focus:border-[#3A86FF] focus:ring-[#3A86FF] rounded-lg shadow-sm"
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 bg-[#3A86FF] hover:bg-[#2563EB] text-white font-semibold text-lg rounded-lg shadow-md shadow-blue-500/20 transition-all duration-200"
                >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Secure Login'}
                </Button>
            </form>

            {/* Footer Actions */}
            <div className="flex items-center justify-between text-sm mt-6">
                <button 
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[#3A86FF] font-medium hover:underline disabled:opacity-50"
                >
                    {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
                <a href="#" className="text-[#6B7280] hover:text-[#111827] transition-colors">
                    Contact Support
                </a>
            </div>

            {/* Trust Footer */}
            <div className="border-t border-gray-100 pt-6 mt-8 flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium">
                    <Lock className="w-3 h-3" />
                    <span>256-bit Encryption</span>
                    <span className="text-gray-300">•</span>
                    <span>RBI Compliant</span>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
