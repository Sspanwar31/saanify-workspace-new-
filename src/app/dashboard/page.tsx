'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import { 
  TrendingUp, TrendingDown, Wallet, Building2, Smartphone, CheckCircle, 
  Users, Landmark, LogOut, Loader2, 
  CreditCard, AlertCircle, Clock 
} from 'lucide-react';

// Chart
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Utils
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/hooks/useCurrency';

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  // State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [financials, setFinancials] = useState({
    netProfit: 0, totalIncome: 0, totalExpense: 0,
    cashBal: 0, bankBal: 0, upiBal: 0, depositTotal: 0, pendingLoans: 0,
    activeMembers: 0, health: 0
  });

  // Helpers from Code 2
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null, trialEndsAt: string | null) => {
    const relevantDate = trialEndsAt || expiryDate;
    if (!relevantDate) return null;
    const diffTime = new Date(relevantDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Unified Data Fetch (Code 2 Auth + Code 1 Stats)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Verify User (Code 2 Logic)
      const verifyResponse = await fetch('/api/client/verify');
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to verify client access');
      }
      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        setError(verifyData.error || 'Client verification failed');
        setLoading(false);
        return;
      }

      const currentUser = verifyData.currentUser;
      setUser(currentUser);

      // 2. Fetch Financial Stats (Code 1 Logic)
      // API call jo humne pehle fix ki thi
      const societyId = currentUser.role === 'treasurer' ? currentUser.client_id : currentUser.id;

      const res = await fetch(`/api/admin/clients/${societyId}/stats`);
      const statsData = await res.json();

      if (res.ok && statsData.success) {
        setFinancials({
          netProfit: statsData.netProfit,
          totalIncome: statsData.debug?.income || 0,
          totalExpense: statsData.debug?.expense || 0,
          cashBal: statsData.debug?.ops || 0, 
          bankBal: 0, upiBal: 0, 
          depositTotal: 0,
          pendingLoans: statsData.loanCount || 0,
          activeMembers: statsData.memberCount || 0,
          health: statsData.healthScore || 0
        });
      }
    } catch (err: any) {
      console.error("Stats Fetch Error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  // Loading & Error States
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>;

  if (error && !user) {
     return (
       <div className="h-screen flex items-center justify-center">
         <Alert variant="destructive" className="max-w-md">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
           <Button onClick={() => fetchData()} className="mt-4 w-full">Try Again</Button>
         </Alert>
       </div>
     )
  }

  // Subscription Data Helpers
  const daysUntilExpiry = getDaysUntilExpiry(user?.expiryDate, user?.trialEndsAt);
  const subStatus = user?.subscriptionStatus;

  return (
    <div className="space-y-6 min-h-screen bg-gray-50">
      {/* 🚀 Header - Updated with Code 2 Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.society_name || 'Society Dashboard'}</h1>
            <Badge className={getStatusColor(subStatus)}>
              {subStatus ? subStatus.toUpperCase() : 'UNKNOWN'}
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">Financial Overview • {user?.name}</p>
        </div>
        <div className="flex gap-2">
           <Link href="/subscription">
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Subscription Alerts (From Code 2) */}
      {(subStatus === 'PENDING' || subStatus === 'EXPIRED' || subStatus === 'REJECTED' || (daysUntilExpiry !== null && daysUntilExpiry <= 7)) && (
        <Alert variant={subStatus === 'EXPIRED' || subStatus === 'REJECTED' ? 'destructive' : 'default'}>
            {subStatus === 'PENDING' && <Clock className="h-4 w-4" />}
            {(subStatus === 'EXPIRED' || subStatus === 'REJECTED') && <AlertCircle className="h-4 w-4" />}
            {(daysUntilExpiry !== null && daysUntilExpiry <= 7 && subStatus !== 'EXPIRED') && <AlertCircle className="h-4 w-4" />}
            
            <AlertDescription>
                <div className="flex justify-between items-center">
                    <span>
                        {subStatus === 'PENDING' && "Your subscription is pending approval."}
                        {subStatus === 'EXPIRED' && "Your subscription has expired. Renew now to continue."}
                        {subStatus === 'REJECTED' && "Your subscription was rejected. Please contact support."}
                        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && subStatus === 'ACTIVE' && `Subscription expires in ${daysUntilExpiry} days.`}
                    </span>
                    {subStatus !== 'ACTIVE' && (
                         <Link href="/subscription">
                            <Button size="sm" className="ml-4">View Details</Button>
                         </Link>
                    )}
                </div>
            </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards (Code 1 - Same) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`border-l-4 ${financials.netProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-slate-400 uppercase">Net Profit</p>
            <div className={`text-2xl font-bold mt-1 ${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financials.netProfit)}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900"><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Total Income</p><div className="text-2xl font-bold text-green-600">{formatCurrency(financials.totalIncome)}</div></CardContent></Card>
        <Card className="dark:bg-slate-900"><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Total Expense</p><div className="text-2xl font-bold text-red-600">{formatCurrency(financials.totalExpense)}</div></CardContent></Card>
        <Card className="dark:bg-slate-900"><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Health Score</p><div className="text-2xl font-bold text-blue-600">{financials.health}/100</div></CardContent></Card>
      </div>

      {/* Business Scale (Code 1 - Same) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900">
            <CardContent className="p-6 flex justify-between items-center">
               <div><p className="text-xs text-orange-600 font-bold uppercase">Total Members</p><h4 className="text-3xl font-bold text-orange-900 dark:text-orange-400">{financials.activeMembers}</h4></div>
               <Users className="h-10 w-10 text-orange-400" />
            </CardContent>
         </Card>
         <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900">
            <CardContent className="p-6 flex justify-between items-center">
               <div><p className="text-xs text-blue-600 font-bold uppercase">Active Loans</p><h4 className="text-3xl font-bold text-blue-900 dark:text-blue-400">{financials.pendingLoans}</h4></div>
               <Landmark className="h-10 w-10 text-blue-400" />
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
