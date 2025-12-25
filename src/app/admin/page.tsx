'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Database, ShieldCheck, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);

  // 1. AUTH CHECK (LocalStorage)
  useEffect(() => {
    const checkAdmin = () => {
      // Filhal hum simple check kar rahe hain. 
      // Baad me hum Supabase Auth se check karenge.
      const isAdmin = localStorage.getItem('admin_session'); 
      
      // Note: Agar aapne login nahi kiya hai, to ye redirect karega.
      // Testing ke liye aap console me ye run kar sakte hain:
      // localStorage.setItem('admin_session', 'true')
      
      if (!isAdmin) {
        // router.push('/login'); // Uncomment this after proper login setup
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  // 2. DATABASE SETUP FUNCTION
  const handleSetupDatabase = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/admin/setup-db', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to setup DB');

      toast.success("Database Initialized Successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setDbLoading(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
        <p className="text-slate-500">System overview and management.</p>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-slate-500">Live data coming soon</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-slate-500">Vercel & Supabase Connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* AUTOMATION SECTION */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">System Automation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DATABASE CARD */}
            <Card className="border-blue-100 bg-blue-50/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600"/>
                        <CardTitle className="text-lg">Database Setup</CardTitle>
                    </div>
                    <CardDescription>
                        Create necessary tables (Clients, Invoices) in Supabase automatically.
                        Run this only once.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleSetupDatabase} 
                        disabled={dbLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {dbLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
                        {dbLoading ? 'Setting up...' : 'Initialize Database'}
                    </Button>
                </CardContent>
            </Card>

            {/* OTHER TOOLS (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">User Management</CardTitle>
                    <CardDescription>Manage client access and subscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={() => router.push('/admin/clients')}>
                        View All Clients
                    </Button>
                </CardContent>
            </Card>

        </div>
      </div>

    </div>
  );
}