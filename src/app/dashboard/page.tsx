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
  CheckCircle, AlertCircle, Users, Landmark, TrendingUp, TrendingDown, Loader2, 
  Clock, Calendar, CreditCard, FileText, LogOut, User, Settings 
} from "lucide-react";

// Utils
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/hooks/useCurrency";

export default function ClientDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    members: 0, loans: 0, profit: 0, income: 0, expense: 0, health: 0
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 🚀 1. Layout ne jo user set kiya hai usey LocalStorage se uthao (Code 1 Logic)
      const savedUser = localStorage.getItem('current_user');
      if (!savedUser) {
        // Agar data nahi hai toh session check karein
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
      } else {
        const profile = JSON.parse(savedUser);
        setUser(profile);

        // 🚀 2. Resolve Society ID (Owner ID)
        const societyId = profile.role === 'treasurer' ? profile.client_id : profile.id;

        // 🚀 3. Fetch Real Stats (Using our Fixed Admin API)
        // Ye API kabhi fail nahi hogi kyunki ye RLS bypass karti hai
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
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // --- Helper Functions (Code 2 - for UI) ---
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(user?.expiryDate, user?.trialEndsAt);
  const relevantExpiryDate = user?.trialEndsAt || user?.expiryDate;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header - Merged */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {user?.society_name || 'Dashboard'}
              </h1>
              <Badge variant={user?.subscriptionStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                {user?.subscriptionStatus}
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
        {/* Alerts Section (Code 2) */}
        {(user?.subscriptionStatus === 'PENDING' || user?.subscriptionStatus === 'EXPIRED' || user?.subscriptionStatus === 'REJECTED' || (daysUntilExpiry !== null && daysUntilExpiry <= 7)) && (
          <div className="mb-6">
            <Alert variant={user?.subscriptionStatus === 'EXPIRED' || user?.subscriptionStatus === 'REJECTED' ? 'destructive' : 'default'}>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>
                    {user?.subscriptionStatus === 'PENDING' && "Your subscription is pending approval."}
                    {user?.subscriptionStatus === 'EXPIRED' && "Your subscription has expired. Renew now to continue."}
                    {user?.subscriptionStatus === 'REJECTED' && "Your subscription was rejected. Please contact support."}
                    {daysUntilExpiry !== null && daysUntilExpiry <= 7 && user?.subscriptionStatus === 'ACTIVE' && `Subscription expires in ${daysUntilExpiry} days.`}
                  </span>
                  {user?.subscriptionStatus !== 'ACTIVE' && (
                    <Link href="/subscription">
                      <Button size="sm" className="ml-4">View Details</Button>
                    </Link>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Financial Overview Section (Code 1) */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={`border-l-4 ${stats.profit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-6">
                <p className="text-xs font-bold text-slate-400 uppercase">Net Profit</p>
                <div className={`text-2xl font-bold mt-1 ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.profit)}
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Income</p><div className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Expenses</p><div className="text-2xl font-bold text-red-600">{formatCurrency(stats.expense)}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs font-bold text-slate-400 uppercase">Health Score</p><div className="text-2xl font-bold text-blue-600">{stats.health}/100</div></CardContent></Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card (Code 2) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
                {(user?.email === 'client1@gmail.com' || user?.email === 'client@saanify.com') && (
                  <Badge className="ml-2 bg-purple-100 text-purple-800">Demo Account</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><p className="text-sm font-medium text-gray-500">Name</p><p className="text-lg font-semibold">{user?.name}</p></div>
              <div><p className="text-sm font-medium text-gray-500">Email</p><p className="text-sm">{user?.email}</p></div>
              <div><p className="text-sm font-medium text-gray-500">Member Since</p><p className="text-sm">{formatDate(user?.createdAt)}</p></div>
            </CardContent>
          </Card>

          {/* Subscription Status Card (Code 2) */}
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
                <Badge className={getStatusColor(user?.subscriptionStatus)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(user?.subscriptionStatus)}
                    <span>{user?.subscriptionStatus ? user.subscriptionStatus.toUpperCase() : 'UNKNOWN'}</span>
                  </div>
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Plan</p>
                <p className="text-lg font-semibold capitalize">{user?.plan || 'No Active Plan'}</p>
              </div>
              {relevantExpiryDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">{user?.trialEndsAt ? 'Trial End Date' : 'Expiry Date'}</p>
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

          {/* Quick Actions Card (Code 2) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {user?.subscriptionStatus !== 'ACTIVE' && (
                  <Link href="/subscription">
                    <Button className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {user?.subscriptionStatus === 'PENDING' ? 'View Payment Status' : 'Upgrade Plan'}
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

        {/* Business Scale (Code 1) */}
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
