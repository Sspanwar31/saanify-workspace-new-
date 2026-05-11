"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Icons
import { 
  CheckCircle, Clock, AlertCircle, Calendar, CreditCard, FileText, LogOut, User, Settings, 
  TrendingUp, TrendingDown, Users, Landmark, Loader2 
} from "lucide-react";

// Utils
import { useCurrency } from "@/hooks/useCurrency";

interface UserData {
  id: string;
  name: string;
  email: string;
  society_name?: string; // Optional in case it comes from API
  role?: string;
  client_id?: string;
  subscriptionStatus: string | null;
  plan: string | null;
  trialEndsAt: string | null;
  expiryDate: string | null;
  createdAt: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  // User & Subscription State
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Financial Stats State (From Code 1)
  const [stats, setStats] = useState({
    members: 0, loans: 0, profit: 0, income: 0, expense: 0, health: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Verify Client Access (Code 2 Logic)
      const verifyResponse = await fetch('/api/client/verify');
      
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 401) {
          const errorData = await verifyResponse.json();
          setError(errorData.error || 'Access denied. Please login as a legitimate client.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }
        throw new Error('Failed to verify client access');
      }

      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        setError(verifyData.error || 'Client verification failed');
        return;
      }

      const currentUser = verifyData.currentUser;
      setUserData(currentUser);

      // 2. Fetch Financial Stats (Code 1 Logic)
      // Resolve Society ID (Owner ya Treasurer check)
      const societyId = currentUser.role === 'treasurer' ? currentUser.client_id : currentUser.id;

      if (societyId) {
        const res = await fetch(`/api/admin/clients/${societyId}/stats`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStats({
            members: data.memberCount || 0,
            loans: data.loanCount || 0,
            profit: data.netProfit || 0,
            income: data.debug?.income || 0,
            expense: data.debug?.expense || 0,
            health: data.healthScore || 0
          });
        }
      }
        
    } catch (err: any) {
      console.error('❌ Client Dashboard: Error:', err.message)
      setError(err.message || 'Failed to load client dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // --- Helper Functions (From Code 2) ---
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

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status) return <AlertCircle className="h-4 w-4" />;
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string | null, trialEndsAt: string | null) => {
    const relevantDate = trialEndsAt || expiryDate;
    if (!relevantDate) return null;
    const diffTime = new Date(relevantDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 h-12 w-12 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => fetchData()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData) return null;

  const daysUntilExpiry = getDaysUntilExpiry(userData.expiryDate, userData.trialEndsAt);
  const relevantExpiryDate = userData.trialEndsAt || userData.expiryDate;
  const dateLabel = userData.trialEndsAt ? 'Trial End Date' : 'Expiry Date';

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {userData.society_name || 'Dashboard'}
              </h1>
              <Badge variant={userData.subscriptionStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                {userData.subscriptionStatus}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Subscription Alerts (Code 2) */}
        {(userData.subscriptionStatus === 'PENDING' || userData.subscriptionStatus === 'EXPIRED' || userData.subscriptionStatus === 'REJECTED' || (daysUntilExpiry !== null && daysUntilExpiry <= 7)) && (
          <div className="mb-6">
            <Alert variant={userData.subscriptionStatus === 'EXPIRED' || userData.subscriptionStatus === 'REJECTED' ? 'destructive' : 'default'}>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>
                    {userData.subscriptionStatus === 'PENDING' && "Your subscription is pending approval."}
                    {userData.subscriptionStatus === 'EXPIRED' && "Your subscription has expired. Renew now to continue."}
                    {userData.subscriptionStatus === 'REJECTED' && "Your subscription was rejected. Please contact support."}
                    {daysUntilExpiry !== null && daysUntilExpiry <= 7 && userData.subscriptionStatus === 'ACTIVE' && `Subscription expires in ${daysUntilExpiry} days.`}
                  </span>
                  {userData.subscriptionStatus !== 'ACTIVE' && (
                    <Link href="/subscription">
                      <Button size="sm" className="ml-4">View Details</Button>
                    </Link>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Section 1: Financial Stats (Code 1) */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Net Profit */}
            <Card className={`border-l-4 ${stats.profit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-6">
                <p className="text-xs font-bold text-slate-400 uppercase">Net Profit</p>
                <div className={`text-2xl font-bold mt-1 ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.profit)}
                </div>
              </CardContent>
            </Card>
            {/* Income */}
            <Card><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Income</p><div className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</div></CardContent></Card>
            {/* Expense */}
            <Card><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Expenses</p><div className="text-2xl font-bold text-red-600">{formatCurrency(stats.expense)}</div></CardContent></Card>
            {/* Health Score */}
            <Card><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Health Score</p><div className="text-2xl font-bold text-blue-600">{stats.health}/100</div></CardContent></Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section 2: Profile Info (Code 2) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
                {(userData.email === 'client1@gmail.com' || userData.email === 'client@saanify.com') && (
                  <Badge className="ml-2 bg-purple-100 text-purple-800">Demo Account</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-sm font-medium text-gray-500">Name</p><p className="text-lg font-semibold">{userData.name}</p></div>
              <div><p className="text-sm font-medium text-gray-500">Email</p><p className="text-sm">{userData.email}</p></div>
              <div><p className="text-sm font-medium text-gray-500">Member Since</p><p className="text-sm">{formatDate(userData.createdAt)}</p></div>
            </CardContent>
          </Card>

          {/* Section 3: Subscription Status (Code 2) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <Badge className={getStatusColor(userData.subscriptionStatus)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(userData.subscriptionStatus)}
                    <span>{userData.subscriptionStatus ? userData.subscriptionStatus.toUpperCase() : 'UNKNOWN'}</span>
                  </div>
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Plan</p>
                <p className="text-lg font-semibold capitalize">{userData.plan || 'No Active Plan'}</p>
              </div>
              {relevantExpiryDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">{dateLabel}</p>
                  <p className="text-sm">{formatDate(relevantExpiryDate)}</p>
                  {daysUntilExpiry !== null && (
                    <p className={`text-xs mt-1 ${daysUntilExpiry <= 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Quick Actions (Code 2) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {userData.subscriptionStatus !== 'ACTIVE' && (
                  <Link href="/subscription">
                    <Button className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {userData.subscriptionStatus === 'PENDING' ? 'View Payment Status' : 'Upgrade Plan'}
                    </Button>
                  </Link>
                )}
                <Link href="/subscription/history">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Payment History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 5: Business Scale (Code 1) */}
        <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Scale</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-orange-50 border-orange-100 dark:bg-orange-900/10">
                  <CardContent className="p-6 flex justify-between items-center">
                     <div><p className="text-xs text-orange-600 font-bold uppercase">Total Members</p><h4 className="text-3xl font-bold text-orange-900">{stats.members}</h4></div>
                     <Users className="h-10 w-10 text-orange-400" />
                  </CardContent>
               </Card>
               <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/10">
                  <CardContent className="p-6 flex justify-between items-center">
                     <div><p className="text-xs text-blue-600 font-bold uppercase">Active Loans</p><h4 className="text-3xl font-bold text-blue-900">{stats.loans}</h4></div>
                     <Landmark className="h-10 w-10 text-blue-400" />
                  </CardContent>
               </Card>
            </div>
        </div>

        {/* Footer Info (Code 2) */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Your Dashboard!</CardTitle>
              <CardDescription>Here you can manage your subscription and account settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium">Easy Planning</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage your subscription dates</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium">Quick Approval</h3>
                  <p className="text-sm text-gray-600 mt-1">Fast payment processing</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium">Secure Payments</h3>
                  <p className="text-sm text-gray-600 mt-1">Safe transaction processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
