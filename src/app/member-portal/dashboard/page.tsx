'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, AlertCircle, Plus, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Note: Remove LoanRequestModal import if not needed, or update it later.

export default function MemberDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [stats, setStats] = useState({ savings: 0, loan: 0 });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // 1. Check Session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // 2. Fetch Member Profile
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (memberData) {
            setMember(memberData);

            // 3. Fetch Savings (Sum of Deposit - Withdraw)
            const { data: passbook } = await supabase
                .from('passbook_entries')
                .select('deposit_amount')
                .eq('member_id', memberData.id);
            
            const totalSavings = passbook?.reduce((acc, curr) => acc + (Number(curr.deposit_amount) || 0), 0) || 0;

            // 4. Fetch Active Loan
            const { data: loans } = await supabase
                .from('loans')
                .select('remaining_balance')
                .eq('member_id', memberData.id)
                .eq('status', 'active');

            const totalLoan = loans?.reduce((acc, curr) => acc + (Number(curr.remaining_balance) || 0), 0) || 0;

            setStats({ savings: totalSavings, loan: totalLoan });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!member) return <div className="p-6 text-center">Profile not found. Contact Admin.</div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Header */}
      <div className="flex justify-between items-start">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">{greeting}, {member.name.split(' ')[0]}</h2>
           <div className="flex items-center gap-2 mt-1">
             <span className={`h-2.5 w-2.5 rounded-full ${member.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
             <p className="text-sm text-gray-500 font-medium capitalize">
               {member.status} Account
             </p>
           </div>
        </div>
      </div>

      {/* 2. Financial Cards */}
      <div className="grid grid-cols-2 gap-4">
         {/* Savings */}
         <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet size={80} /></div>
            <CardContent className="p-5 flex flex-col justify-between h-full">
               <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Total Savings</p>
               <h3 className="text-2xl font-bold mb-3">₹{stats.savings.toLocaleString('en-IN')}</h3>
               <Link href="/member-portal/passbook" className="mt-auto">
                 <div className="flex items-center gap-1 text-xs text-emerald-100 bg-white/20 px-2 py-1 rounded-lg w-fit backdrop-blur-sm">
                    View <ArrowUpRight size={12} />
                 </div>
               </Link>
            </CardContent>
         </Card>

         {/* Loan */}
         <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10"><AlertCircle size={80} /></div>
            <CardContent className="p-5 flex flex-col justify-between h-full">
               <p className="text-rose-100 text-xs font-bold uppercase tracking-wider mb-1">Outstanding Loan</p>
               <h3 className="text-2xl font-bold mb-3">₹{stats.loan.toLocaleString('en-IN')}</h3>
               <Link href="/member-portal/loans" className="mt-auto">
                 <div className="flex items-center gap-1 text-xs text-rose-100 bg-white/20 px-2 py-1 rounded-lg w-fit backdrop-blur-sm">
                    Details <ArrowUpRight size={12} />
                 </div>
               </Link>
            </CardContent>
         </Card>
      </div>

      {/* 3. Request Funds */}
      <Card className="border border-orange-100 bg-orange-50/80 rounded-2xl shadow-sm">
         <CardContent className="p-5 flex items-center justify-between">
            <div>
               <h4 className="font-bold text-gray-900 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-orange-600" /> Need Funds?
               </h4>
               <p className="text-xs text-gray-500 mt-1">Apply for a new loan instantly</p>
            </div>
            <Link href="/member-portal/loans">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-200/50 px-6">
                <Plus className="w-4 h-4 mr-1" /> Request
                </Button>
            </Link>
         </CardContent>
      </Card>
    </div>
  );
}
