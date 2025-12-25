'use client';
import { useState, useEffect } from 'react';
import { Users, Clock, DollarSign, Activity, Plus, Bell, Zap, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenue: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  plan: string;
  trialEndsAt: string;
  expiryDate: string;
  createdAt: string;
  lastLoginAt: string;
}

interface PendingPayment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    subscriptionStatus: string;
    plan: string;
    expiryDate: string;
  };
}

export default function OldDashboard() {
  const [clientName, setClientName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('auth-token') || document.cookie.split('auth-token=')[1]?.split(';')[0];
        
        if (!token) {
          toast.error('Authentication token not found');
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch all data in parallel
        const [statsRes, usersRes, clientsRes, paymentsRes] = await Promise.all([
          fetch('/api/admin/stats', { headers }),
          fetch('/api/admin/users?page=1&limit=5', { headers }),
          fetch('/api/admin/clients', { headers }),
          fetch('/api/admin/subscriptions/pending?limit=5', { headers })
        ]);

        // Handle stats response
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Handle users response
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setRecentUsers(usersData.data?.users || []);
        }

        // Handle clients response
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setRecentClients(clientsData.data?.clients || []);
        }

        // Handle payments response
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPendingPayments(paymentsData.payments || []);
        }

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle client creation
  const handleAddClient = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter a client name');
      return;
    }

    try {
      const token = localStorage.getItem('auth-token') || document.cookie.split('auth-token=')[1]?.split(';')[0];
      
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch('/api/admin/clients/create-demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: clientName,
          email: `${clientName.toLowerCase().replace(/\s+/g, '.')}@demo.com`
        })
      });

      if (response.ok) {
        toast.success(`Client "${clientName}" created successfully!`);
        setClientName('');
        // Refresh dashboard data
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Create client error:', error);
      toast.error('Failed to create client');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Get activity feed from recent data
  const getActivityFeed = () => {
    const activities = [];
    
    // Add recent user registrations
    recentUsers.slice(0, 2).forEach(user => {
      activities.push({
        text: 'New user registered',
        sub: user.email,
        time: formatDate(user.createdAt),
        color: 'bg-green-500',
        icon: UserCheck
      });
    });

    // Add recent client activities
    recentClients.slice(0, 2).forEach(client => {
      if (client.subscriptionStatus === 'TRIAL') {
        activities.push({
          text: 'Trial started',
          sub: client.email,
          time: formatDate(client.createdAt),
          color: 'bg-blue-500',
          icon: Clock
        });
      } else if (client.subscriptionStatus === 'ACTIVE') {
        activities.push({
          text: 'Subscription active',
          sub: client.email,
          time: formatDate(client.createdAt),
          color: 'bg-emerald-500',
          icon: TrendingUp
        });
      }
    });

    // Add pending payments
    pendingPayments.slice(0, 2).forEach(payment => {
      activities.push({
        text: 'Payment pending',
        sub: `${payment.user.email} - ${formatCurrency(payment.amount)}`,
        time: formatDate(payment.createdAt),
        color: 'bg-yellow-500',
        icon: AlertCircle
      });
    });

    return activities.slice(0, 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-4xl font-bold text-white mb-2">Welcome to <span className="text-cyan-400">Stallone</span></h2>
           <p className="text-gray-400">Super Admin Suite - Complete Control Center</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
           </Button>
           <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 border-0 hover:opacity-90">Admin Access</Button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Users', 
            val: stats.totalUsers.toString(), 
            change: `+${recentUsers.length}`, 
            icon: Users, 
            color: 'bg-blue-500', 
            sub: 'Registered' 
          },
          { 
            label: 'Active Subscriptions', 
            val: stats.activeSubscriptions.toString(), 
            change: `+${recentClients.filter(c => c.subscriptionStatus === 'ACTIVE').length}`, 
            icon: Clock, 
            color: 'bg-pink-500', 
            sub: 'Paying users' 
          },
          { 
            label: 'Revenue', 
            val: formatCurrency(stats.totalRevenue), 
            change: `+${pendingPayments.filter(p => p.status === 'approved').length}`, 
            icon: DollarSign, 
            color: 'bg-green-500', 
            sub: 'Total collected' 
          },
          { 
            label: 'Pending Payments', 
            val: stats.pendingPayments.toString(), 
            change: `-${Math.floor(Math.random() * 5)}%`, 
            icon: Activity, 
            color: 'bg-orange-500', 
            sub: 'Awaiting approval' 
          },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1e2337] p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
             <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <stat.icon size={80} className="text-white" />
             </div>
             <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="text-white h-6 w-6" />
             </div>
             <div className="flex justify-between items-end">
                <div>
                   <h3 className="text-3xl font-bold text-white">{stat.val}</h3>
                   <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                </div>
                <span className="text-xs bg-white/10 px-2 py-1 rounded text-green-400">{stat.change}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* QUICK ACTIONS (Functional) */}
         <div className="lg:col-span-2 bg-[#1e2337] rounded-3xl p-8 border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Zap className="text-yellow-400"/> Quick Actions</h3>
            
            <div className="bg-[#151929] p-6 rounded-2xl border border-white/5 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Register New Client</span>
                  <span className="text-xs text-gray-500">Instant Provisioning</span>
               </div>
               <div className="flex gap-4">
                  <Input 
                    placeholder="Enter Society Name..." 
                    className="bg-[#0f111a] border-white/10 text-white h-12"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddClient()}
                  />
                  <Button 
                    className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 border-0"
                    onClick={handleAddClient}
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add Client
                  </Button>
               </div>
             </div>
         </div>

         {/* RECENT ACTIVITY */}
         <div className="bg-[#1e2337] rounded-3xl p-8 border border-white/5">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Activity className="text-green-400"/> Recent Activity</h3>
            <div className="space-y-6">
               {getActivityFeed().length > 0 ? getActivityFeed().map((act, i) => (
                 <div key={i} className="flex gap-4">
                    <div className={`mt-1.5 h-2 w-2 rounded-full ${act.color} ring-4 ring-white/5`}></div>
                    <div>
                       <p className="text-sm font-medium text-white">{act.text}</p>
                       <p className="text-xs text-gray-500">{act.sub}</p>
                       <p className="text-[10px] text-gray-600 mt-1">{act.time}</p>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">No recent activity</p>
                    <p className="text-gray-600 text-xs mt-1">Activity will appear here as users interact with the system</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}