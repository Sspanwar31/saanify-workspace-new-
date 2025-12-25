"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  CreditCard,
  FileText,
  LogOut,
  User,
  Settings
} from "lucide-react";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string | null;
  plan: string | null;
  trialEndsAt: string | null;
  expiryDate: string | null;
  createdAt: string;
  role: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUserData = useCallback(async () => {
    try {
      console.log('🔍 Client Dashboard: Fetching user data...')
      
      // First verify client access
      const verifyResponse = await fetch('/api/client/verify');
      
      console.log('🔍 Client Dashboard: Verify response status:', verifyResponse.status)
      
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 401) {
          const errorData = await verifyResponse.json();
          console.log('❌ Client Dashboard: Access denied:', errorData.error)
          setError(errorData.error || 'Access denied. Please login as a legitimate client.');
          setTimeout(() => {
            console.log('🔄 Client Dashboard: Redirecting to login...')
            router.push('/login');
          }, 3000);
          return;
        }
        throw new Error('Failed to verify client access');
      }

      const verifyData = await verifyResponse.json();
      console.log('✅ Client Dashboard: Verification successful:', verifyData.currentUser?.email)
      
      if (!verifyData.success) {
        setError(verifyData.error || 'Client verification failed');
        return;
      }

      // Set user data from verification response
      setUserData(verifyData.currentUser);
        
    } catch (err: any) {
      console.error('❌ Client Dashboard: Error:', err.message)
      setError(err.message || 'Failed to load client dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    if (!status) {
      return <AlertCircle className="h-4 w-4" />;
    }
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string | null, trialEndsAt: string | null) => {
    // Use trialEndsAt for trial users, expiryDate for paid users
    const relevantDate = trialEndsAt || expiryDate;
    if (!relevantDate) return null;
    const expiry = new Date(relevantDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">No user data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(userData.expiryDate, userData.trialEndsAt);
  
  // Determine which date to show
  const relevantExpiryDate = userData.trialEndsAt || userData.expiryDate;
  const dateLabel = userData.trialEndsAt ? 'Trial End Date' : 'Expiry Date';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                  {(userData.email === 'client1@gmail.com' || userData.email === 'client@saanify.com') && (
                    <Badge className="ml-2 bg-purple-100 text-purple-800">
                      Demo Account
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg font-semibold">{userData.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Type</p>
                  <p className="text-sm capitalize">
                    {userData.email === 'client1@gmail.com' || userData.email === 'client@saanify.com' 
                      ? 'Demo Client' 
                      : 'Real Client'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-sm">{formatDate(userData.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status Card */}
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
                  <p className="text-lg font-semibold capitalize">
                    {userData.plan || 'No Active Plan'}
                  </p>
                </div>

                {relevantExpiryDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">{dateLabel}</p>
                    <p className="text-sm">{formatDate(relevantExpiryDate)}</p>
                    {daysUntilExpiry !== null && (
                      <p className={`text-xs mt-1 ${
                        daysUntilExpiry <= 7 ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`}>
                        {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userData.subscriptionStatus === 'PENDING' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription is pending approval. You'll be notified once it's reviewed.
                    </AlertDescription>
                  </Alert>
                )}
                
                {userData.subscriptionStatus === 'REJECTED' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription was rejected. Please contact support or submit a new payment.
                    </AlertDescription>
                  </Alert>
                )}
                
                  {userData.subscriptionStatus === 'EXPIRED' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription has expired. Renew now to continue accessing the service.
                    </AlertDescription>
                  </Alert>
                )}

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

          {/* Additional Information */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Your Dashboard!</CardTitle>
                <CardDescription>
                  Here you can manage your subscription and account settings.
                </CardDescription>
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
        </div>
      </main>
    </div>
  );
}